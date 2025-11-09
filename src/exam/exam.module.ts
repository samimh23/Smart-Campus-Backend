import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { GroqModule } from 'src/groq.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Exam]), GroqModule, AuthModule],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
