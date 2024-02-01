import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class CheckApiGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-api-key'] ?? req.query.api_key; // checks the header, moves to query if null
    return this.isKeyValid(key);
  }

  isKeyValid(key): boolean {
    return key === "vqyy5GPVfjrzlBZiOv18iGWKdfDOyD83" ? true : false;
  }
}