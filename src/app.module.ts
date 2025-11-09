import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { HomeworkModule } from './homework/homework.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CoursesModule } from './cours/courses.module';
import { ClasseModule } from './classe/classe.module';
import { SubjectModule } from './subject/subject.module';
import { AIModule } from './Ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'wiem2002',
      database: 'db_Smart',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      autoLoadEntities: true, // 👈 Automatically loads all entities registered with TypeOrmModule.forFeature()
      //logging: true,
    }),
    {
      ...JwtModule.register({
          secret:  'dggredg,erg,ergz464rzerr', // Vous pouvez aussi mettre une clé par défaut
          signOptions: {},
        }),
        global: true
    },
    UserModule,
    AuthModule,
    HomeworkModule,
    NotificationsModule,
    CoursesModule,
    ClasseModule,
    SubjectModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
