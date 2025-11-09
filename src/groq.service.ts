import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

@Injectable()
export class GroqService {
  private readonly openai: OpenAI;
  private readonly groq: Groq;

  // prompt for image explaination steps
  private readonly explainImagePrompt = `
You are an AI assistant that explains images step-by-step.
Given an image URL and a question about the image, provide a detailed explanation in JSON format.
✅ Structure:
{
  "steps": [
    {
      "step_number": number,
      "text": "string"
    }
  ]
}
Always respond ONLY in valid JSON format that can be parsed by JavaScript — no text outside JSON.
`;

  private readonly quizPrompt = `
You are an AI quiz generator. 
Your task is to create quizzes for students based on a given subject or topic.
Always respond ONLY in valid JSON format that can be parsed by JavaScript — no text outside JSON.

✅ Structure:
{
  "subject": "string",
  "topic": "string",
  "difficulty": "easy|medium|hard",
  "language": "en|fr|ar",
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_option": 0,
      "explanation": "string"
    }
  ]
}
`;

  // 🧪 Prompt for essay-style (open-ended) exam generator
  private readonly examPrompt = `
You are an AI exam generator for essay-style questions.
Generate an exam in pure JSON format (no markdown, no commentary).
The exam should contain open-ended questions that require the student to write their own answer.

✅ Structure:
{
  "exam_title": "string",
  "subject": "string",
  "topic": "string",
  "language": "en" | "fr" | "ar",
  "difficulty": "easy|medium|hard",
  "duration_minutes": number,
  "questions": [
    {
      "id": number,
      "question": "string",
      "expected_answer": "string",
      "explanation": "string"
    }
  ]
}

🧩 Rules:
- Include 5–10 questions unless user specifies otherwise.
- Each question must have an ideal answer in 'expected_answer' and an 'explanation'.
- Always respond with strictly valid JSON only.
`;

  constructor() {
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    this.groq = new Groq({
      apiKey: groqApiKey,
    });
  }



  // 🖼 Explain image step-by-step
  async explainImage(imageUrl: string, question: string) {
    const response = await this.groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'system',
        content: this.explainImagePrompt,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: question },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
  });
    // return this.parseResponse(response);
    //parse steps from response
    try {
      const text = response.choices[0].message.content || '';
      console.log('AI Response Text:', text);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found in AI response');
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.steps;
    } catch (err) {
      console.error('❌ Invalid AI JSON:', err);
      throw new Error('AI returned invalid JSON');
    }
  }

  async createQuizJson(userMsg: string) { 
    const response = await this.openai.responses.create({ model: 'openai/gpt-oss-20b', instructions: this.quizPrompt, input: userMsg, }); 
    return this.parseResponse(response);
  }

  // 🧠 Generate written exam
  async createExamJson(userMsg: string) {
    const response = await this.openai.responses.create({
      model: 'openai/gpt-oss-20b',
      instructions: this.examPrompt,
      input: userMsg,
    });
    return this.parseResponse(response);
  }

  // ✅ Evaluate student's written answer
  async checkAnswer(question: string, expectedAnswer: string, studentAnswer: string) {
    const checkPrompt = `
You are an exam evaluator. 
Compare the student's answer to the expected answer.
Be fair and explain your reasoning.

Respond ONLY in JSON:
{
  "is_correct": true|false,
  "score": number, // between 0 and 10
  "feedback": "string",
  "explanation": "string"
}
`;

    const response = await this.openai.responses.create({
      model: 'openai/gpt-oss-20b',
      instructions: checkPrompt,
      input: `Question: ${question}\nExpected Answer: ${expectedAnswer}\nStudent Answer: ${studentAnswer}`,
    });

    return this.parseResponse(response);
  }

  // 💬 Chat with AI about a question
  async chatAboutQuestion(
    question: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
  ) {
    const chatPrompt = `
You are an AI tutor helping a student understand this question:
"${question}"
Keep context focused on that question.
Always return a JSON response:
{
  "reply": "string"
}
`;

    const response = await this.openai.responses.create({
      model: 'openai/gpt-oss-20b',
      instructions: chatPrompt,
      input: messages,
    });

    return this.parseResponse(response);
  }

  // 🔍 Safe JSON parse
  private parseResponse(response: any) {
    try {
      const text = response.output_text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found in AI response');
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('❌ Invalid AI JSON:', err);
      throw new Error('AI returned invalid JSON');
    }
  }
}