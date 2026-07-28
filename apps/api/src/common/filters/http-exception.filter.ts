import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        code = res.toUpperCase().replace(/\s+/g, '_');
      } else if (typeof res === 'object') {
        const obj = res as any;
        message = Array.isArray(obj.message) ? obj.message.join(', ') : (obj.message || message);
        code = obj.error || obj.code || message.toUpperCase().replace(/\s+/g, '_');
      }
    }

    response.status(status).json({
      error: {
        code,
        message,
        status,
      },
    });
  }
}
