"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
class CacheManager {
    constructor(ttlMinutes = 5) {
        this.cache = new Map();
        this.defaultTTL = ttlMinutes * 60 * 1000; // Convert to milliseconds
    }
    set(key, value, ttlMinutes) {
        const ttl = (ttlMinutes || this.defaultTTL) * 60 * 1000;
        this.cache.set(key, {
            data: value,
            timestamp: Date.now() + ttl
        });
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        if (Date.now() > item.timestamp) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }
    clear() {
        this.cache.clear();
    }
    delete(key) {
        this.cache.delete(key);
    }
}
exports.CacheManager = CacheManager;
//# sourceMappingURL=cache.js.map