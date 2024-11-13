"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    constructor(windowMs, maxRequests) {
        this.timestamps = [];
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }
    async waitForToken() {
        const now = Date.now();
        this.timestamps = this.timestamps.filter(time => time > now - this.windowMs);
        if (this.timestamps.length >= this.maxRequests) {
            const oldestTimestamp = this.timestamps[0];
            const waitTime = oldestTimestamp + this.windowMs - now;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.timestamps.push(now);
    }
    getRemainingRequests() {
        const now = Date.now();
        this.timestamps = this.timestamps.filter(time => time > now - this.windowMs);
        return this.maxRequests - this.timestamps.length;
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map