// src/ai/gemini.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from "@google/genai";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { Course } from '../cours/entities/course.entity';
import { Subject } from '../subject/entities/subject.entity';
import { User } from '../user/entities/user.entity';

export interface StructuredResponse {
  answer: string;
  source: string;
  teacher: string;
  subject: string;
  location: string;
  summary: string;
  confidence: number;
  courseAnalysis?: string; // New field for AI-powered course analysis
  relatedCourses?: any[];
  exactMatch?: boolean;
}

interface SearchResult {
  course: Course;
  relevance: number;
  matchedContent: string;
  matchType: 'title' | 'description' | 'subject' | 'content';
}

@Injectable()
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private readonly logger = new Logger(GeminiService.name);
  private isConfigured = false;
  private useMockResponses = true;

  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.initialize();
  }

  // src/ai/gemini.service.ts
private initialize() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Debug logging
  console.log('🔑 Environment GEMINI_API_KEY:', apiKey ? '***' + apiKey.slice(-4) : 'NOT_SET');
  console.log('🔑 All environment variables:', Object.keys(process.env).filter(key => 
    key.includes('GEMINI') || key.includes('API') || key.includes('KEY')
  ));
  
  if (!apiKey) {
    this.logger.warn('🚫 GEMINI_API_KEY is not set - using mock AI responses');
    this.useMockResponses = true;
    return;
  }

  if (apiKey.includes('xxxx') || apiKey === 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
    this.logger.warn('🚫 Placeholder API key detected - using mock AI responses');
    this.useMockResponses = true;
    return;
  }

  if (apiKey.length < 10) {
    this.logger.warn('🚫 API key seems too short - using mock AI responses');
    this.useMockResponses = true;
    return;
  }

  try {
    this.logger.log('🔧 Attempting to initialize Gemini AI with provided API key...');
    this.ai = new GoogleGenAI({ apiKey });
    this.isConfigured = true;
    this.useMockResponses = false;
    this.logger.log('✅ Gemini AI service initialized successfully!');
  } catch (error) {
    this.logger.error('❌ Failed to initialize Gemini AI:', error);
    this.useMockResponses = true;
  }
}

  async generateCourseSpecificResponse(
    query: string, 
    userId: number,
    subjectId?: number,
    courseId?: number
  ): Promise<StructuredResponse> {
    
    // First, search in database for relevant courses
    const searchResults = await this.searchCoursesInDatabase(query, subjectId, courseId, userId);
    
    if (this.useMockResponses || !this.ai) {
      return this.generateDatabaseDrivenResponse(query, searchResults);
    }

    try {
      const prompt = this.createIntelligentSearchPrompt(query, searchResults);
      
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const structuredResponse = this.parseStructuredResponse(response.text, searchResults);
      
      // Generate course analysis for the best match
      if (searchResults.length > 0) {
        const courseAnalysis = await this.generateCourseAnalysis(searchResults[0].course);
        structuredResponse.courseAnalysis = courseAnalysis;
      }
      
      return structuredResponse;
      
    } catch (error: any) {
      this.logger.error('❌ AI course search failed:', error);
      return this.generateDatabaseDrivenResponse(query, searchResults);
    }
  }

  private async generateCourseAnalysis(course: Course): Promise<string> {
    try {
      const analysisPrompt = this.createCourseAnalysisPrompt(course);
      
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: analysisPrompt,
      });

      return response.text;
      
    } catch (error: any) {
      this.logger.error('❌ Course analysis generation failed:', error);
      return this.generateDefaultCourseAnalysis(course);
    }
  }

  private createCourseAnalysisPrompt(course: Course): string {
    return `
You are SmartCampus AI, an intelligent educational analyst for a university platform.
Your role is to provide comprehensive analysis and insights about course materials.

COURSE TO ANALYZE:
- Title: ${course.title}
- Description: ${course.description || 'No description available'}
- Subject: ${course.subjectRelation?.name || course.subject || 'Unknown Subject'}
- Teacher: ${course.teacher?.first_name} ${course.teacher?.last_name}
- File: ${course.originalFileName || course.filePath || 'No specific file'}

Please provide a comprehensive analysis of this course that includes:

1. **Content Overview**: What main topics and concepts are likely covered based on the title and description?
2. **Learning Objectives**: What students can expect to learn from this course
3. **Difficulty Level**: Estimated complexity (Beginner/Intermediate/Advanced)
4. **Practical Applications**: How this knowledge can be applied in real-world scenarios
5. **Prerequisites**: What background knowledge might be helpful
6. **Study Recommendations**: Best approaches to study this material effectively
7. **Career Relevance**: How this course relates to professional development

Format your analysis in clear, organized paragraphs. Be insightful but concise.
Focus on providing value to students who want to understand the course content deeply.

If the course information is limited, make reasonable inferences based on the title and subject.
    `.trim();
  }

  private generateDefaultCourseAnalysis(course: Course): string {
    return `
**Course Analysis: ${course.title}**

**Content Overview**: This course appears to cover fundamental concepts related to ${course.subjectRelation?.name || course.subject || 'the subject matter'}. Based on the title "${course.title}", students can expect to explore key principles and applications in this field.

**Learning Objectives**: Students will likely develop a solid understanding of core concepts and practical skills relevant to ${course.subjectRelation?.name || course.subject || 'the subject'}. The course aims to build foundational knowledge that can be applied in academic and professional contexts.

**Difficulty Level**: The difficulty appears to be at an intermediate level, suitable for students with some background in the subject area.

**Practical Applications**: The knowledge gained from this course can be applied in various real-world scenarios, including problem-solving, analysis, and practical implementation of ${course.subjectRelation?.name || course.subject || 'subject-specific'} concepts.

**Study Recommendations**: To succeed in this course, students should engage actively with the materials, participate in discussions, and practice applying the concepts through exercises and projects.

**Career Relevance**: This course provides valuable knowledge that can enhance career prospects in related fields and industries.
    `.trim();
  }

  private async searchCoursesInDatabase(
    query: string, 
    subjectId?: number, 
    courseId?: number,
    userId?: number
  ): Promise<SearchResult[]> {
    try {
      const searchTerms = this.extractSearchTerms(query);
      const results: SearchResult[] = [];

      // Build query conditions
      const whereConditions: any = {};
      
      if (subjectId) {
        whereConditions.subjectRelation = { id: subjectId };
      }
      
      if (courseId) {
        whereConditions.id = courseId;
      }

      // Get courses from database
      const courses = await this.courseRepository.find({
        where: whereConditions,
        relations: ['teacher', 'subjectRelation', 'classes'],
        take: 20 // Limit for performance
      });

      // Search through each course
      for (const course of courses) {
        let relevance = 0;
        let matchedContent = '';
        let matchType: SearchResult['matchType'] = 'title';

        // Check title match
        const titleMatch = this.calculateRelevance(query, course.title);
        if (titleMatch > relevance) {
          relevance = titleMatch;
          matchedContent = course.title;
          matchType = 'title';
        }

        // Check description match
        if (course.description) {
          const descMatch = this.calculateRelevance(query, course.description);
          if (descMatch > relevance) {
            relevance = descMatch;
            matchedContent = course.description;
            matchType = 'description';
          }
        }

        // Check subject match
        if (course.subject) {
          const subjectMatch = this.calculateRelevance(query, course.subject);
          if (subjectMatch > relevance) {
            relevance = subjectMatch;
            matchedContent = course.subject;
            matchType = 'subject';
          }
        }

        // Check subject relation name
        if (course.subjectRelation?.name) {
          const subjectRelationMatch = this.calculateRelevance(query, course.subjectRelation.name);
          if (subjectRelationMatch > relevance) {
            relevance = subjectRelationMatch;
            matchedContent = course.subjectRelation.name;
            matchType = 'subject';
          }
        }

        // Only include relevant results
        if (relevance > 0.1) {
          results.push({
            course,
            relevance,
            matchedContent,
            matchType
          });
        }
      }

      // Sort by relevance
      return results.sort((a, b) => b.relevance - a.relevance);

    } catch (error) {
      this.logger.error('Error searching courses in database:', error);
      return [];
    }
  }

  private extractSearchTerms(query: string): string[] {
    // Remove common words and split into terms
    const commonWords = ['what', 'where', 'how', 'when', 'why', 'is', 'are', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2 && !commonWords.includes(term));
  }

  private calculateRelevance(query: string, text: string): number {
    if (!text) return 0;
    
    const queryTerms = this.extractSearchTerms(query);
    const textLower = text.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      if (textLower.includes(term)) {
        score += 1;
        // Bonus for exact matches
        if (textLower === term) score += 2;
        // Bonus for beginning of words
        if (textLower.includes(` ${term}`) || textLower.startsWith(term)) score += 0.5;
      }
    }

    // Normalize score
    return Math.min(score / queryTerms.length, 1);
  }

  private createIntelligentSearchPrompt(query: string, searchResults: SearchResult[]): string {
    const courseContext = searchResults.map((result, index) => 
      `COURSE ${index + 1}:
- Title: ${result.course.title}
- Description: ${result.course.description || 'No description'}
- Subject: ${result.course.subjectRelation?.name || result.course.subject || 'No subject'}
- Teacher: ${result.course.teacher?.first_name} ${result.course.teacher?.last_name}
- File: ${result.course.filePath || 'No file'}
- Match: ${result.matchType} (${(result.relevance * 100).toFixed(0)}% relevant)
- Matched Content: "${result.matchedContent}"`
    ).join('\n\n');

    return `
You are SmartCampus AI, an intelligent course content finder for a university platform.
Your role is to help students find EXACT locations of information in their course materials.

STUDENT QUESTION: "${query}"

RELEVANT COURSES FOUND IN DATABASE:
${courseContext.length > 0 ? courseContext : 'No specific courses found matching your query.'}

INSTRUCTIONS:
1. Analyze which course(s) best answer the student's question
2. Provide SPECIFIC guidance on WHERE to find the information
3. Mention the EXACT teacher, subject, and file location
4. If multiple courses are relevant, mention the most relevant one first
5. If no exact match, suggest the closest relevant courses
6. Provide a helpful summary of what they'll find

RESPONSE FORMAT (STRICT):
ANSWER: [Direct answer mentioning the most relevant course]
SOURCE: [Exact course title and specific location]
TEACHER: [Full teacher name]
SUBJECT: [Subject name from database]
LOCATION: [Specific file path, chapter, or section]
SUMMARY: [2-3 sentence summary of what they'll find]
CONFIDENCE: [0.1-1.0 based on match quality]

BE SPECIFIC ABOUT LOCATIONS:
- Mention exact file names: "${searchResults[0]?.course.originalFileName}"
- Reference specific sections: "Chapter 3, Section 2.1"
- Guide to exact pages: "Pages 15-20 in the PDF"
- Mention upload dates if helpful

If no good matches found, be honest but helpful.
    `.trim();
  }

  private parseStructuredResponse(aiText: string, searchResults: SearchResult[]): StructuredResponse {
    try {
      // Get best match from database search
      const bestMatch = searchResults[0];
      
      // Default response based on database results
      const defaultResponse: StructuredResponse = {
        answer: bestMatch ? 
          `I found relevant information in your course "${bestMatch.course.title}".` :
          "I couldn't find specific information about this in your available course materials.",
        source: bestMatch ? bestMatch.course.title : "General knowledge",
        teacher: bestMatch ? 
          `${bestMatch.course.teacher?.first_name} ${bestMatch.course.teacher?.last_name}` : 
          "Unknown Teacher",
        subject: bestMatch ? 
          (bestMatch.course.subjectRelation?.name || bestMatch.course.subject || "General") : 
          "General",
        location: bestMatch ? 
          `File: ${bestMatch.course.originalFileName || bestMatch.course.filePath || 'Course materials'}` : 
          "Not specified in available materials",
        summary: bestMatch ?
          `This information is covered in ${bestMatch.course.title}. ${bestMatch.course.description || 'Check the course materials for detailed information.'}` :
          "This topic may not be covered in your current courses. Consider asking your teacher for additional resources.",
        confidence: bestMatch ? Math.min(bestMatch.relevance * 1.2, 0.95) : 0.3,
        relatedCourses: searchResults.slice(0, 3).map(result => ({
          title: result.course.title,
          teacher: `${result.course.teacher?.first_name} ${result.course.teacher?.last_name}`,
          subject: result.course.subjectRelation?.name || result.course.subject,
          relevance: Math.round(result.relevance * 100),
          filePath: result.course.filePath
        })),
        exactMatch: bestMatch?.relevance > 0.7
      };

      if (!aiText) return defaultResponse;

      // Parse AI response but use database values as fallback
      const lines = aiText.split('\n');
      const response: StructuredResponse = { ...defaultResponse };

      for (const line of lines) {
        if (line.startsWith('ANSWER:')) {
          response.answer = line.replace('ANSWER:', '').trim();
        } else if (line.startsWith('SOURCE:')) {
          response.source = line.replace('SOURCE:', '').trim();
        } else if (line.startsWith('TEACHER:') && !line.includes('undefined')) {
          response.teacher = line.replace('TEACHER:', '').trim();
        } else if (line.startsWith('SUBJECT:') && !line.includes('General')) {
          response.subject = line.replace('SUBJECT:', '').trim();
        } else if (line.startsWith('LOCATION:')) {
          response.location = line.replace('LOCATION:', '').trim();
        } else if (line.startsWith('SUMMARY:')) {
          response.summary = line.replace('SUMMARY:', '').trim();
        } else if (line.startsWith('CONFIDENCE:')) {
          const confidence = parseFloat(line.replace('CONFIDENCE:', '').trim());
          if (!isNaN(confidence)) {
            response.confidence = confidence;
          }
        }
      }

      return response;

    } catch (error) {
      this.logger.error('Error parsing structured response:', error);
      return this.generateDatabaseDrivenResponse("", searchResults);
    }
  }

  private generateDatabaseDrivenResponse(query: string, searchResults: SearchResult[]): StructuredResponse {
    const bestMatch = searchResults[0];
    
    if (!bestMatch) {
      return {
        answer: "I couldn't find specific information about this topic in your available course materials.",
        source: "Course Database Search",
        teacher: "No specific teacher",
        subject: "General",
        location: "Not found in current courses",
        summary: "This topic doesn't appear to be covered in your enrolled courses. You might want to consult with your teacher or check additional resources.",
        confidence: 0.1,
        relatedCourses: [],
        exactMatch: false
      };
    }

    const response: StructuredResponse = {
      answer: `Based on your courses, I found relevant information about "${query}" in "${bestMatch.course.title}".`,
      source: bestMatch.course.title,
      teacher: `${bestMatch.course.teacher?.first_name} ${bestMatch.course.teacher?.last_name}`,
      subject: bestMatch.course.subjectRelation?.name || bestMatch.course.subject || "Unknown Subject",
      location: `File: ${bestMatch.course.originalFileName || bestMatch.course.filePath || 'Course materials'} | Uploaded: ${new Date(bestMatch.course.createdAt).toLocaleDateString()}`,
      summary: bestMatch.course.description || `This course covers topics related to your query. Check the course materials for detailed information.`,
      confidence: Math.min(bestMatch.relevance * 1.2, 0.95),
      relatedCourses: searchResults.slice(0, 3).map(result => ({
        title: result.course.title,
        teacher: `${result.course.teacher?.first_name} ${result.course.teacher?.last_name}`,
        subject: result.course.subjectRelation?.name || result.course.subject,
        relevance: Math.round(result.relevance * 100),
        filePath: result.course.filePath
      })),
      exactMatch: bestMatch.relevance > 0.7
    };

    // Add course analysis for mock responses too
    if (bestMatch) {
      response.courseAnalysis = this.generateDefaultCourseAnalysis(bestMatch.course);
    }

    return response;
  }

  // Keep existing methods for backward compatibility
  async generateEducationalResponse(query: string, subjectName?: string): Promise<string> {
    if (this.useMockResponses) {
      return `Educational guidance for: ${query}\n\nThis is a general educational response. For course-specific information, use the course-search endpoint.`;
    }

    if (!this.ai) {
      throw new Error('AI service is not available');
    }

    try {
      this.logger.log(`🤖 Processing AI query: "${query}" for subject: ${subjectName || 'General'}`);
      
      const prompt = this.createEducationalPrompt(query, subjectName);
      
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      this.logger.log('✅ AI response generated successfully');
      return response.text;
      
    } catch (error: any) {
      this.logger.error('❌ Gemini API error, falling back to mock response:', error);
      return `Educational guidance for: ${query}\n\nUnable to generate AI response at this time.`;
    }
  }

  private createEducationalPrompt(query: string, subjectName?: string): string {
    return `
You are SmartCampus AI, an intelligent educational assistant for a university platform. 
You help students with their academic questions in a friendly, encouraging, and professional manner.

STUDENT QUESTION: "${query}"
${subjectName ? `RELATED SUBJECT: ${subjectName}` : 'GENERAL ACADEMIC QUESTION'}

Please provide a comprehensive and helpful response that includes:
1. A clear, accurate explanation of the concept or answer
2. Practical examples or applications
3. Study tips or resources for further learning
4. Where to find more information in their course materials
5. Related topics they might want to explore

Keep the response engaging but professional. Use emojis sparingly to make it friendly.
If the question is outside academic scope, politely guide them back to educational topics.

Format your response in clear paragraphs with good spacing.
    `.trim();
  }

  async testConnection(): Promise<boolean> {
    if (this.useMockResponses) {
      return true;
    }

    if (!this.ai) {
      return false;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: "Hello, please respond with 'AI service is working' if you can read this.",
      });
      
      this.logger.log('✅ AI connection test successful');
      return response.text.includes('working');
    } catch (error) {
      this.logger.error('❌ AI connection test failed:', error);
      return false;
    }
  }

  getStatus(): { configured: boolean; hasApiKey: boolean; usingMock: boolean } {
    const apiKey = process.env.GEMINI_API_KEY;
    const hasApiKey = !!apiKey && 
                     !apiKey.includes('xxxx') &&
                     apiKey !== 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' &&
                     apiKey.length > 10;
    
    return {
      configured: this.isConfigured,
      hasApiKey,
      usingMock: this.useMockResponses
    };
  }
}