import { Module } from '@nestjs/common';

import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';
import { EnhancedTutorController } from './enhanced-tutor.controller';
import { ProgressTrackingService } from './progress-tracking.service';
import { CodeRunnerService } from './code-runner.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { User } from 'src/user/entities/user.entity';
import { Lesson } from 'src/user/entities/lesson.entity';
import { Exercise } from 'src/user/entities/exercise.entity';
import { UserProgress } from 'src/user/entities/user-progress.entity';
import { UserSubmission } from 'src/user/entities/user-submission.entity';
import { Achievement, UserAchievement } from 'src/user/entities/achievement.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, Lesson, Exercise, UserProgress, UserSubmission, Achievement, UserAchievement]),
    HttpModule
  ],
  controllers: [TutorController, EnhancedTutorController],
  providers: [TutorService, ProgressTrackingService, CodeRunnerService],
})
export class TutorModule {}
