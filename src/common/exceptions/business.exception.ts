import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-code';

export class BusinessException extends HttpException {
  constructor(
    private readonly errorCode: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, status);
  }

  getErrorCode(): ErrorCode {
    return this.errorCode;
  }
}
