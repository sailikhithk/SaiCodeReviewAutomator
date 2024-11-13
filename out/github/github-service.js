"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubService = void 0;
const rest_1 = require("@octokit/rest");
const cache_1 = require("../utils/cache");
const rate_limiter_1 = require("../utils/rate-limiter");
class GithubService {
    constructor(authManager) {
        this.authManager = authManager;
        this.octokit = null;
        this.cache = new cache_1.CacheManager(5); // 5 minutes TTL
        // GitHub's rate limit is 5000 requests per hour
        this.rateLimiter = new rate_limiter_1.RateLimiter(3600000, 4500); // Leave some buffer
    }
    async getOctokit() {
        if (!this.octokit) {
            const token = await this.authManager.getToken();
            this.octokit = new rest_1.Octokit({
                auth: token,
                throttle: {
                    onRateLimit: (retryAfter) => {
                        console.warn(`Rate limit hit, retrying after ${retryAfter} seconds`);
                        return true;
                    },
                    onSecondaryRateLimit: (retryAfter) => {
                        console.warn(`Secondary rate limit hit, retrying after ${retryAfter} seconds`);
                        return true;
                    },
                }
            });
        }
        return this.octokit;
    }
    async getOpenPullRequests(owner, repo) {
        const cacheKey = `prs:${owner}/${repo}`;
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        await this.rateLimiter.waitForToken();
        const octokit = await this.getOctokit();
        const { data } = await octokit.pulls.list({
            owner,
            repo,
            state: 'open'
        });
        const prs = data.map(pr => ({
            number: pr.number,
            title: pr.title,
            html_url: pr.html_url,
            user: {
                login: pr.user?.login || 'unknown'
            },
            base: {
                repo: {
                    full_name: pr.base.repo.full_name
                }
            }
        }));
        this.cache.set(cacheKey, prs);
        return prs;
    }
    async getPullRequestDiff(owner, repo, pullNumber) {
        const cacheKey = `diff:${owner}/${repo}/${pullNumber}`;
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        await this.rateLimiter.waitForToken();
        const octokit = await this.getOctokit();
        const { data } = await octokit.pulls.get({
            owner,
            repo,
            pull_number: pullNumber,
            mediaType: {
                format: 'diff'
            }
        });
        const diff = data;
        this.cache.set(cacheKey, diff);
        return diff;
    }
    async submitReview(owner, repo, pullNumber, comments) {
        await this.rateLimiter.waitForToken();
        const octokit = await this.getOctokit();
        await octokit.pulls.createReview({
            owner,
            repo,
            pull_number: pullNumber,
            comments: comments.map(comment => ({
                path: comment.path,
                line: comment.line,
                body: comment.body
            })),
            event: 'COMMENT'
        });
        // Invalidate cache for this PR
        this.cache.delete(`diff:${owner}/${repo}/${pullNumber}`);
    }
    getRemainingRequests() {
        return this.rateLimiter.getRemainingRequests();
    }
}
exports.GithubService = GithubService;
//# sourceMappingURL=github-service.js.map