import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Protect } from 'src/auth/auth-guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

@Controller('courses')
@UseGuards(Protect)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ✅ Upload file for a course (PDF, Word, PowerPoint, etc.)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', 'uploads', 'courses'),
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  uploadCourseFile(@UploadedFile() file: any) {
    if (!file) {
      return { message: 'No file uploaded!' };
    }
    return {
      message: 'File uploaded successfully!',
      filename: file.filename,
      path: `/uploads/courses/${file.filename}`,
      originalFileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    };
  }
 

  @Post()
  create(@Body() dto: CreateCourseDto & {
    originalFileName?: string;
    fileSize?: number;
    fileType?: string;
  }, @Req() req) {
    return this.coursesService.create(dto, req.user);
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @Req() req) {
    return this.coursesService.update(+id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.coursesService.remove(+id, req.user);
 
  }


  @Get('class/:classId')
async findCoursesByClass(@Param('classId') classId: string) {
  return this.coursesService.findByClass(+classId);
}
}
