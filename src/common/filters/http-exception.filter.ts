import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ErrorCode } from '../constants/error-code';
import { BusinessException } from '../exceptions/business.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.INTERNAL;
    let message = 'Internal server error';
    let data: unknown = null;

    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      code = exception.getErrorCode();
      message = exception.message;
    } else if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      code = ErrorCode.TOO_MANY_REQUESTS;
      message = 'Too many requests';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = exception.message;

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const payload = body as Record<string, unknown>;
        if (typeof payload.message === 'string') {
          message = payload.message;
        } else if (Array.isArray(payload.message)) {
          message = 'Validation failed';
          data = payload.message;
          code = ErrorCode.VALIDATION_FAILED;
        }
      }

      if (status === HttpStatus.UNAUTHORIZED) {
        code = ErrorCode.UNAUTHORIZED;
      } else if (status === HttpStatus.FORBIDDEN) {
        code = ErrorCode.FORBIDDEN;
      } else if (status === HttpStatus.NOT_FOUND) {
        code = ErrorCode.NOT_FOUND;
      } else if (
        status === HttpStatus.BAD_REQUEST &&
        code === ErrorCode.INTERNAL
      ) {
        code = ErrorCode.BAD_REQUEST;
      } else if (
        status === HttpStatus.UNPROCESSABLE_ENTITY &&
        code === ErrorCode.INTERNAL
      ) {
        code = ErrorCode.VALIDATION_FAILED;
      }
    } else {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      code,
      message,
      data,
      timestamp: Date.now(),
      path: request.url,
    });
  }
}
