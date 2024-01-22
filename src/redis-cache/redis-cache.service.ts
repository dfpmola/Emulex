import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RedisCacheService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    async storeValue(value: string) {
        await this.cacheManager.set('emuleId', value, 100000000000);
    }
    async retriveValue() {
        const value = await this.cacheManager.get('emuleId');
        return value;
    }
}
