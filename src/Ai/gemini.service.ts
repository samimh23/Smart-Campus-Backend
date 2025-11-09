// src/ai/gemini.service.ts
import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    // Initialize Gemini with your API key
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
  }

  async generateEducationalResponse(query: string, subjectName?: string): Promise<string> {
    try {
      // Create a tailored prompt for educational content
      const prompt = this.createEducationalPrompt(query, subjectName);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private createEducationalPrompt(query: string, subjectName?: string): string {
    return `
      You are an intelligent educational assistant for a university platform called "Smart Campus". 
      A student is asking about: "${query}"
      ${subjectName ? `This question relates to the subject: ${subjectName}` : ''}
      
      Please provide a helpful, accurate response that includes:
      1. Clear explanation of the concept/theorem/term
      2. Where they might find this in their curriculum (chapter, section if applicable)
      3. Simple examples to illustrate the concept
      4. Related topics they might want to explore next
      5. Study tips if relevant
      
      Keep the tone friendly, educational, and encouraging. 
      If you're not sure about something, admit it and suggest they consult their teacher.
      
      Format your response in clear paragraphs with emojis to make it engaging.
    `;
  }
}