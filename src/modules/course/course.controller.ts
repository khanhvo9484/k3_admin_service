import { User } from '@prisma/client';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { CourseService } from './course.service';
import {
  CourseIdOnlyRequest,
  CourseResponse,
  CreateCourseRequest,
  CreateInvitationRequest,
  JoinCourseRequest,
  UpdateCourseRequest,
} from './dto/course.dto';
import { Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { UserResponse } from '@user/dto/user.dto';
import { Public } from '@common/decorator';

@Controller('courses')
export class CourseController {
  constructor(private courseService: CourseService) {}

  @Get('all')
  @HttpCode(200)
  async getAllCourse(@Req() request: Request) {
    const user = request.user;
    const result = await this.courseService.getAllCourse(user.id);
    const refinedResult = result.map((item) => {
      return plainToClass(CourseResponse, item);
    });
    return { message: 'get all course successfully', data: refinedResult };
  }

  @Get('all-archived')
  @HttpCode(200)
  async getAllArchivedCourse(@Req() request: Request) {
    const user = request.user;
    const result = await this.courseService.getAllArchivedCourse(user.id);
    const refinedResult = result.map((item) => {
      return plainToClass(CourseResponse, item);
    });
    return {
      message: 'get all archived course successfully',
      data: refinedResult,
    };
  }

  @Get('get-all-course-member')
  @HttpCode(200)
  async getAllCourseMember(
    @Req() request: Request,
    @Query('courseId') courseId: string,
  ) {
    const user = request.user;
    const result = await this.courseService.getAllCourseMember(user, courseId);

    return { message: 'get all course member successfully', data: result };
  }

  @Put('update-role')
  @HttpCode(200)
  async updateRole(@Body() body: { courseId: string }) {
    // return await this.courseService.updateRole(body.courseId)
  }
}
