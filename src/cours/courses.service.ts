// courses.service.ts
import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { User } from 'src/user/entities/user.entity';
import { UserRole } from 'src/user/entities/role.enum';
import { Classe } from 'src/classe/entities/classe.entity';
import { Subject } from 'src/subject/entities/subject.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Classe)
    private readonly classeRepo: Repository<Classe>, // Fixed: Added proper injection

    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async create(createCourseDto: CreateCourseDto & { 
    originalFileName?: string;
    fileSize?: number;
    fileType?: string;
    classIds?: number[];
    subject_id?: number;
  }, user: User) {
    const course = this.courseRepository.create({
      ...createCourseDto,
      teacher: user,
    });

    // If classIds are provided, link the course to those classes
    if (createCourseDto.classIds && createCourseDto.classIds.length > 0) {
      const classes = await this.classeRepo.findByIds(createCourseDto.classIds);
      course.classes = classes;
    }

    // If subject_id is provided, link the course to that subject
    if (createCourseDto.subject_id) {
      const subject = await this.subjectRepo.findOne({ where: { id: createCourseDto.subject_id } });
      course.subjectRelation = subject;
    }

    return this.courseRepository.save(course);
  }

  findAll() {
    return this.courseRepository.find({
      relations: ['teacher'],
      order: { createdAt: 'DESC' }
    });
  }

  findOne(id: number) {
    return this.courseRepository.findOne({ 
      where: { id },
      relations: ['teacher']
    });
  }

  async update(id: number, updateCourseDto: UpdateCourseDto, user: User) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['teacher'],
    });

    if (!course) throw new ForbiddenException('Course not found');
    if (course.teacher.id !== user.id)
      throw new ForbiddenException('You can only edit your own courses');

    Object.assign(course, updateCourseDto);
    return this.courseRepository.save(course);
  }

  async remove(id: number, user: User) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['teacher'],
    });

    if (!course) throw new ForbiddenException('Course not found');
    if (course.teacher.id !== user.id)
      throw new ForbiddenException('You can only delete your own courses');

    return this.courseRepository.remove(course);
  }

  async findByClass(classId: number) {
    return this.courseRepository
      .createQueryBuilder('course')
      .innerJoin('course.classes', 'class')
      .where('class.id = :classId', { classId })
      .leftJoinAndSelect('course.teacher', 'teacher')
      .getMany();
  }

  async findByStudentId(studentId: number): Promise<Course[]> {
  console.log('🎯 Finding courses for student:', studentId);
  
  try {
    // Get student info first
    const student = await this.userRepo.findOne({
      where: { id: studentId, role: UserRole.STUDENT },
      relations: ['classe', 'classe.subjects']
    });

    if (!student || !student.classe) {
      console.log('❌ Student has no class, returning all courses');
      return this.findAll();
    }

    console.log('✅ Student class:', student.classe.name);
    console.log('✅ Class subjects:', student.classe.subjects?.map(s => ({id: s.id, name: s.name})));

    // Get ALL courses first to see what we have
    const allCourses = await this.courseRepository.find({
      relations: ['teacher', 'classes', 'subjectRelation']
    });

    console.log('📖 ALL courses in database:');
    allCourses.forEach(course => {
      console.log(`  - "${course.title}"`);
      console.log(`    Subject (string): "${course.subject}"`);
      console.log(`    SubjectRelation ID: ${course.subjectRelation?.id}`);
      console.log(`    SubjectRelation Name: ${course.subjectRelation?.name}`);
      console.log(`    Classes: ${course.classes?.map(c => c.name).join(', ') || 'None'}`);
      console.log(`    Class IDs: ${course.classes?.map(c => c.id).join(', ') || 'None'}`);
    });

    // For now, let's return ALL courses to test the frontend
    console.log('🔧 TEMPORARY: Returning all courses for testing');
    return allCourses;

  } catch (error) {
    console.error('❌ Error in findByStudentId:', error);
    // Fallback to all courses
    return this.findAll();
  }
}
}