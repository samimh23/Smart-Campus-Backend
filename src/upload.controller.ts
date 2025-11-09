import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs/promises';
import { url } from 'inspector';

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads', // Folder where files are stored
      filename: (req, file, callback) => {
        // Generate a custom file name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
        callback(null, fileName);
      },
    }),
  }))
  uploadFile(@UploadedFile() file) {
    return {
      message: 'File uploaded successfully',
      fileName: file.filename,
      url: `https://frog-loving-vaguely.ngrok-free.app/uploads/${file.filename}`,
    };
  }
}