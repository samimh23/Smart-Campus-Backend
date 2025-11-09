import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

// Judge0 language ID mapping (from GET /languages)
const LANGUAGE_MAP: Record<string, number> = {
  javascript: 63,  // Node.js 12.14.0
  typescript: 74,  // TypeScript 3.7.4
  python: 71,      // Python 3.8.1
  java: 62,        // OpenJDK 13.0.1
  cpp: 54,         // C++ (GCC 9.2.0)
  csharp: 51,      // C# (Mono 6.6.0.161)
  go: 60,          // Go 1.13.5
  rust: 73,        // Rust 1.40.0
};

export interface RunCodeDto {
  language: string;
  code: string;
  stdin?: string;
  timeout?: number; // seconds, default 5
  expectedOutput?: string; // for simple test
}

export interface RunResult {
  stdout: string | null;
  stderr: string | null;
  status: { id: number; description: string };
  time: string | null; // execution time in seconds
  memory: number | null; // KB
  compileOutput: string | null;
  success?: boolean; // if expectedOutput provided
}

@Injectable()
export class CodeRunnerService {
  private judgeUrl = process.env.JUDGE0_URL || 'http://localhost:2358';

  async runCode(dto: RunCodeDto): Promise<RunResult> {
    const languageId = LANGUAGE_MAP[dto.language?.toLowerCase()];
    if (!languageId) {
      throw new HttpException(
        `Language "${dto.language}" not supported. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const payload = {
      source_code: dto.code,
      language_id: languageId,
      stdin: dto.stdin || '',
      cpu_time_limit: dto.timeout || 5,
      // base64_encoded: false by default
    };

    try {
      // Submit and wait for result (Judge0 supports wait=true)
      const response = await axios.post(
        `${this.judgeUrl}/submissions?base64_encoded=false&wait=true`,
        payload,
        { timeout: ((dto.timeout || 5) + 3) * 1000 }, // allow Judge0 time + network overhead
      );

      const result = response.data;

      // Normalize result
      const output: RunResult = {
        stdout: result.stdout?.trim() || null,
        stderr: result.stderr?.trim() || null,
        status: result.status || { id: 0, description: 'Unknown' },
        time: result.time,
        memory: result.memory,
        compileOutput: result.compile_output?.trim() || null,
      };

      // Simple test: compare stdout with expectedOutput
      if (dto.expectedOutput !== undefined) {
        output.success =
          output.stdout?.trim() === dto.expectedOutput.trim();
      }

      return output;
    } catch (error) {
      console.error('[CodeRunner] Judge0 error:', error.message);
      throw new HttpException(
        'Code execution failed. Judge0 may be unavailable.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Run multiple test cases
   */
  async runTests(
    language: string,
    code: string,
    tests: Array<{ stdin: string; expectedOutput: string }>,
  ) {
    const results = [];
    for (const test of tests) {
      const result = await this.runCode({
        language,
        code,
        stdin: test.stdin,
        expectedOutput: test.expectedOutput,
      });
      results.push({
        ...result,
        passed: result.success,
      });
    }
    return results;
  }
}
