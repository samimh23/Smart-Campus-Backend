import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { Protect } from '../auth/auth-guard';
import { UserRole } from '../user/entities/role.enum';

@Controller('homework')
@UseGuards(Protect)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  @UseGuards(Protect)
  create(@Body() createHomeworkDto: CreateHomeworkDto, @Request() req) {
    return this.homeworkService.create(createHomeworkDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.homeworkService.findAll();
  }

  @Get('my-homework')
  @UseGuards(Protect)
  findMyHomework(@Request() req) {
    return this.homeworkService.findByTeacher(req.user.id);
  }

  @Get('upcoming')
  getUpcomingDeadlines() {
    return this.homeworkService.getUpcomingDeadlines();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(Protect)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHomeworkDto: UpdateHomeworkDto,
    @Request() req,
  ) {
    return this.homeworkService.update(id, updateHomeworkDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(Protect)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.homeworkService.remove(id, req.user.id);
  }
}
