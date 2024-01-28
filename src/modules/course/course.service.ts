import {
  EmailTempateId,
  InviteToCourseSubstitution,
} from './../../shared/email-template';
import { UsersService } from './../user/user.service';
import { TokenFactoryService } from './../../utils/jwt-helper/token-factory.service';
import { generateCode } from '@utils/id-helper';
import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ICourseService } from './course.interface';
import { Prisma, Course, User_Course } from '@prisma/client';
import { CourseRepository } from './course.repository';
import { DatabaseExecutionException } from '@common/exceptions';
import {
  CreateCourseRequest,
  CreateInvitationRequest,
  JoinCourseRequest,
  UpdateCourseRequest,
  InviteToCoursePayload,
} from './dto/course.dto';

import { TokenType } from '@utils/jwt-helper/resources/token-type.enum';
import { InviteToCourseToken } from '@utils/jwt-helper/resources/invite-to-course-token';
import { PrismaService } from '@my-prisma/prisma.service';
import {
  FE_INVITE_TO_COURSE_URL,
  FE_VERIFICATION_URL,
  PROTOCOL,
} from '@enviroment/index';
import { plainToClass } from 'class-transformer';
import { UserResponse } from '@user/dto/user.dto';
import { InviteToCourseJwtPayload } from '@utils/jwt-helper/resources/token.interface';

@Injectable()
export class CourseService {
  constructor(
    private courseRepository: CourseRepository,
    private prisma: PrismaService,
  ) {}

  async getAllCourse(
    userId: string,
    params?: {
      skip?: number;
      take?: number;
      cursor?: Prisma.UserWhereUniqueInput;
      where?: Prisma.UserWhereInput;
      orderBy?: Prisma.UserOrderByWithRelationInput;
    },
  ) {
    try {
      return await this.courseRepository.getAllCourse(userId, params);
    } catch (error) {
      throw new DatabaseExecutionException('Get all course failed');
    }
  }
  async getAllCourseByAdmin() {
    try {
      return await this.courseRepository.getAllCourseByAdmin();
    } catch (error) {
      throw new DatabaseExecutionException('Get all course failed');
    }
  }

  async getAllArchivedCourse(
    userId: string,
    params?: {
      skip?: number;
      take?: number;
      cursor?: Prisma.UserWhereUniqueInput;
      where?: Prisma.UserWhereInput;
      orderBy?: Prisma.UserOrderByWithRelationInput;
    },
  ) {
    try {
      return await this.courseRepository.getAllArchivedCourse(userId, params);
    } catch (error) {
      throw new DatabaseExecutionException('Get all archived course failed');
    }
  }

  async getAllCourseMember(user: CustomJwtPayload, courseId: string) {
    try {
      const userInCourse = await this.courseRepository.getEnrollmentById({
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      });
      if (!userInCourse) {
        throw new BadRequestException('You are not in this course');
      }
      const result = await this.prisma.$transaction(
        async (prisma) => {
          const memberListResult =
            await this.courseRepository.getAllCourseMember({
              courseId: courseId,
            });
          const students = memberListResult.students.map((item) => {
            return {
              ...plainToClass(UserResponse, item),
              roleInCourse: 'student',
            };
          });
          const teachers = memberListResult.teachers.map((item) => {
            return {
              ...plainToClass(UserResponse, item),
              roleInCourse: 'teacher',
            };
          });
          const memberList = { teachers, students };
          const invitationList = await this.courseRepository.getAllInvitation({
            courseId: courseId,
            status: 'pending',
          });
          // const invitationList = invitationListResult.map((item) => {
          // 	return {
          // 		...item,
          // 		roleInCourse: item.roleInCourse
          // 	}
          // })
          const mergedList = { memberList, invitationList };
          return mergedList;
        },
        {
          maxWait: 30000, // default: 2000
          timeout: 30000, // default: 5000
        },
      );

      return result;
    } catch (error) {
      console.error(error);
      throw new DatabaseExecutionException('Get all course member failed');
    }
  }

  async getAllCourseStudentIds(courseId: string) {
    try {
      const result = await this.prisma.$transaction(
        async (prisma) => {
          const memberListResult =
            await this.courseRepository.getAllCourseMember({
              courseId: courseId,
            });

          const students = memberListResult.students.map((item) => {
            return {
              id: item.id,
              email: item.email,
              studentOfficialId: item.studentOfficialId,
            };
          });
          return students;
        },
        {
          maxWait: 30000, // default: 2000
          timeout: 30000, // default: 5000
        },
      );

      return result;
    } catch (error) {
      console.error(error);
      throw new DatabaseExecutionException('Get all course member failed');
    }
  }
}
