import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Homework } from './entities/homework.entity';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../user/entities/role.enum';

@Injectable()
export class HomeworkService {
  constructor(
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createHomeworkDto: CreateHomeworkDto, teacherId: number): Promise<Homework> {
    // Vérifier que l'utilisateur est un enseignant
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER }
    });

    if (!teacher) {
      throw new ForbiddenException('Seuls les enseignants peuvent créer des devoirs');
    }

    const homework = this.homeworkRepository.create({
      ...createHomeworkDto,
      teacher_id: teacherId,
      deadline: new Date(createHomeworkDto.deadline)
    });

    return await this.homeworkRepository.save(homework);
  }

  async findAll(): Promise<Homework[]> {
    return await this.homeworkRepository.find({
      relations: ['teacher'],
      order: { created_at: 'DESC' }
    });
  }

  async findByTeacher(teacherId: number): Promise<Homework[]> {
    return await this.homeworkRepository.find({
      where: { teacher_id: teacherId },
      relations: ['teacher'],
      order: { created_at: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Homework> {
    const homework = await this.homeworkRepository.findOne({
      where: { id },
      relations: ['teacher']
    });

    if (!homework) {
      throw new NotFoundException(`Devoir avec l'ID ${id} non trouvé`);
    }

    return homework;
  }

  async update(id: number, updateHomeworkDto: UpdateHomeworkDto, teacherId: number): Promise<Homework> {
    const homework = await this.findOne(id);

    // Vérifier que l'enseignant est le propriétaire du devoir
    if (homework.teacher_id !== teacherId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres devoirs');
    }

    // Convertir la date si elle est fournie
    if (updateHomeworkDto.deadline) {
      updateHomeworkDto.deadline = new Date(updateHomeworkDto.deadline).toISOString();
    }

    await this.homeworkRepository.update(id, updateHomeworkDto);
    return await this.findOne(id);
  }

  async remove(id: number, teacherId: number): Promise<void> {
    const homework = await this.findOne(id);

    // Vérifier que l'enseignant est le propriétaire du devoir
    if (homework.teacher_id !== teacherId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres devoirs');
    }

    await this.homeworkRepository.delete(id);
  }

  async getUpcomingDeadlines(): Promise<Homework[]> {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return await this.homeworkRepository.find({
      where: {
        deadline: {
          $gte: now,
          $lte: oneWeekFromNow
        } as any,
        is_active: true
      },
      relations: ['teacher'],
      order: { deadline: 'ASC' }
    });
  }
}
