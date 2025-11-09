import { Controller, Post, Get, Body, UseGuards, Request, Query, Put } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { ProgressTrackingService } from './progress-tracking.service';
import { Protect } from 'src/auth/auth-guard';
import { GenerateExerciseDto, GenerateLessonDto, GetProgressDto, SubmitSolutionDto, UpdateApiKeyDto } from './dto/generate-lesson.dto';

@Controller('tutor')
@UseGuards(Protect)
export class EnhancedTutorController {
  constructor(
    private readonly tutorService: TutorService,
    private readonly progressTrackingService: ProgressTrackingService
  ) {}

  // 🎯 Original endpoints (keep existing functionality)
  @Post('generate-lesson')
  generateLesson(@Request() req, @Body() generateLessonDto: GenerateLessonDto) {
    console.log('--- New Request to /generate-lesson ---');
    console.log('Headers:', req.headers);
    console.log('Body:', generateLessonDto);
    console.log('Authenticated User:', req.user);

    return this.tutorService.generateLesson(
      req.user.id,
      generateLessonDto.language,
      generateLessonDto.subject,
    );
  }

  @Post('generate-exercise')
  generateExercise(@Request() req, @Body() generateExerciseDto: GenerateExerciseDto) {
    return this.tutorService.generateExercise(req.user.id, generateExerciseDto.language, generateExerciseDto.subject);
  }

  @Post('submit-solution')
  async submitSolution(@Request() req, @Body() submitSolutionDto: SubmitSolutionDto) {
    // Call original service
    const result = await this.tutorService.submitSolution(req.user.id, submitSolutionDto.exerciseId, submitSolutionDto.userCode);
    
    // Track progress
    await this.progressTrackingService.trackExerciseProgress(
      req.user.id,
      submitSolutionDto.exerciseId,
      result.feedback.isCorrect
    );

    return result;
  }

  @Get('progress')
  getProgress(@Request() req, @Query() getProgressDto: GetProgressDto) {
    return this.tutorService.getProgress(req.user.id, getProgressDto.language, getProgressDto.subject);
  }

  @Put('update-api-key')
  updateApiKey(@Request() req, @Body() updateApiKeyDto: UpdateApiKeyDto) {
    return this.tutorService.updateApiKey(req.user.id, updateApiKeyDto.apiKey);
  }

  // 🚀 NEW ENHANCED PROGRESS TRACKING ENDPOINTS

  // 📊 Get Comprehensive Progress
  @Get('progress/comprehensive')
  getComprehensiveProgress(@Request() req, @Query() query: { language?: string; subject?: string }) {
    return this.progressTrackingService.getUserProgress(
      req.user.id,
      query.language,
      query.subject
    );
  }

  // 📈 Get Learning Analytics
  @Get('analytics')
  getLearningAnalytics(@Request() req, @Query() query: { timeRange?: string }) {
    return this.progressTrackingService.getLearningAnalytics(
      req.user.id,
      query.timeRange || '30d'
    );
  }

  // 🎯 Track Lesson Progress
  @Post('progress/lesson')
  trackLessonProgress(@Request() req, @Body() body: {
    lessonId: string;
    language: string;
    subject: string;
  }) {
    return this.progressTrackingService.trackLessonProgress(
      req.user.id,
      body.lessonId,
      body.language,
      body.subject
    );
  }

  // 💪 Track Exercise Progress
  @Post('progress/exercise')
  trackExerciseProgress(@Request() req, @Body() body: {
    exerciseId: string;
    isCorrect: boolean;
    timeSpent?: number;
  }) {
    return this.progressTrackingService.trackExerciseProgress(
      req.user.id,
      body.exerciseId,
      body.isCorrect,
      body.timeSpent
    );
  }

  // 🏆 Get User Achievements
  @Get('achievements')
  getAchievements(@Request() req) {
    return this.progressTrackingService.getUserProgress(req.user.id).then(progress => ({
      achievements: progress.achievements
    }));
  }

  // 📊 Get Progress by Language
  @Get('progress/language/:language')
  getProgressByLanguage(@Request() req, @Query() query: { language: string }) {
    return this.progressTrackingService.getUserProgress(req.user.id, query.language);
  }

  // 📈 Get Weekly Progress
  @Get('progress/weekly')
  getWeeklyProgress(@Request() req) {
    return this.progressTrackingService.getLearningAnalytics(req.user.id, '7d');
  }

  // 🎯 Get Learning Streak
  @Get('streak')
  getLearningStreak(@Request() req) {
    return this.progressTrackingService.getUserProgress(req.user.id).then(progress => ({
      streak: progress.overview.learningStreak
    }));
  }

  // 📊 Get Success Rate
  @Get('success-rate')
  getSuccessRate(@Request() req, @Query() query: { language?: string; timeRange?: string }) {
    return this.progressTrackingService.getLearningAnalytics(
      req.user.id,
      query.timeRange || '30d'
    ).then(analytics => ({
      successRate: analytics.successRate,
      totalSubmissions: analytics.totalSubmissions,
      correctSubmissions: analytics.correctSubmissions
    }));
  }
}
