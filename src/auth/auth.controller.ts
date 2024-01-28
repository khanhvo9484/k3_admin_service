import { plainToClass } from 'class-transformer';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import CreateUserRequest, {
  SignInRequest,
  UserResponse,
} from '@user/dto/user.dto';
import { Public } from '@common/decorator';

import { RefreshTokenRequest } from './resources/dto';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/sign-in')
  async signIn(@Body() request: SignInRequest, @Res() res: Response) {
    const result = await this.authService.signIn(request);
    return res.status(200).json({
      message: 'Sign in successfully',
      data: result,
    });
  }

  @Post('/refresh-token/sign-out')
  async signOut(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { refresh_token: string },
  ) {
    const refreshToken = body.refresh_token;
    await this.authService.signOut(refreshToken);
    return res.status(200).json({
      message: 'Sign out successfully',
      data: {},
    });
  }

  @Post('/refresh-token/refresh')
  async refreshToken(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: RefreshTokenRequest,
  ) {
    const refreshToken = body.refresh_token;
    if (!refreshToken) {
      throw new BadRequestException('Invalid refresh token');
    }
    const result = await this.authService.refreshToken(refreshToken);
    return res
      .status(200)
      .json({ message: 'Refresh token successfully', data: result });
  }

  @Get('/protected')
  async protected() {
    return {
      message: 'Protected route',
      data: {},
    };
  }
}
