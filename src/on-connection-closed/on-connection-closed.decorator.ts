import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

export const OnConnectionClosed = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) =>
        new Observable((observer) => {
            const request = ctx.switchToHttp().getRequest<Request>();

            request.socket.on('close', () => observer.complete());
        }),
);