import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [UploadController],
})
export class UploadModule {}

