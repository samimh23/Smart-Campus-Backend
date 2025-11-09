import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { TutorModule } from './tutor/tutor.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'sami',
      database: 'db_Smart',
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
    TutorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
