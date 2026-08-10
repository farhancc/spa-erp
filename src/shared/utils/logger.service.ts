import { LoggerService, Injectable } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class JsonLogger implements LoggerService {
  private readonly logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });

  log(message: any, ...optionalParams: any[]) {
    this.logger.info(this.formatMessage(message, optionalParams));
  }

  error(message: any, ...optionalParams: any[]) {
    this.logger.error(this.formatMessage(message, optionalParams));
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(this.formatMessage(message, optionalParams));
  }

  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(this.formatMessage(message, optionalParams));
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.logger.trace(this.formatMessage(message, optionalParams));
  }

  private formatMessage(message: any, optionalParams: any[]) {
    const context = optionalParams.find(p => typeof p === 'string') || 'App';
    const extra = optionalParams.filter(p => typeof p !== 'string');
    
    if (typeof message === 'object') {
      return { ...message, context, extra: extra.length ? extra : undefined };
    }
    return { msg: message, context, extra: extra.length ? extra : undefined };
  }
}
