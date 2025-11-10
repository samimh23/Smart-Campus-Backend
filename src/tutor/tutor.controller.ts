// tutor.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request, Query, Put } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { CodeRunnerService } from './code-runner.service';
import { Protect } from 'src/auth/auth-guard';
import { GenerateExerciseDto, GenerateLessonDto, GetProgressDto, SubmitSolutionDto, UpdateApiKeyDto } from './dto/generate-lesson.dto';

@Controller('tutor')
@UseGuards(Protect)
export class TutorController {
  constructor(
    private readonly tutorService: TutorService,
    private readonly codeRunnerService: CodeRunnerService,
  ) {}

@Post('generate-lesson')
generateLesson(@Request() req, @Body() generateLessonDto: GenerateLessonDto) {
  console.log('--- New Request to /generate-lesson ---');
  console.log('Headers:', req.headers);
  console.log('Body:', generateLessonDto);
  console.log('Authenticated User:', req.user);
  console.log('Full Request Object (use carefully):', req); // ⚠️ very large

  return this.tutorService.generateLesson(
    req.user.id,
    generateLessonDto.language,
    generateLessonDto.subject,
  );
}

  @Post('generate-exercise')
  generateExercise(@Request() req, @Body() generateExerciseDto: GenerateExerciseDto) {
    return this.tutorService.generateExercise(req.user.id, generateExerciseDto.language, generateExerciseDto.subject);
  }

  @Get('lessons')
  getAllLessons(@Request() req) {
    return this.tutorService.getAllLessons(req.user.id);
  }

  @Get('exercises')
  getAllExercises(@Request() req) {
    return this.tutorService.getAllExercises(req.user.id);
  }

  
  @Post('submit-solution')
  submitSolution(@Request() req, @Body() submitSolutionDto: SubmitSolutionDto) {
    return this.tutorService.submitSolution(req.user.id, submitSolutionDto.exerciseId, submitSolutionDto.userCode);
  }

  @Get('progress')
  getProgress(@Request() req, @Query() getProgressDto: GetProgressDto) {
    return this.tutorService.getProgress(req.user.id, getProgressDto.language, getProgressDto.subject);
  }

  @Put('update-api-key')
  updateApiKey(@Request() req, @Body() updateApiKeyDto: UpdateApiKeyDto) {
    return this.tutorService.updateApiKey(req.user.id, updateApiKeyDto.apiKey);
  }

  /**
   * POST /tutor/run-code
   * Run user code with Judge0
   * Body: { language: string, code: string, stdin?: string, timeout?: number, expectedOutput?: string }
   */
  @Post('run-code')
  async runCode(@Body() body: any) {
    return this.codeRunnerService.runCode(body);
  }

  /**
   * POST /tutor/run-tests
   * Run multiple test cases
   * Body: { language: string, code: string, tests: [{stdin, expectedOutput}] }
   */
  @Post('run-tests')
  async runTests(@Body() body: { language: string; code: string; tests: any[] }) {
    return this.codeRunnerService.runTests(body.language, body.code, body.tests);
  }
}