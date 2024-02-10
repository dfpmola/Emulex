import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RedisCacheService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    async storeValue(id: string, value) {
        await this.cacheManager.set(id, value, 100000000);
    }
    async retriveValue(id: string) {
        const value = await this.cacheManager.get(id) ?? '0000';
        return value;
    }
    async cleanValue(id: string) {
        await this.cacheManager.del(id);
    }
}
