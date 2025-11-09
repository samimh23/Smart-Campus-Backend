import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './intercepteurs';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as dotenv from 'dotenv';

async function bootstrap() {
  // ✅ Load environment variables from .env
  dotenv.config();

  // Create a Nest Express app (needed for serving static files)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Optional: enable validation globally
  // app.useGlobalPipes(new ValidationPipe());

  // Logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ✅ Get values from .env with fallbacks
  const PORT = process.env.PORT || 3000;
  const FRONTEND_ORIGINS = process.env.FRONTEND_ORIGINS
    ? process.env.FRONTEND_ORIGINS.split(',')
    : ['http://localhost:3001', 'http://localhost:3002'];

  // ✅ Enable CORS
  app.enableCors({
    origin: FRONTEND_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ Serve static files (uploads)
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  await app.listen(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Uploaded files are served from http://localhost:${PORT}/uploads`);
  console.log(`🌍 CORS allowed for: ${FRONTEND_ORIGINS.join(', ')}`);
}

bootstrap();
