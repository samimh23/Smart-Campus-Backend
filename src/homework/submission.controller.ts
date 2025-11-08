import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto, UpdateSubmissionDto } from './dto/create-submission.dto';
import { CreateGradeDto, UpdateGradeDto } from './dto/create-grade.dto';
import { Protect } from '../auth/auth-guard';
import { AIGradingService } from '../ai-grading/ai-grading.service';

@Controller('submissions')
@UseGuards(Protect)
export class SubmissionController {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly aiGradingService: AIGradingService,
  ) {}

  // Créer une soumission
  @Post()
  createSubmission(@Body() createSubmissionDto: CreateSubmissionDto, @Request() req) {
    return this.submissionService.createSubmission(createSubmissionDto, req.user.id);
  }

  // Soumettre un devoir (marquer comme soumis)
  @Post(':id/submit')
  submitHomework(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.submissionService.submitHomework(id, req.user.id);
  }

  // Mettre à jour une soumission
  @Patch(':id')
  updateSubmission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @Request() req,
  ) {
    return this.submissionService.updateSubmission(id, updateSubmissionDto, req.user.id);
  }

  // Obtenir les soumissions d'un étudiant
  @Get('my-submissions')
  getMySubmissions(@Request() req) {
    return this.submissionService.getStudentSubmissions(req.user.id);
  }

  // Obtenir les soumissions d'un devoir (pour les enseignants)
  @Get('homework/:homeworkId')
  getHomeworkSubmissions(
    @Param('homeworkId', ParseIntPipe) homeworkId: number,
    @Request() req,
  ) {
    return this.submissionService.getHomeworkSubmissions(homeworkId, req.user.id);
  }

  // Noter une soumission
  @Post('grade')
  gradeSubmission(@Body() createGradeDto: CreateGradeDto, @Request() req) {
    return this.submissionService.gradeSubmission(createGradeDto, req.user.id);
  }

  // Mettre à jour une note
  @Patch('grade/:gradeId')
  updateGrade(
    @Param('gradeId', ParseIntPipe) gradeId: number,
    @Body() updateGradeDto: UpdateGradeDto,
    @Request() req,
  ) {
    return this.submissionService.updateGrade(gradeId, updateGradeDto, req.user.id);
  }

  // Obtenir les notes d'un étudiant
  @Get('my-grades')
  getMyGrades(@Request() req) {
    return this.submissionService.getStudentGrades(req.user.id);
  }

  // Obtenir les notes créées par un enseignant
  @Get('teacher-grades')
  getTeacherGrades(@Request() req) {
    return this.submissionService.getTeacherGrades(req.user.id);
  }

  // Obtenir les statistiques d'un devoir
  @Get('homework/:homeworkId/stats')
  getHomeworkStats(
    @Param('homeworkId', ParseIntPipe) homeworkId: number,
    @Request() req,
  ) {
    return this.submissionService.getHomeworkStats(homeworkId, req.user.id);
  }

  // Noter automatiquement avec l'IA
  @Post(':id/auto-grade')
  async autoGradeSubmission(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.submissionService.autoGradeSubmission(id, req.user.id);
  }
}
