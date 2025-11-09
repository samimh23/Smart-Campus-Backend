// dto/generate-lesson.dto.ts
export class GenerateLessonDto {
  language: string;
  subject: string;
}

// dto/generate-exercise.dto.ts
export class GenerateExerciseDto {
  language: string;
  subject: string;
}

// dto/submit-solution.dto.ts
export class SubmitSolutionDto {
  exerciseId: string;
  userCode: string;
}

// dto/update-api-key.dto.ts
export class UpdateApiKeyDto {
  apiKey: string;
}

// dto/get-progress.dto.ts
export class GetProgressDto {
  language: string;
  subject: string;
}