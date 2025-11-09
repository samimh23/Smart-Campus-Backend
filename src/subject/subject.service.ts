// subject.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { User } from 'src/user/entities/user.entity';
import { UserRole } from 'src/user/entities/role.enum';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Create subject with optional teacher assignment
  async create(name: string, teacherIds?: number[]): Promise<Subject> {
    const subject = this.subjectRepo.create({ name });
    
    if (teacherIds && teacherIds.length > 0) {
      // Find the teachers
      const teachers = await this.userRepo.find({
        where: { id: In(teacherIds), role: UserRole.TEACHER }
      });
      
      if (teachers.length !== teacherIds.length) {
        throw new BadRequestException('Some teachers were not found');
      }
      
      subject.teachers = teachers;
    }
    
    return this.subjectRepo.save(subject);
  }

  async findAll(): Promise<Subject[]> {
    return this.subjectRepo.find({
      relations: ['teachers'],
    });
  }

  async findOne(id: number): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({ 
      where: { id },
      relations: ['teachers'],
    });
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

  // Assign teachers to subject
  async assignTeachers(subjectId: number, teacherIds: number[]): Promise<Subject> {
    const subject = await this.findOne(subjectId);
    
    const teachers = await this.userRepo.find({
      where: { id: In(teacherIds), role: UserRole.TEACHER }
    });
    
    if (teachers.length !== teacherIds.length) {
      throw new BadRequestException('Some teachers were not found');
    }
    
    subject.teachers = teachers;
    return this.subjectRepo.save(subject);
  }

  // Add single teacher to subject
  async addTeacher(subjectId: number, teacherId: number): Promise<Subject> {
    const subject = await this.findOne(subjectId);
    const teacher = await this.userRepo.findOne({
      where: { id: teacherId, role: UserRole.TEACHER }
    });
    
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    
    // Check if teacher is already assigned
    if (!subject.teachers) {
      subject.teachers = [teacher];
    } else if (!subject.teachers.some(t => t.id === teacherId)) {
      subject.teachers.push(teacher);
    }
    
    return this.subjectRepo.save(subject);
  }

  // Remove teacher from subject
  async removeTeacher(subjectId: number, teacherId: number): Promise<Subject> {
    const subject = await this.findOne(subjectId);
    
    if (subject.teachers) {
      subject.teachers = subject.teachers.filter(teacher => teacher.id !== teacherId);
    }
    
    return this.subjectRepo.save(subject);
  }

  async getTeachersBySubject(subjectId: number): Promise<User[]> {
    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId },
      relations: ['teachers'],
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject.teachers || [];
  }

  // Get all available teachers (not assigned to this subject)
  async getAvailableTeachers(subjectId: number): Promise<User[]> {
    const subject = await this.findOne(subjectId);
    const assignedTeacherIds = subject.teachers?.map(teacher => teacher.id) || [];
    
    if (assignedTeacherIds.length === 0) {
      return this.userRepo.find({
        where: { role: UserRole.TEACHER },
        order: { first_name: 'ASC' }
      });
    }
    
    return this.userRepo.find({
      where: { 
        role: UserRole.TEACHER,
        id: Not(In(assignedTeacherIds))
      },
      order: { first_name: 'ASC' }
    });
  }


  async findByRole(role: UserRole): Promise<User[]> {
  return this.userRepo.find({
    where: { role },
    order: { first_name: 'ASC' }
  });
}
}