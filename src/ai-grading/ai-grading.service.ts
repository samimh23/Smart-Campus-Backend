import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HomeworkSubmission } from '../homework/entities/homework-submission.entity';
import { Homework } from '../homework/entities/homework.entity';

export interface AIGradingResult {
  grade: number;
  feedback: string;
  criteria: {
    relevance: number;
    structure: number;
    writing: number;
    compliance: number;
  };
}

@Injectable()
export class AIGradingService {
  private readonly logger = new Logger(AIGradingService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    this.logger.log(`🔑 Checking GEMINI_API_KEY: ${apiKey ? 'Found ✅' : 'NOT FOUND ❌'}`);
    
    if (!apiKey) {
      this.logger.error('❌ GEMINI_API_KEY not found in environment variables');
      this.logger.error('❌ Make sure .env file exists with GEMINI_API_KEY set');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Utiliser gemini-2.5-flash (le modèle le plus récent et rapide)
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });
      this.logger.log('✅ Gemini AI initialized successfully with gemini-2.5-flash');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Gemini AI:', error);
      this.logger.error('Error details:', error);
    }
  }

  async gradeSubmission(
    submission: HomeworkSubmission,
    homework: Homework,
  ): Promise<AIGradingResult> {
    this.logger.log(`🤖 Starting AI grading for submission ${submission.id}...`);
    
    if (!this.model) {
      this.logger.error('❌ Gemini model not initialized!');
      throw new Error('Gemini API not configured. Please set GEMINI_API_KEY in .env and restart the server');
    }

    try {
      const prompt = this.buildPrompt(submission, homework);
      
      this.logger.log(`📝 Prompt built, calling Gemini API...`);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      this.logger.log(`✅ AI Response received for submission ${submission.id}`);
      this.logger.debug(`AI Response: ${text.substring(0, 100)}...`);
      
      const parsedResult = this.parseAIResponse(text);
      this.logger.log(`✅ Grade: ${parsedResult.grade}/20`);
      
      return parsedResult;
    } catch (error) {
      this.logger.error(`❌ Error grading submission ${submission.id}: ${error.message}`);
      this.logger.error(`Full error:`, error);
      throw new Error(`Failed to grade submission with AI: ${error.message}`);
    }
  }

  private buildPrompt(submission: HomeworkSubmission, homework: Homework): string {
    return `Tu es un enseignant expert et bienveillant. Tu dois évaluer ce devoir d'étudiant de manière juste et constructive.

📚 INFORMATIONS DU DEVOIR :
Titre : ${homework.title}
Description : ${homework.description}
Matière : ${homework.subject || 'Non spécifié'}
Niveau : ${homework.grade_level || 'Non spécifié'}

📝 SOUMISSION DE L'ÉTUDIANT :
${submission.content}

📊 CRITÈRES D'ÉVALUATION :
1. PERTINENCE (40%) : Le contenu répond-il à la question ? Les concepts sont-ils bien compris ?
2. STRUCTURE (30%) : Le devoir est-il bien organisé ? Y a-t-il une introduction et une conclusion ?
3. QUALITÉ D'ÉCRITURE (20%) : L'orthographe et la grammaire sont-elles correctes ? Le style est-il clair ?
4. RESPECT DES CONSIGNES (10%) : L'étudiant a-t-il suivi les instructions ?

🎯 TÂCHE :
Évalue ce devoir et retourne ta réponse EXACTEMENT dans ce format JSON (sans markdown, juste le JSON) :

{
  "grade": [note sur 20, NOMBRE ENTIER uniquement (0, 1, 2, ... 18, 19, 20)],
  "feedback": "[Un feedback constructif et encourageant en 3-4 phrases]",
  "criteria": {
    "relevance": [note sur 10, nombre entier],
    "structure": [note sur 10, nombre entier],
    "writing": [note sur 10, nombre entier],
    "compliance": [note sur 10, nombre entier]
  }
}

⚠️ IMPORTANT : La note doit être un nombre ENTIER entre 0 et 20 (pas de virgule, pas de décimale).
Sois juste mais bienveillant. Encourage l'étudiant et donne des pistes d'amélioration concrètes.`;
  }

  private parseAIResponse(text: string): AIGradingResult {
    try {
      // Nettoyer le texte pour extraire le JSON
      let jsonText = text.trim();
      
      // Enlever les balises markdown si présentes
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Trouver le JSON dans le texte
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonText);
      
      // Valider et normaliser les données
      const grade = Math.min(20, Math.max(0, parseFloat(parsed.grade) || 0));
      
      return {
        grade: Math.round(grade), // Arrondir à un nombre entier (0-20)
        feedback: parsed.feedback || 'Bon travail !',
        criteria: {
          relevance: Math.round(Math.min(10, Math.max(0, parseFloat(parsed.criteria?.relevance) || 5))),
          structure: Math.round(Math.min(10, Math.max(0, parseFloat(parsed.criteria?.structure) || 5))),
          writing: Math.round(Math.min(10, Math.max(0, parseFloat(parsed.criteria?.writing) || 5))),
          compliance: Math.round(Math.min(10, Math.max(0, parseFloat(parsed.criteria?.compliance) || 5))),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
      this.logger.debug(`AI Response text: ${text}`);
      
      // Fallback avec une note moyenne
      return {
        grade: 12,
        feedback: 'Évaluation automatique effectuée. Veuillez vérifier et ajuster si nécessaire.',
        criteria: {
          relevance: 6,
          structure: 6,
          writing: 6,
          compliance: 6,
        },
      };
    }
  }
}

