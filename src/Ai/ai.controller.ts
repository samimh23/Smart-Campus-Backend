// src/ai/ai.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { Protect } from 'src/auth/auth-guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/entities/role.enum';

@Controller('ai')
@UseGuards(Protect)
export class AIController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('search')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async aiSearch(
    @Body() body: { 
      query: string; 
      subjectId?: number; 
      subjectName?: string;
    }
  ) {
    try {
      const response = await this.geminiService.generateEducationalResponse(
        body.query, 
        body.subjectName
      );
      
      return {
        success: true,
        answer: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process your question. Please try again.',
        timestamp: new Date().toISOString()
      };
    }
  }
}