import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { QuizModule } from './quiz/quiz.module';
import { GroqService } from './groq.service';
import { GroqModule } from './groq.module';
import { ExamModule } from './exam/exam.module';
import { UploadModule } from './upload.module';
import { ExplainModule } from './explain/explain.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'test',
      database: 'db_name',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      autoLoadEntities: true, // 👈 Automatically loads all entities registered with TypeOrmModule.forFeature()
      //logging: true,
    }),
    {
      ...JwtModule.register({
          secret:  'dggredg,erg,ergz464rzerr', // Vous pouvez aussi mettre une clé par défaut
          signOptions: { expiresIn: '24h' },
        }),
        global: true
    },
    UserModule,
    AuthModule,
    QuizModule,
    GroqModule,
    ExamModule,
    UploadModule,
    ExplainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
