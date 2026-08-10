import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync, IsNotEmpty, IsOptional } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  PORT: number = 3001;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string = '7d';

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsNotEmpty()
  WHATSAPP_SESSION_DIR: string = './.wwebjs_auth';

  @IsString()
  @IsOptional()
  SENDGRID_API_KEY?: string;

  @IsString()
  @IsOptional()
  SENDGRID_FROM_EMAIL?: string;

  @IsString()
  @IsOptional()
  TWILIO_ACCOUNT_SID?: string;

  @IsString()
  @IsOptional()
  TWILIO_AUTH_TOKEN?: string;

  @IsString()
  @IsOptional()
  TWILIO_FROM_NUMBER?: string;
}

export function validate(config: Record<string, any>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.map(err => Object.values(err.constraints || {}).join('\n')).join('\n')}`);
  }

  // SEC-04 Validation: Enforce minimum entropy for JWT_SECRET
  const jwtSecret = validatedConfig.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret === 'change-me-in-production-super-secret-key') {
      if (validatedConfig.NODE_ENV === 'production') {
        throw new Error('Environment validation failed: JWT_SECRET must not use the default weak development value in production.');
      }
      console.warn('⚠️ WARNING: JWT_SECRET matches the weak example value from .env.example! This is highly insecure.');
    }
    if (jwtSecret.length < 32) {
      throw new Error('Environment validation failed: JWT_SECRET has insufficient entropy. It must be at least 32 characters long.');
    }
  }

  return validatedConfig;
}
