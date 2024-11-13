import { Octokit } from '@octokit/rest';
import { AuthManager } from '../utils/auth';
import { CacheManager } from '../utils/cache';
import { RateLimiter } from '../utils/rate-limiter';

export interface PullRequest {
    number: number;
    title: string;
    html_url: string;
    user: {
        login: string;
    };
    base: {
        repo: {
            full_name: string;
        };
    };
}

export interface ReviewComment {
    path: string;
    line: number;
    body: string;
}

export class GithubService {
    private octokit: Octokit | null = null;
    private cache: CacheManager;
    private rateLimiter: RateLimiter;

    constructor(private authManager: AuthManager) {
        this.cache = new CacheManager(5); // 5 minutes TTL
        // GitHub's rate limit is 5000 requests per hour
        this.rateLimiter = new RateLimiter(3600000, 4500); // Leave some buffer
    }

    private async getOctokit(): Promise<Octokit> {
        if (!this.octokit) {
            const token = await this.authManager.getToken();
            this.octokit = new Octokit({ 
                auth: token,
                throttle: {
                    onRateLimit: (retryAfter: number) => {
                        console.warn(`Rate limit hit, retrying after ${retryAfter} seconds`);
                        return true;
                    },
                    onSecondaryRateLimit: (retryAfter: number) => {
                        console.warn(`Secondary rate limit hit, retrying after ${retryAfter} seconds`);
                        return true;
                    },
                }
            });
        }
        return this.octokit;
    }

    async getOpenPullRequests(owner: string, repo: string): Promise<PullRequest[]> {
        const cacheKey = `prs:${owner}/${repo}`;
        const cachedData = this.cache.get<PullRequest[]>(cacheKey);
        
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

    async getPullRequestDiff(owner: string, repo: string, pullNumber: number): Promise<string> {
        const cacheKey = `diff:${owner}/${repo}/${pullNumber}`;
        const cachedData = this.cache.get<string>(cacheKey);
        
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

        const diff = data as unknown as string;
        this.cache.set(cacheKey, diff);
        return diff;
    }

    async submitReview(
        owner: string,
        repo: string,
        pullNumber: number,
        comments: ReviewComment[]
    ): Promise<void> {
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

    getRemainingRequests(): number {
        return this.rateLimiter.getRemainingRequests();
    }
}
