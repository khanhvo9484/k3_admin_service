import { ManageTokenInCacheService } from './resources/utils/manage-token-in-cache';
import { plainToClass } from 'class-transformer';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import CreateUserRequest, {
  SignInRequest,
  UserResponse,
} from '@user/dto/user.dto';
import { Cache } from 'cache-manager';
import { JwtPayloadDto } from '@shared/jwt.payload';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UsersService } from '@user/user.service';
import { TokenFactoryService } from '@utils/jwt-helper/token-factory.service';
import { comparePassword } from '@utils/password-helper';
import { TokenType } from '@utils/jwt-helper/resources/token-type.enum';
import {
  JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  JWT_REFRESH_TOKEN_EXPIRATION_TIME,
} from 'enviroment';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private tokenFactory: TokenFactoryService,
    private manageTokenInCacheService: ManageTokenInCacheService,
  ) {}

  async signIn(request: SignInRequest) {
    const user = await this.usersService.findUser({
      email: request.email,
    });

    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }
    if (user.isBlocked) {
      throw new BadRequestException('User is blocked');
    }
    const match = await comparePassword(request.password, user.password);
    if (!match) {
      throw new BadRequestException('Invalid email or password');
    }

    const payload: CustomJwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    let token: string = await this.cache.get('access_token_' + user.email);
    if (!token) {
      token = this.tokenFactory
        .createTokenInstance(TokenType.ACCESS_TOKEN)
        .sign(payload);
      await this.cache.set('access_token_' + user.email, token, {
        ttl: parseInt(JWT_ACCESS_TOKEN_EXPIRATION_TIME),
      });
    }
    let refreshToken: string = await this.cache.get(
      'refresh_token_' + user.email,
    );
    if (!refreshToken) {
      refreshToken = this.tokenFactory
        .createTokenInstance(TokenType.REFRESH_TOKEN)
        .sign(payload);
      await this.cache.set('refresh_token_' + user.email, refreshToken, {
        ttl: parseInt(JWT_REFRESH_TOKEN_EXPIRATION_TIME),
      });
    }
    const userResponse = plainToClass(UserResponse, user);
    return {
      access_token: token,
      user: userResponse,
      refresh_token: refreshToken,
    };
  }
  async signOut(refreshToken: string): Promise<boolean> {
    const payload = await this.tokenFactory.verify<CustomJwtPayload>(
      refreshToken,
      TokenType.REFRESH_TOKEN,
    );
    if (!payload) {
      throw new BadRequestException('Invalid refresh token');
    }
    const email = payload.email;
    if (!email) {
      throw new BadRequestException('Invalid refresh token');
    }
    await this.cache.del('access_token_' + email);
    await this.cache.del('refresh_token_' + email);
    return true;
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.tokenFactory.verify<CustomJwtPayload>(
      refreshToken,
      TokenType.REFRESH_TOKEN,
    );
    const email = payload.email;
    if (!email) {
      throw new BadRequestException('Invalid refresh token 1');
    }
    const inStorageToken = await this.cache.get('refresh_token_' + email);
    if (!inStorageToken) {
      throw new BadRequestException('Invalid refresh token 2');
    }
    if (inStorageToken !== refreshToken) {
      throw new BadRequestException('Invalid refresh token 3');
    }
    const newPayload: CustomJwtPayload = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    const newRefreshToken = this.tokenFactory.sign(
      newPayload,
      TokenType.REFRESH_TOKEN,
    );
    const newAccessToken = this.tokenFactory.sign(
      newPayload,
      TokenType.ACCESS_TOKEN,
    );
    await this.cache.set('access_token_' + email, newAccessToken, {
      ttl: parseInt(JWT_ACCESS_TOKEN_EXPIRATION_TIME),
    });
    await this.cache.set('refresh_token_' + email, newRefreshToken, {
      ttl: parseInt(JWT_REFRESH_TOKEN_EXPIRATION_TIME),
    });
    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async deleteUserSession(email: string) {
    await this.cache.del('access_token_' + email);
    await this.cache.del('refresh_token_' + email);
    return true;
  }
}
