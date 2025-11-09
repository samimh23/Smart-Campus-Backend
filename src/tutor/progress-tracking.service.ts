import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Lesson } from 'src/user/entities/lesson.entity';
import { Exercise } from 'src/user/entities/exercise.entity';
import { UserProgress } from 'src/user/entities/user-progress.entity';
import { UserSubmission } from 'src/user/entities/user-submission.entity';

@Injectable()
export class ProgressTrackingService {
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
  ) {}

  // 📊 Get Comprehensive Progress for a User
  async getUserProgress(userId: number, language?: string, subject?: string) {
    // Get user's progress records
    const whereClause: any = { userId };
    if (language) whereClause.language = language;
    if (subject) whereClause.subject = subject;

    const progressRecords = await this.progressRepository.find({
      where: whereClause,
      order: { lastActivityAt: 'DESC' }
    });

    // Get user's lessons
    const lessons = await this.lessonRepository.find({
      where: { userId, ...(language && { language }), ...(subject && { subject }) },
      order: { createdAt: 'DESC' }
    });

    // Get user's exercises
    const exercises = await this.exerciseRepository.find({
      where: { userId, ...(language && { language }), ...(subject && { subject }) },
      order: { createdAt: 'DESC' }
    });

    // Get user's submissions
    const submissions = await this.submissionRepository.find({
      where: { userId },
      relations: ['exercise'],
      order: { id: 'DESC' } // Use id instead of createdAt for ordering
    });

    // Calculate comprehensive stats
    const totalLessons = lessons.length;
    const totalExercises = exercises.length;
    const completedExercises = submissions.filter(s => s.isCorrect).length;
    const totalSubmissions = submissions.length;
    const successRate = totalSubmissions > 0 ? (completedExercises / totalSubmissions) * 100 : 0;

    // Calculate progress by language
    const languageProgress = this.calculateLanguageProgress(progressRecords);
    
    // Calculate recent activity (last 7 days)
    const recentActivity = this.calculateRecentActivity(submissions);

    // Calculate learning streaks
    const learningStreak = this.calculateLearningStreak(submissions);

    return {
      overview: {
        totalLessons,
        totalExercises,
        completedExercises,
        successRate: Math.round(successRate),
        learningStreak,
        totalTimeSpent: this.calculateTotalTimeSpent(progressRecords)
      },
      progressRecords,
      lessons: lessons.slice(0, 10), // Recent lessons
      exercises: exercises.slice(0, 10), // Recent exercises
      submissions: submissions.slice(0, 20), // Recent submissions
      languageProgress,
      recentActivity,
      achievements: await this.calculateAchievements(userId, submissions)
    };
  }

  // 🎯 Track Lesson Progress
  async trackLessonProgress(userId: number, lessonId: string, language: string, subject: string) {
    // Update or create progress record
    let progress = await this.progressRepository.findOne({
      where: { userId, language, subject }
    });

    if (!progress) {
      progress = await this.progressRepository.create({
        userId,
        language,
        subject,
        completedExercises: 0,
        progress: 0
      });
    }

    // Update progress
    progress.progress = Math.min(progress.progress + 10, 100);
    progress.lastActivityAt = new Date();

    await this.progressRepository.save(progress);

    // Update user's overall progress
    await this.updateUserOverallProgress(userId);

    return progress;
  }

  // 💪 Track Exercise Progress
  async trackExerciseProgress(userId: number, exerciseId: string, isCorrect: boolean, timeSpent?: number) {
    const exercise = await this.exerciseRepository.findOne({
      where: { id: exerciseId }
    });

    if (!exercise) return null;

    // Update progress for specific language/subject
    let progress = await this.progressRepository.findOne({
      where: { userId, language: exercise.language, subject: exercise.subject }
    });

    if (!progress) {
      progress = await this.progressRepository.create({
        userId,
        language: exercise.language,
        subject: exercise.subject,
        completedExercises: 0,
        progress: 0
      });
    }

    if (isCorrect) {
      progress.completedExercises += 1;
      progress.progress = Math.min(progress.progress + 10, 100);
    }

    progress.lastActivityAt = new Date();
    await this.progressRepository.save(progress);

    // Update user's overall progress
    await this.updateUserOverallProgress(userId);

    return progress;
  }

  // 📈 Get Learning Analytics
  async getLearningAnalytics(userId: number, timeRange: string = '30d') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const submissions = await this.submissionRepository.find({
      where: { userId },
      relations: ['exercise'],
      order: { id: 'DESC' }
    });

    // Filter by date in JavaScript since TypeORM doesn't support date filtering easily
    const filteredSubmissions = submissions.filter(submission => {
      // Use createdAt if available, otherwise use a fallback date
      const submissionDate = submission.createdAt 
        ? new Date(submission.createdAt) 
        : new Date(); // Fallback to current date if no createdAt
      return submissionDate >= startDate;
    });

    const progressRecords = await this.progressRepository.find({
      where: { userId }
    });

    // Calculate analytics
    const totalSubmissions = filteredSubmissions.length;
    const correctSubmissions = filteredSubmissions.filter(s => s.isCorrect).length;
    const successRate = totalSubmissions > 0 ? (correctSubmissions / totalSubmissions) * 100 : 0;

    // Language breakdown
    const languageStats = this.calculateLanguageStats(filteredSubmissions);

    // Weekly progress
    const weeklyProgress = this.calculateWeeklyProgress(filteredSubmissions);

    // Learning patterns
    const learningPatterns = this.analyzeLearningPatterns(filteredSubmissions);

    return {
      timeRange,
      totalSubmissions,
      correctSubmissions,
      successRate: Math.round(successRate),
      languageStats,
      weeklyProgress,
      learningPatterns,
      totalTimeSpent: this.calculateTotalTimeSpent(progressRecords),
      averageSessionTime: this.calculateAverageSessionTime(submissions)
    };
  }

  // 🏆 Calculate Achievements
  private async calculateAchievements(userId: number, submissions: any[]) {
    const achievements = [];

    // First exercise completed
    if (submissions.length >= 1) {
      achievements.push({
        id: 'first_exercise',
        title: 'First Steps',
        description: 'Completed your first exercise',
        icon: '🎯',
        unlocked: true
      });
    }

    // 10 exercises completed
    if (submissions.filter(s => s.isCorrect).length >= 10) {
      achievements.push({
        id: 'exercise_master',
        title: 'Exercise Master',
        description: 'Completed 10 exercises',
        icon: '🏆',
        unlocked: true
      });
    }

    // 100% success rate (if applicable)
    const recentSubmissions = submissions.slice(0, 5);
    if (recentSubmissions.length >= 5 && recentSubmissions.every(s => s.isCorrect)) {
      achievements.push({
        id: 'perfect_score',
        title: 'Perfect Score',
        description: 'Got 5 exercises correct in a row',
        icon: '⭐',
        unlocked: true
      });
    }

    return achievements;
  }

  // 🔄 Update User Overall Progress
  private async updateUserOverallProgress(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const totalSubmissions = await this.submissionRepository.count({
      where: { userId, isCorrect: true }
    });

    const totalProgress = Math.min(totalSubmissions * 10, 100);

    await this.userRepository.update(userId, {
      completedExercises: totalSubmissions,
      totalProgress
    });
  }

  // 📊 Helper Methods
  private calculateLanguageProgress(progressRecords: any[]) {
    return progressRecords.reduce((acc, record) => {
      if (!acc[record.language]) {
        acc[record.language] = {
          total: 0,
          completed: 0,
          progress: 0
        };
      }
      acc[record.language].total += 1;
      acc[record.language].completed += record.completedExercises;
      acc[record.language].progress = record.progress;
      return acc;
    }, {});
  }

  private calculateRecentActivity(submissions: any[]) {
    const last7Days = submissions.filter(s => {
      const submissionDate = s.createdAt ? new Date(s.createdAt) : new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return submissionDate >= sevenDaysAgo;
    });

    return {
      total: last7Days.length,
      correct: last7Days.filter(s => s.isCorrect).length,
      days: this.groupByDay(last7Days)
    };
  }

  private calculateLearningStreak(submissions: any[]) {
    // Simple streak calculation based on consecutive days with activity
    const dailyActivity = this.groupByDay(submissions);
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (dailyActivity[dateStr] && dailyActivity[dateStr].length > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateLanguageStats(submissions: any[]) {
    return submissions.reduce((acc, submission) => {
      const language = submission.exercise?.language || 'unknown';
      if (!acc[language]) {
        acc[language] = { total: 0, correct: 0 };
      }
      acc[language].total += 1;
      if (submission.isCorrect) {
        acc[language].correct += 1;
      }
      return acc;
    }, {});
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
      const dateStr = submission.createdAt 
        ? submission.createdAt.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      if (weeklyData[dateStr]) {
        weeklyData[dateStr].submissions += 1;
        if (submission.isCorrect) {
          weeklyData[dateStr].correct += 1;
        }
      }
    });

    return Object.values(weeklyData);
  }

  private analyzeLearningPatterns(submissions: any[]) {
    const patterns = {
      mostActiveHour: this.getMostActiveHour(submissions),
      preferredLanguage: this.getPreferredLanguage(submissions),
      improvementTrend: this.calculateImprovementTrend(submissions)
    };
    return patterns;
  }

  private getMostActiveHour(submissions: any[]) {
    const hourCounts = {};
    submissions.forEach(s => {
      const hour = s.createdAt ? new Date(s.createdAt).getHours() : new Date().getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    return Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, '0');
  }

  private getPreferredLanguage(submissions: any[]) {
    const languageCounts = {};
    submissions.forEach(s => {
      const lang = s.exercise?.language || 'unknown';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });
    return Object.keys(languageCounts).reduce((a, b) => languageCounts[a] > languageCounts[b] ? a : b, 'javascript');
  }

  private calculateImprovementTrend(submissions: any[]) {
    if (submissions.length < 5) return 'insufficient_data';
    
    const recent = submissions.slice(0, 5);
    const older = submissions.slice(5, 10);
    
    const recentSuccessRate = recent.filter(s => s.isCorrect).length / recent.length;
    const olderSuccessRate = older.length > 0 ? older.filter(s => s.isCorrect).length / older.length : 0;
    
    if (recentSuccessRate > olderSuccessRate) return 'improving';
    if (recentSuccessRate < olderSuccessRate) return 'declining';
    return 'stable';
  }

  private groupByDay(submissions: any[]) {
    return submissions.reduce((acc, submission) => {
      const date = submission.createdAt 
        ? submission.createdAt.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(submission);
      return acc;
    }, {});
  }

  private calculateTotalTimeSpent(progressRecords: any[]) {
    // This would need to be implemented based on your time tracking logic
    return progressRecords.reduce((sum, record) => sum + (record.totalTimeSpent || 0), 0);
  }

  private calculateAverageSessionTime(submissions: any[]) {
    // This would need to be implemented based on your session tracking logic
    return submissions.length > 0 ? 15 : 0; // Placeholder: 15 minutes average
  }
}
