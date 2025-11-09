// tutor.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from 'src/user/entities/user.entity';
import { Lesson } from 'src/user/entities/lesson.entity';
import { Exercise } from 'src/user/entities/exercise.entity';
import { UserProgress } from 'src/user/entities/user-progress.entity';
import { UserSubmission } from 'src/user/entities/user-submission.entity';

@Injectable()
export class TutorService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(Exercise)
    private exerciseRepository: Repository<Exercise>,
    @InjectRepository(UserProgress)
    private progressRepository: Repository<UserProgress>,
    @InjectRepository(UserSubmission)
    private submissionRepository: Repository<UserSubmission>,
    private readonly httpService: HttpService,
  ) {}

  // 🎯 Generate Lesson
  async generateLesson(userId: number, language: string, subject: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.geminiApiKey) {
      throw new BadRequestException('User not found or Gemini API key not set');
    }

    // Check if lesson already exists for this user, language, and subject
    const existingLesson = await this.lessonRepository.findOne({
      where: { userId, language, subject },
      order: { createdAt: 'DESC' }
    });

    if (existingLesson) {
      return existingLesson;
    }

    // Generate new lesson with Gemini API
    const lesson = await this.generateLessonWithAI(user.geminiApiKey, language, subject);
    
    // Save to database
    const newLesson = this.lessonRepository.create({
      ...lesson,
      userId,
      language,
      subject,
    });

    return await this.lessonRepository.save(newLesson);
  }

  // 💪 Generate Exercise
  async generateExercise(userId: number, language: string, subject: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.geminiApiKey) {
      throw new BadRequestException('User not found or Gemini API key not set');
    }

    // Generate new exercise with Gemini API
    const exercise = await this.generateExerciseWithAI(user.geminiApiKey, language, subject);
    
    // Save to database
    const newExercise = this.exerciseRepository.create({
      ...exercise,
      userId,
      language,
      subject,
    });

    return await this.exerciseRepository.save(newExercise);
  }

  // ✅ Submit Solution
  async submitSolution(userId: number, exerciseId: string, userCode: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const exercise = await this.exerciseRepository.findOne({ 
      where: { id: exerciseId },
      relations: ['user']
    });

    if (!user || !exercise) {
      throw new NotFoundException('User or exercise not found');
    }

    if (!user.geminiApiKey) {
      throw new BadRequestException('Gemini API key not set');
    }

    // Evaluate solution with Gemini API
    const feedback = await this.evaluateSolutionWithAI(
      user.geminiApiKey,
      userCode,
      exercise,
      exercise.language,
      exercise.subject
    );

    // Save submission
    const submission = this.submissionRepository.create({
      userId,
      exerciseId,
      userCode,
      isCorrect: feedback.isCorrect,
      feedback,
    });

    await this.submissionRepository.save(submission);

    // Update user progress
    await this.updateUserProgress(userId, exercise.language, exercise.subject, feedback.isCorrect);

    // Update user stats
    if (feedback.isCorrect) {
      await this.userRepository.update(userId, {
        completedExercises: () => `completedExercises + 1`,
        totalProgress: () => `LEAST(totalProgress + 10, 100)`, // FIXED: Changed 'progress' to 'totalProgress'
      });
    }

    return {
      submission,
      feedback,
    };
  }

  // 📊 Get Progress
  async getProgress(userId: number, language: string, subject: string) {
    let progress = await this.progressRepository.findOne({
      where: { userId, language, subject },
    });

    if (!progress) {
      // Create initial progress record
      progress = await this.progressRepository.create({
        userId,
        language,
        subject,
        completedExercises: 0,
        progress: 0,
      });
      progress = await this.progressRepository.save(progress);
    }

    return progress;
  }

  // 🔑 Update User Gemini API Key
  async updateApiKey(userId: number, apiKey: string) {
    await this.userRepository.update(userId, { geminiApiKey: apiKey });
    return { message: 'API key updated successfully' };
  }

  // 🤖 Private AI Methods
  private async generateLessonWithAI(apiKey: string, language: string, subject: string) {
    const subjectNames: Record<string, string> = {
      basics: 'Basic Syntax & Variables',
      functions: 'Functions & Scope',
      arrays: 'Arrays & Objects',
      dom: 'DOM Manipulation',
      async: 'Async Programming',
      es6: 'ES6+ Features',
      // ... add other subjects as needed
    };

    const languageDisplay = language.charAt(0).toUpperCase() + language.slice(1);
    const subjectDisplay = subjectNames[subject] || subject;

    const prompt = `You are an expert programming tutor. Create a comprehensive lesson for ${subjectDisplay} in ${languageDisplay}.

Generate a lesson that includes:
1. A clear, engaging title
2. Detailed explanation of the concept (200-300 words)
3. 3 practical code examples that demonstrate the concept

Format your response as JSON:
{
  "title": "Lesson title here",
  "content": "Detailed explanation here...",
  "examples": [
    "example 1 code here",
    "example 2 code here", 
    "example 3 code here"
  ]
}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
          {
            contents: [{
              parts: [{ text: prompt }]
            }]
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000,
          }
        )
      );

      const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonMatch = generatedText?.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new BadRequestException('Invalid response format from AI');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new BadRequestException('Failed to generate lesson with AI');
    }
  }

  private async generateExerciseWithAI(apiKey: string, language: string, subject: string) {
    const subjectNames: Record<string, string> = {
      basics: 'Basic Syntax & Variables',
      functions: 'Functions & Scope',
      arrays: 'Arrays & Objects',
      // ... add other subjects as needed
    };

    const languageDisplay = language.charAt(0).toUpperCase() + language.slice(1);
    const subjectDisplay = subjectNames[subject] || subject;

    const prompt = `You are an expert programming tutor. Create a practical coding exercise for ${subjectDisplay} in ${languageDisplay}.

Generate an exercise that:
1. Has a clear, descriptive title
2. Provides a detailed description of what the student should accomplish
3. Includes starter code with comments indicating where the student should write their solution
4. Is suitable for someone who just learned this concept

Format your response as JSON:
{
  "title": "Exercise title here",
  "description": "Detailed description of what to accomplish...",
  "starterCode": "// Starter code with comments\\nfunction solve() {\\n  // Your code here\\n}",
  "expectedOutput": "What the correct output should be",
  "testCases": [
    {"input": "test input 1", "expectedOutput": "expected output 1"}
  ]
}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
          {
            contents: [{
              parts: [{ text: prompt }]
            }]
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000,
          }
        )
      );

      const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonMatch = generatedText?.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new BadRequestException('Invalid response format from AI');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new BadRequestException('Failed to generate exercise with AI');
    }
  }

  private async evaluateSolutionWithAI(
    apiKey: string, 
    userCode: string, 
    exercise: Exercise, 
    language: string, 
    subject: string
  ) {
    const prompt = `You are an expert programming tutor evaluating a student's solution to a coding exercise.

Exercise Details:
- Title: ${exercise.title}
- Description: ${exercise.description}
- Language: ${language}
- Subject: ${subject}
- Expected Output: ${exercise.expectedOutput || 'N/A'}

Student's Solution:
\`\`\`${language}
 ${userCode}
\`\`\`

Evaluate the student's solution and provide constructive feedback. Consider:
1. Does the code solve the problem correctly?
2. Is the code well-structured and readable?
3. Are there any bugs or logical errors?
4. Are there better ways to implement the solution?

Format your response as JSON:
{
  "isCorrect": true/false,
  "message": "Overall feedback message explaining if the solution is correct and why",
  "suggestions": [
    "Specific suggestion 1 for improvement",
    "Specific suggestion 2 for improvement"
  ],
  "improvements": [
    "Area of improvement 1",
    "Area of improvement 2"
  ]
}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
          {
            contents: [{
              parts: [{ text: prompt }]
            }]
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
          }
        )
      );

      const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonMatch = generatedText?.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new BadRequestException('Invalid response format from AI');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new BadRequestException('Failed to evaluate solution with AI');
    }
  }

  private async updateUserProgress(userId: number, language: string, subject: string, isCorrect: boolean) {
    let progress = await this.progressRepository.findOne({
      where: { userId, language, subject },
    });

    if (!progress) {
      progress = await this.progressRepository.create({
        userId,
        language,
        subject,
        completedExercises: 0,
        progress: 0,
      });
    }

    if (isCorrect) {
      progress.completedExercises += 1;
      progress.progress = Math.min(progress.progress + 10, 100);
      progress.lastActivityAt = new Date();
    }

    await this.progressRepository.save(progress);
  }
}