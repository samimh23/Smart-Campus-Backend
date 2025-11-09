import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeworkSubmission } from './entities/homework-submission.entity';
import { Grade } from './entities/grade.entity';
import { Homework } from './entities/homework.entity';
import { User } from '../user/entities/user.entity';
import { CreateSubmissionDto, UpdateSubmissionDto } from './dto/create-submission.dto';
import { CreateGradeDto, UpdateGradeDto } from './dto/create-grade.dto';
import { UserRole } from '../user/entities/role.enum';
import { AIGradingService } from '../ai-grading/ai-grading.service';

@Injectable()
export class SubmissionService {
  constructor(
    @InjectRepository(HomeworkSubmission)
    private submissionRepository: Repository<HomeworkSubmission>,
    @InjectRepository(Grade)
    private gradeRepository: Repository<Grade>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private aiGradingService: AIGradingService,
  ) {}

  // Créer une soumission
  async createSubmission(createSubmissionDto: CreateSubmissionDto, studentId: number): Promise<HomeworkSubmission> {
    // Vérifier que l'utilisateur est un étudiant
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.STUDENT }
    });

    if (!student) {
      throw new ForbiddenException('Seuls les étudiants peuvent soumettre des devoirs');
    }

    // Vérifier que le devoir existe
    const homework = await this.homeworkRepository.findOne({
      where: { id: createSubmissionDto.homework_id }
    });

    if (!homework) {
      throw new NotFoundException('Devoir non trouvé');
    }

    // Vérifier si une soumission existe déjà
    const existingSubmission = await this.submissionRepository.findOne({
      where: {
        homework_id: createSubmissionDto.homework_id,
        student_id: studentId
      }
    });

    if (existingSubmission) {
      throw new BadRequestException('Une soumission existe déjà pour ce devoir');
    }

    // Vérifier si le devoir est en retard
    const isLate = new Date() > new Date(homework.deadline);

    const submission = this.submissionRepository.create({
      ...createSubmissionDto,
      student_id: studentId,
      is_late: isLate
    });

    return await this.submissionRepository.save(submission);
  }

  // Soumettre un devoir (marquer comme soumis)
  async submitHomework(submissionId: number, studentId: number): Promise<HomeworkSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId, student_id: studentId },
      relations: ['homework']
    });

    if (!submission) {
      throw new NotFoundException('Soumission non trouvée');
    }

    submission.is_submitted = true;
    submission.submitted_at = new Date();

    return await this.submissionRepository.save(submission);
  }

  // Mettre à jour une soumission
  async updateSubmission(id: number, updateSubmissionDto: UpdateSubmissionDto, studentId: number): Promise<HomeworkSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id, student_id: studentId }
    });

    if (!submission) {
      throw new NotFoundException('Soumission non trouvée');
    }

    if (submission.is_submitted) {
      throw new ForbiddenException('Impossible de modifier une soumission déjà rendue');
    }

    await this.submissionRepository.update(id, updateSubmissionDto);
    return await this.submissionRepository.findOne({
      where: { id },
      relations: ['homework', 'student']
    });
  }

  // Obtenir les soumissions d'un étudiant
  async getStudentSubmissions(studentId: number): Promise<HomeworkSubmission[]> {
    return await this.submissionRepository.find({
      where: { student_id: studentId },
      relations: ['homework', 'homework.teacher'],
      order: { created_at: 'DESC' }
    });
  }

  // Obtenir les soumissions d'un devoir (pour les enseignants)
  async getHomeworkSubmissions(homeworkId: number, teacherId: number): Promise<HomeworkSubmission[]> {
    // Vérifier que l'enseignant est le propriétaire du devoir
    const homework = await this.homeworkRepository.findOne({
      where: { id: homeworkId, teacher_id: teacherId }
    });

    if (!homework) {
      throw new ForbiddenException('Vous ne pouvez voir que les soumissions de vos propres devoirs');
    }

    return await this.submissionRepository.find({
      where: { homework_id: homeworkId },
      relations: ['student'],
      order: { submitted_at: 'DESC' }
    });
  }

  // Noter une soumission
  async gradeSubmission(createGradeDto: CreateGradeDto, teacherId: number): Promise<Grade> {
    // Vérifier que l'utilisateur est un enseignant
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER }
    });

    if (!teacher) {
      throw new ForbiddenException('Seuls les enseignants peuvent noter');
    }

    // Vérifier que la soumission existe
    const submission = await this.submissionRepository.findOne({
      where: { id: createGradeDto.submission_id },
      relations: ['homework']
    });

    if (!submission) {
      throw new NotFoundException('Soumission non trouvée');
    }

    // Vérifier que l'enseignant est le propriétaire du devoir
    if (submission.homework.teacher_id !== teacherId) {
      throw new ForbiddenException('Vous ne pouvez noter que les soumissions de vos propres devoirs');
    }

    // Vérifier si une note existe déjà
    const existingGrade = await this.gradeRepository.findOne({
      where: { submission_id: createGradeDto.submission_id }
    });

    if (existingGrade) {
      throw new BadRequestException('Une note existe déjà pour cette soumission');
    }

    const grade = this.gradeRepository.create({
      ...createGradeDto,
      teacher_id: teacherId
    });

    return await this.gradeRepository.save(grade);
  }

  // Mettre à jour une note
  async updateGrade(gradeId: number, updateGradeDto: UpdateGradeDto, teacherId: number): Promise<Grade> {
    const grade = await this.gradeRepository.findOne({
      where: { id: gradeId, teacher_id: teacherId }
    });

    if (!grade) {
      throw new NotFoundException('Note non trouvée');
    }

    await this.gradeRepository.update(gradeId, updateGradeDto);
    return await this.gradeRepository.findOne({
      where: { id: gradeId },
      relations: ['submission', 'submission.student', 'teacher']
    });
  }

  // Obtenir les notes d'un étudiant
  async getStudentGrades(studentId: number): Promise<Grade[]> {
    return await this.gradeRepository.find({
      where: { submission: { student_id: studentId } },
      relations: ['submission', 'submission.homework', 'teacher'],
      order: { created_at: 'DESC' }
    });
  }

  // Obtenir les notes créées par un enseignant
  async getTeacherGrades(teacherId: number): Promise<Grade[]> {
    return await this.gradeRepository.find({
      where: { teacher_id: teacherId },
      relations: ['submission', 'submission.student', 'submission.homework'],
      order: { created_at: 'DESC' }
    });
  }

  // Obtenir les statistiques d'un devoir
  async getHomeworkStats(homeworkId: number, teacherId: number) {
    const homework = await this.homeworkRepository.findOne({
      where: { id: homeworkId, teacher_id: teacherId }
    });

    if (!homework) {
      throw new ForbiddenException('Devoir non trouvé');
    }

    const submissions = await this.submissionRepository.find({
      where: { homework_id: homeworkId },
      relations: ['student']
    });

    const grades = await this.gradeRepository.find({
      where: { submission: { homework_id: homeworkId } }
    });

    const totalSubmissions = submissions.length;
    const submittedCount = submissions.filter(s => s.is_submitted).length;
    const gradedCount = grades.length;
    const averageGrade = grades.length > 0 
      ? grades.reduce((sum, g) => sum + g.grade, 0) / grades.length 
      : 0;

    return {
      total_submissions: totalSubmissions,
      submitted_count: submittedCount,
      graded_count: gradedCount,
      average_grade: averageGrade,
      submissions: submissions,
      grades: grades
    };
  }

  // Noter automatiquement avec l'IA
  async autoGradeSubmission(submissionId: number, teacherId: number): Promise<Grade> {
    // Vérifier que l'utilisateur est un enseignant
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER }
    });

    if (!teacher) {
      throw new ForbiddenException('Seuls les enseignants peuvent noter');
    }

    // Récupérer la soumission avec le devoir
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ['homework', 'homework.teacher']
    });

    if (!submission) {
      throw new NotFoundException('Soumission non trouvée');
    }

    // Vérifier que l'enseignant est le propriétaire du devoir
    if (submission.homework.teacher_id !== teacherId) {
      throw new ForbiddenException('Vous ne pouvez noter que les soumissions de vos propres devoirs');
    }

    // Vérifier que la soumission est bien soumise
    if (!submission.is_submitted) {
      throw new BadRequestException('Cette soumission n\'est pas encore rendue');
    }

    // Vérifier si une note existe déjà
    const existingGrade = await this.gradeRepository.findOne({
      where: { submission_id: submissionId }
    });

    if (existingGrade) {
      throw new BadRequestException('Une note existe déjà pour cette soumission. Supprimez-la d\'abord.');
    }

    // Appeler l'IA pour noter
    const aiResult = await this.aiGradingService.gradeSubmission(submission, submission.homework);

    // Créer la note avec les résultats de l'IA
    const grade = this.gradeRepository.create({
      submission_id: submissionId,
      teacher_id: teacherId,
      grade: aiResult.grade,
      feedback: aiResult.feedback,
      is_final: false, // L'enseignant peut ajuster
    });

    return await this.gradeRepository.save(grade);
  }
}
