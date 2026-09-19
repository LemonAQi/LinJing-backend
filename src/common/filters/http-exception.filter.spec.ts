import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-code';
import { BusinessException } from '../exceptions/business.exception';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  const createHost = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status };
    const request = { method: 'POST', url: '/api/v1/auth/login' };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as ArgumentsHost;

    return { host, status, json };
  };

  it('maps business exceptions to the unified envelope', () => {
    const { host, status, json } = createHost();
    filter.catch(
      new BusinessException(ErrorCode.USER_EXISTS, 'Username already exists'),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ErrorCode.USER_EXISTS,
        message: 'Username already exists',
        path: '/api/v1/auth/login',
      }),
    );
  });

  it('maps validation arrays to VALIDATION_FAILED', () => {
    const { host, json } = createHost();
    filter.catch(
      new HttpException(
        { message: ['username must be a string'] },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Validation failed',
        data: ['username must be a string'],
      }),
    );
  });
});
