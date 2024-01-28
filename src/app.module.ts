import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@my-prisma/prisma.module';
import { AdminModule } from 'admin/admin.module';
import { AuthModule } from '@auth/auth.module';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import {
  JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  JWT_ACCESS_TOKEN_PRIVATE_KEY,
  JWT_ACCESS_TOKEN_PUBLIC_KEY,
  JWT_OTHERS_TOKEN_EXPIRATION_TIME,
  JWT_OTHERS_TOKEN_PRIVATE_KEY,
  JWT_OTHERS_TOKEN_PUBLIC_KEY,
  JWT_REFRESH_TOKEN_EXPIRATION_TIME,
  JWT_REFRESH_TOKEN_PRIVATE_KEY,
  JWT_REFRESH_TOKEN_PUBLIC_KEY,
  REDIS_URL,
} from './enviroment';
import { CustomJWTModule } from 'utils/jwt-helper/custom-jwt.module';
import { ExcelModule } from 'utils/excel/excel.module';

@Module({
  imports: [
    PrismaModule,
    AdminModule,
    AuthModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          url: REDIS_URL,
          store: 'memory',
          pingInterval: 30000,
        });
        return {
          store: store as unknown as CacheStore,
        };
      },
    }),
    CustomJWTModule.register({
      isGlobal: true,

      accessTokenPrivateKey: JWT_ACCESS_TOKEN_PRIVATE_KEY,
      accessTokenPublicKey: JWT_ACCESS_TOKEN_PUBLIC_KEY,
      refreshTokenPrivateKey: JWT_REFRESH_TOKEN_PRIVATE_KEY,
      refreshTokenPublicKey: JWT_REFRESH_TOKEN_PUBLIC_KEY,
      othersTokenPrivateKey: JWT_OTHERS_TOKEN_PRIVATE_KEY,
      othersTokenPublicKey: JWT_OTHERS_TOKEN_PUBLIC_KEY,

      accessTokenExpiresIn: parseInt(JWT_ACCESS_TOKEN_EXPIRATION_TIME),
      refreshTokenExpiresIn: parseInt(JWT_REFRESH_TOKEN_EXPIRATION_TIME),
      otherTokenExpiresIn: parseInt(JWT_OTHERS_TOKEN_EXPIRATION_TIME),
    }),

    AuthModule,

    PrismaModule,
    ExcelModule,

    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
