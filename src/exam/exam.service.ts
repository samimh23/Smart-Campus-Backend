import { Injectable } from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { GroqService } from 'src/groq.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam) private readonly examRepo: Repository<Exam>,
    private readonly groqService: GroqService
  ){}
  async create(userMsg: string, user) {
    try {
      const examJson = await this.groqService.createExamJson(userMsg);

      const exam = await this.examRepo.save({
        subject: examJson.subject,
        exam_title: examJson.exam_title,
        topic: examJson.topic,
        difficulty: examJson.difficulty,
        language: examJson.language,
        duration_minutes: examJson.duration_minutes,
        questions: examJson.questions,
        totalQuestions: examJson.questions?.length || 0,
        user
      });

      return exam;
    } catch (error) {
      console.error('❌ Failed to create exam:', error);
      throw new Error('Failed to generate or save exam');
    }
  }

  async chat(question: string, messages) {
    return await this.groqService.chatAboutQuestion(question, messages)
  }

  async check(question: string, expect, answer) {
    return await this.groqService.checkAnswer(question, expect, answer)
  }

  async findAll(userId) {
    return await this.examRepo.find({ where: { user: { id: userId } } })
  }

  findOne(id: number) {
    return `This action returns a #${id} exam`;
  }

  update(id: number, updateExamDto: UpdateExamDto) {
    return `This action updates a #${id} exam`;
  }

  remove(id: number) {
    return `This action removes a #${id} exam`;
  }
}
