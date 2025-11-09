import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './intercepteurs';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  // Create a Nest Express app (needed for serving static files)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Optional: enable validation globally if needed
  // app.useGlobalPipes(new ValidationPipe());

  // Logging interceptor (you already had this)
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ✅ Enable CORS for your frontend apps
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3002'], // 👈 Your frontends
    credentials: true,               // 👈 Allow cookies if used
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ Serve uploaded files from the 'uploads' folder
  // This means anything inside /uploads will be available at http://localhost:3000/uploads/...
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📂 Uploaded files are served from http://localhost:3000/uploads');
}

bootstrap();
