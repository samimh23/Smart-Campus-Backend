// Enhanced Tutor Controller with Advanced Progress Tracking
import { Controller, Post, Get, Body, UseGuards, Request, Query, Put } from '@nestjs/common';
import { EnhancedTutorService } from './enhanced-tutor.service';
import { Protect } from '../src/auth/auth-guard';

@Controller('tutor/enhanced')
@UseGuards(Protect)
export class EnhancedTutorController {
  constructor(private readonly enhancedTutorService: EnhancedTutorService) {}

  // 📊 Get Detailed Progress
  @Get('progress/detailed')
  getDetailedProgress(@Request() req, @Query() query: { language?: string; subject?: string }) {
    return this.enhancedTutorService.getDetailedProgress(
      req.user.id,
      query.language,
      query.subject
    );
  }

  // 🏆 Get User Achievements
  @Get('achievements')
  getAchievements(@Request() req) {
    return this.enhancedTutorService.getDetailedProgress(req.user.id).then(progress => ({
      achievements: progress.achievements
    }));
  }

  // 📈 Get Learning Analytics
  @Get('analytics')
  getLearningAnalytics(@Request() req, @Query() query: { timeRange?: string }) {
    return this.enhancedTutorService.getLearningAnalytics(req.user.id, query.timeRange);
  }

  // 🔄 Update Progress
  @Post('progress/update')
  updateProgress(@Request() req, @Body() body: {
    language: string;
    subject: string;
    action: string;
    data: any;
  }) {
    return this.enhancedTutorService.updateEnhancedProgress(
      req.user.id,
      body.language,
      body.subject,
      body.action,
      body.data
    );
  }

  // 🎯 Get Progress by Language
  @Get('progress/language/:language')
  getProgressByLanguage(@Request() req, @Query() query: { language: string }) {
    return this.enhancedTutorService.getDetailedProgress(req.user.id, query.language);
  }

  // 📊 Get Progress Summary
  @Get('progress/summary')
  getProgressSummary(@Request() req) {
    return this.enhancedTutorService.getDetailedProgress(req.user.id);
  }
}
