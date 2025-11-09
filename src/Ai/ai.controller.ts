// src/ai/ai.controller.ts
import { Controller, Post, Body, UseGuards, Logger, Req } from '@nestjs/common';
import { GeminiService, StructuredResponse } from './gemini.service';
import { Protect } from 'src/auth/auth-guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/entities/role.enum';

@Controller('ai')
@UseGuards(Protect)
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(private readonly geminiService: GeminiService) {}

  @Post('course-search')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async courseSearch(
    @Body() body: { 
      query: string; 
      subjectId?: number; 
      courseId?: number;
    },
    @Req() req: any
  ) {
    this.logger.log(`🔍 Course AI search request: "${body.query}" from user: ${req.user.id}`);
    
    // Validation
    if (!body.query || body.query.trim().length === 0) {
      return {
        success: false,
        error: 'Query is required',
        timestamp: new Date().toISOString()
      };
    }

    if (body.query.length > 500) {
      return {
        success: false,
        error: 'Query is too long. Maximum 500 characters allowed.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response: StructuredResponse = await this.geminiService.generateCourseSpecificResponse(
        body.query.trim(),
        req.user.id,
        body.subjectId,
        body.courseId
      );
      
      this.logger.log(`✅ Course AI search completed - Confidence: ${response.confidence}, Matches: ${response.relatedCourses?.length || 0}`);
      
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.logger.error('❌ Course AI search failed:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to search course materials. Please try again.',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Keep existing endpoints for backward compatibility
  @Post('search')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async aiSearch(
    @Body() body: { 
      query: string; 
      subjectId?: number; 
      subjectName?: string;
    },
    @Req() req: any
  ) {
    this.logger.log(`AI search request: "${body.query}" for subject: ${body.subjectName}`);
    
    if (!body.query || body.query.trim().length === 0) {
      return {
        success: false,
        error: 'Query is required',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await this.geminiService.generateEducationalResponse(
        body.query.trim(), 
        body.subjectName
      );
      
      return {
        success: true,
        answer: response,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.logger.error('❌ AI search failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to process your question.',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('health')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async healthCheck() {
    try {
      const isHealthy = await this.geminiService.testConnection();
      const status = this.geminiService.getStatus();
      
      return {
        success: true,
        healthy: isHealthy,
        configured: status.configured,
        hasApiKey: status.hasApiKey,
        message: isHealthy 
          ? 'AI service is working properly' 
          : status.configured 
            ? 'AI service configured but connection test failed'
            : 'AI service is not configured',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        healthy: false,
        message: 'AI service health check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('status')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async getStatus() {
    const status = this.geminiService.getStatus();
    
    return {
      success: true,
      configured: status.configured,
      hasApiKey: status.hasApiKey,
      message: status.configured 
        ? '✅ AI service is properly configured and ready' 
        : status.hasApiKey 
          ? '⚠️ API key found but service not configured. Please check the key format.'
          : '❌ No API key found. Please set GEMINI_API_KEY in your environment.',
      timestamp: new Date().toISOString()
    };
  }

  @Post('debug')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async debug() {
    const apiKey = process.env.GEMINI_API_KEY;
    const envVars = Object.keys(process.env).filter(key => 
      key.includes('GEMINI') || key.includes('API') || key.includes('KEY')
    );
    
    return {
      success: true,
      geminiApiKey: apiKey ? '***' + apiKey.slice(-4) : 'NOT_SET',
      geminiApiKeyLength: apiKey ? apiKey.length : 0,
      environmentVariables: envVars,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
  }
}