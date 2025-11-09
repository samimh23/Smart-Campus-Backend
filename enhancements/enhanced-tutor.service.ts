// Enhanced Tutor Service with Advanced Progress Tracking
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../src/user/entities/user.entity';
import { Lesson } from '../src/user/entities/lesson.entity';
import { Exercise } from '../src/user/entities/exercise.entity';
import { UserProgress } from '../src/user/entities/user-progress.entity';
import { UserSubmission } from '../src/user/entities/user-submission.entity';
import { EnhancedUserProgress } from './enhanced-user-progress.entity';
import { Achievement, UserAchievement } from './achievement.entity';

@Injectable()
export class EnhancedTutorService {
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
    @InjectRepository(EnhancedUserProgress)
    private enhancedProgressRepository: Repository<EnhancedUserProgress>,
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    private readonly httpService: HttpService,
  ) {}

  // 🎯 Enhanced Progress Tracking
  async getDetailedProgress(userId: number, language?: string, subject?: string) {
    const whereClause: any = { userId };
    if (language) whereClause.language = language;
    if (subject) whereClause.subject = subject;

    const progress = await this.enhancedProgressRepository.find({
      where: whereClause,
      order: { lastActivityAt: 'DESC' }
    });

    // Get user's lessons and exercises
    const lessons = await this.lessonRepository.find({
      where: { userId, ...(language && { language }), ...(subject && { subject }) },
      order: { createdAt: 'DESC' }
    });

    const exercises = await this.exerciseRepository.find({
      where: { userId, ...(language && { language }), ...(subject && { subject }) },
      order: { createdAt: 'DESC' }
    });

    // Get user's achievements
    const achievements = await this.userAchievementRepository.find({
      where: { userId },
      order: { unlockedAt: 'DESC' }
    });

    // Calculate overall stats
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.createdAt).length; // Assuming completion logic
    const totalExercises = exercises.length;
    const completedExercises = exercises.filter(e => e.submissions?.some(s => s.isCorrect)).length;
    const totalTimeSpent = progress.reduce((sum, p) => sum + p.totalTimeSpent, 0);

    return {
      progress,
      lessons,
      exercises,
      achievements,
      stats: {
        totalLessons,
        completedLessons,
        totalExercises,
        completedExercises,
        totalTimeSpent,
        completionRate: totalLessons + totalExercises > 0 
          ? Math.round(((completedLessons + completedExercises) / (totalLessons + totalExercises)) * 100)
          : 0,
        currentLevel: progress[0]?.currentLevel || 1,
        experiencePoints: progress.reduce((sum, p) => sum + p.experiencePoints, 0)
      }
    };
  }

  // 🏆 Achievement System
  async checkAndUnlockAchievements(userId: number, action: string, context: any) {
    const achievements = await this.achievementRepository.find();
    
    for (const achievement of achievements) {
      const criteria = JSON.parse(achievement.criteria);
      
      // Check if user already has this achievement
      const existingAchievement = await this.userAchievementRepository.findOne({
        where: { userId, achievementId: achievement.id }
      });

      if (existingAchievement) continue;

      let shouldUnlock = false;

      // Achievement logic based on action and criteria
      if (achievement.id === 'first_lesson' && action === 'lesson_completed') {
        shouldUnlock = true;
      } else if (achievement.id === 'first_exercise' && action === 'exercise_completed') {
        shouldUnlock = true;
      } else if (achievement.id === 'language_master' && action === 'lesson_completed') {
        const progress = await this.enhancedProgressRepository.findOne({
          where: { userId, language: context.language, subject: context.subject }
        });
        if (progress && progress.completedLessons >= 5) {
          shouldUnlock = true;
        }
      } else if (achievement.id === 'exercise_master' && action === 'exercise_completed') {
        const totalCompleted = await this.submissionRepository.count({
          where: { userId, isCorrect: true }
        });
        if (totalCompleted >= 10) {
          shouldUnlock = true;
        }
      } else if (achievement.id === 'streak_3' && action === 'daily_activity') {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user && user.totalProgress >= 30) { // Assuming streak logic
          shouldUnlock = true;
        }
      }

      if (shouldUnlock) {
        await this.userAchievementRepository.save({
          userId,
          achievementId: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category
        });
      }
    }
  }

  // 📊 Learning Analytics
  async getLearningAnalytics(userId: number, timeRange: string = '30d') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const progress = await this.enhancedProgressRepository.find({
      where: { userId },
      order: { lastActivityAt: 'DESC' }
    });

    const submissions = await this.submissionRepository.find({
      where: { userId },
      order: { id: 'DESC' }
    });

    // Filter by date in JavaScript
    const filteredSubmissions = submissions.filter(submission => {
      // Use createdAt if available, otherwise use a fallback date
      const submissionDate = submission.createdAt 
        ? new Date(submission.createdAt) 
        : new Date(); // Fallback to current date if no createdAt
      return submissionDate >= startDate;
    });

    // Calculate analytics
    const totalTimeSpent = progress.reduce((sum, p) => sum + p.totalTimeSpent, 0);
    const averageSessionTime = progress.length > 0 ? totalTimeSpent / progress.length : 0;
    const successRate = filteredSubmissions.length > 0 
      ? (filteredSubmissions.filter(s => s.isCorrect).length / filteredSubmissions.length) * 100 
      : 0;

    const languageProgress = progress.reduce((acc, p) => {
      if (!acc[p.language]) {
        acc[p.language] = { total: 0, completed: 0, timeSpent: 0 };
      }
      acc[p.language].total += p.totalExercises;
      acc[p.language].completed += p.completedExercises;
      acc[p.language].timeSpent += p.totalTimeSpent;
      return acc;
    }, {});

    return {
      totalTimeSpent,
      averageSessionTime,
      successRate,
      languageProgress,
      recentActivity: submissions.slice(0, 10),
      weeklyProgress: this.calculateWeeklyProgress(submissions)
    };
  }

  // 🔄 Update Enhanced Progress
  async updateEnhancedProgress(userId: number, language: string, subject: string, action: string, data: any) {
    let progress = await this.enhancedProgressRepository.findOne({
      where: { userId, language, subject }
    });

    if (!progress) {
      progress = await this.enhancedProgressRepository.create({
        userId,
        language,
        subject,
        totalLessons: 0,
        completedLessons: 0,
        totalExercises: 0,
        completedExercises: 0,
        totalTimeSpent: 0,
        currentLevel: 1,
        experiencePoints: 0,
        streak: 0
      });
    }

    // Update based on action
    switch (action) {
      case 'lesson_completed':
        progress.completedLessons += 1;
        progress.experiencePoints += 10;
        break;
      case 'exercise_completed':
        progress.completedExercises += 1;
        progress.experiencePoints += 20;
        if (data.timeSpent) progress.totalTimeSpent += data.timeSpent;
        break;
      case 'time_spent':
        progress.totalTimeSpent += data.minutes || 0;
        break;
    }

    // Update level based on experience points
    progress.currentLevel = Math.floor(progress.experiencePoints / 100) + 1;
    progress.lastActivityAt = new Date();

    await this.enhancedProgressRepository.save(progress);

    // Check for achievements
    await this.checkAndUnlockAchievements(userId, action, { language, subject });

    return progress;
  }

  private calculateWeeklyProgress(submissions: any[]) {
    const weeklyData = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      weeklyData[dateStr] = {
        date: dateStr,
        submissions: 0,
        correct: 0
      };
    }

    submissions.forEach(submission => {
      const dateStr = submission.createdAt.toISOString().split('T')[0];
      if (weeklyData[dateStr]) {
        weeklyData[dateStr].submissions += 1;
        if (submission.isCorrect) {
          weeklyData[dateStr].correct += 1;
        }
      }
    });

    return Object.values(weeklyData);
  }
}
