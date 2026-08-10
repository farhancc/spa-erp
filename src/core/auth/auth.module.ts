import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module';
import { TenancyModule } from '../tenancy/tenancy.module';

@Module({
  imports: [
    DatabaseModule,
    TenancyModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('app.jwt.secret'),
        signOptions: {
          expiresIn: config.get<string>('app.jwt.expiresIn'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
