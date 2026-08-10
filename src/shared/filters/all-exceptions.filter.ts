import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody = exception.getResponse();
      if (typeof resBody === 'string') {
        message = resBody;
      } else if (typeof resBody === 'object' && resBody !== null) {
        message = (resBody as any).message || (resBody as any).error || message;
        details = (resBody as any).message || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // Log stack trace for non-HTTP exceptions
      this.logger.error(`Exception occurred: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown exception occurred: ${JSON.stringify(exception)}`);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(details) ? details[0] : message,
      ...(process.env.NODE_ENV !== 'production' && { stack: exception.stack }),
    });
  }
}
