// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIController } from './ai.controller';
import { GeminiService } from './gemini.service';
import { Course } from '../cours/entities/course.entity';
import { Subject } from '../subject/entities/subject.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Subject, User]),
  ],
  controllers: [AIController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AIModule {}