export interface CacheItem<T> {
    data: T;
    timestamp: number;
}

export class CacheManager {
    private cache: Map<string, CacheItem<any>>;
    private readonly defaultTTL: number;

    constructor(ttlMinutes: number = 5) {
        this.cache = new Map();
        this.defaultTTL = ttlMinutes * 60 * 1000; // Convert to milliseconds
    }

    set<T>(key: string, value: T, ttlMinutes?: number): void {
        const ttl = (ttlMinutes || this.defaultTTL) * 60 * 1000;
        this.cache.set(key, {
            data: value,
            timestamp: Date.now() + ttl
        });
    }

    get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }

        if (Date.now() > item.timestamp) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    clear(): void {
        this.cache.clear();
    }

    delete(key: string): void {
        this.cache.delete(key);
    }
}
