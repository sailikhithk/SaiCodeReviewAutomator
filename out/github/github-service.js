"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubService = void 0;
const rest_1 = require("@octokit/rest");
class GithubService {
    constructor(authManager) {
        this.authManager = authManager;
        this.octokit = null;
    }
    async getOctokit() {
        if (!this.octokit) {
            const token = await this.authManager.getToken();
            this.octokit = new rest_1.Octokit({ auth: token });
        }
        return this.octokit;
    }
    async getOpenPullRequests(owner, repo) {
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
    async getPullRequestDiff(owner, repo, pullNumber) {
        const octokit = await this.getOctokit();
        const { data } = await octokit.pulls.get({
            owner,
            repo,
            pull_number: pullNumber,
            mediaType: {
                format: 'diff'
            }
        });
        return data;
    }
    async submitReview(owner, repo, pullNumber, comments) {
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
exports.GithubService = GithubService;
//# sourceMappingURL=github-service.js.map