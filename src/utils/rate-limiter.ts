export class RateLimiter {
    private timestamps: number[];
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(windowMs: number, maxRequests: number) {
        this.timestamps = [];
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    async waitForToken(): Promise<void> {
        const now = Date.now();
        this.timestamps = this.timestamps.filter(time => time > now - this.windowMs);

        if (this.timestamps.length >= this.maxRequests) {
            const oldestTimestamp = this.timestamps[0];
            const waitTime = oldestTimestamp + this.windowMs - now;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.timestamps.push(now);
    }

    getRemainingRequests(): number {
        const now = Date.now();
        this.timestamps = this.timestamps.filter(time => time > now - this.windowMs);
        return this.maxRequests - this.timestamps.length;
    }
}
