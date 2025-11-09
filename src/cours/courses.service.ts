import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(createCourseDto: CreateCourseDto & { 
    originalFileName?: string;
    fileSize?: number;
    fileType?: string;
  }, user: User) {
    const course = this.courseRepository.create({
      ...createCourseDto,
      teacher: user,
    });
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
}
