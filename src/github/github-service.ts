import { Octokit } from '@octokit/rest';
import { AuthManager } from '../utils/auth';

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

    constructor(private authManager: AuthManager) {}

    private async getOctokit(): Promise<Octokit> {
        if (!this.octokit) {
            const token = await this.authManager.getToken();
            this.octokit = new Octokit({ auth: token });
        }
        return this.octokit;
    }

    async getOpenPullRequests(owner: string, repo: string): Promise<PullRequest[]> {
        const octokit = await this.getOctokit();
        const { data } = await octokit.pulls.list({
            owner,
            repo,
            state: 'open'
        });

        return data.map(pr => ({
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
    }

    async getPullRequestDiff(owner: string, repo: string, pullNumber: number): Promise<string> {
        const octokit = await this.getOctokit();
        const { data } = await octokit.pulls.get({
            owner,
            repo,
            pull_number: pullNumber,
            mediaType: {
                format: 'diff'
            }
        });
        return data as unknown as string;
    }

    async submitReview(
        owner: string,
        repo: string,
        pullNumber: number,
        comments: ReviewComment[]
    ): Promise<void> {
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
    }
}
