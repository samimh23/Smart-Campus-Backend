import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async create(name: string): Promise<Subject> {
    const subject = this.subjectRepo.create({ name });
    return this.subjectRepo.save(subject);
  }

  async findAll(): Promise<Subject[]> {
    return this.subjectRepo.find();
  }

  async findOne(id: number): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) {
      throw new NotFoundException(`Subject with id ${id} not found`);
    }
    return subject;
  }

  async update(id: number, name: string): Promise<Subject> {
    const subject = await this.findOne(id);
    subject.name = name;
    return this.subjectRepo.save(subject);
  }

  async delete(id: number): Promise<void> {
    const subject = await this.findOne(id);
    await this.subjectRepo.remove(subject);
  }




  async getTeachersBySubject(subjectId: number): Promise<User[]> {
    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId },
      relations: ['teachers'], // fetch the teachers of this subject
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject.teachers;
  }
}
