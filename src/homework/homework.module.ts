import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeworkService } from './homework.service';
import { HomeworkController } from './homework.controller';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';
import { Homework } from './entities/homework.entity';
import { HomeworkSubmission } from './entities/homework-submission.entity';
import { Grade } from './entities/grade.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Homework, HomeworkSubmission, Grade, User])],
  controllers: [HomeworkController, SubmissionController],
  providers: [HomeworkService, SubmissionService],
  exports: [HomeworkService, SubmissionService],
})
export class HomeworkModule {}



