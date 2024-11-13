import * as vscode from 'vscode';
import { GithubService, PullRequest } from '../github/github-service';
import { CodeAnalyzer } from '../ai/code-analyzer';

export class PRListView {
    private panel: vscode.WebviewPanel | undefined;

    constructor(
        private githubService: GithubService,
        private codeAnalyzer: CodeAnalyzer
    ) {}

    async show() {
        this.panel = vscode.window.createWebviewPanel(
            'prList',
            'Pull Requests',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        this.panel.webview.html = await this.getWebviewContent();
        this.setupMessageHandling();
    }

    private async getWebviewContent(): Promise<string> {
        const htmlContent = await vscode.workspace.fs.readFile(
            vscode.Uri.file('src/views/webview/pr-list.html')
        );
        return htmlContent.toString();
    }

    private setupMessageHandling() {
        if (!this.panel) {
            return;
        }

        this.panel.webview.onDidReceiveMessage(async message => {
            try {
                switch (message.command) {
                    case 'loadPullRequests':
                        await this.handleLoadPullRequests(message.repo);
                        break;
                    case 'startReview':
                        await this.handleSingleReview(message);
                        break;
                    case 'batchReview':
                        await this.handleBatchReview(message.pullRequests);
                        break;
                    case 'getRateLimits':
                        this.handleGetRateLimits();
                        break;
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                if (this.panel) {
                    this.panel.webview.postMessage({
                        command: 'error',
                        error: errorMessage
                    });
                }
            }
        });
    }

    private handleGetRateLimits() {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'rateLimits',
                limits: {
                    github: this.githubService.getRemainingRequests(),
                    openai: this.codeAnalyzer.getRemainingRequests()
                }
            });
        }
    }

    private async handleLoadPullRequests(repoFullName: string) {
        const [owner, repo] = repoFullName.split('/');
        const pullRequests = await this.githubService.getOpenPullRequests(owner, repo);
        
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'pullRequestsLoaded',
                pullRequests
            });
            // Update rate limits after loading PRs
            this.handleGetRateLimits();
        }
    }

    private async handleSingleReview(message: { repo: string; prNumber: number }) {
        const [owner, repo] = message.repo.split('/');
        const diff = await this.githubService.getPullRequestDiff(
            owner,
            repo,
            message.prNumber
        );
        
        const comments = await this.codeAnalyzer.analyzeDiff(diff);
        
        const shouldSubmit = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Submit review comments?'
        });

        if (shouldSubmit === 'Yes') {
            await this.githubService.submitReview(
                owner,
                repo,
                message.prNumber,
                comments
            );
            vscode.window.showInformationMessage('Review submitted successfully!');
        }

        // Update rate limits after review
        this.handleGetRateLimits();
    }

    private async handleBatchReview(pullRequests: Array<{ repo: string; number: number }>) {
        const progress = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Processing Pull Requests',
                cancellable: true
            },
            async (progress, token) => {
                const total = pullRequests.length;
                let completed = 0;
                
                const batchSize = 3;
                for (let i = 0; i < pullRequests.length; i += batchSize) {
                    if (token.isCancellationRequested) {
                        break;
                    }

                    const batch = pullRequests.slice(i, i + batchSize);
                    const promises = batch.map(async pr => {
                        const [owner, repo] = pr.repo.split('/');
                        
                        try {
                            const diff = await this.githubService.getPullRequestDiff(owner, repo, pr.number);
                            const comments = await this.codeAnalyzer.analyzeDiff(diff);
                            
                            await this.githubService.submitReview(owner, repo, pr.number, comments);
                            
                            completed++;
                            progress.report({
                                message: `Completed ${completed}/${total} pull requests`,
                                increment: (100 / total)
                            });

                            return { success: true, prNumber: pr.number };
                        } catch (error) {
                            return { 
                                success: false, 
                                prNumber: pr.number, 
                                error: error instanceof Error ? error.message : 'Unknown error' 
                            };
                        }
                    });

                    const results = await Promise.all(promises);
                    
                    results.forEach(result => {
                        if (result.success) {
                            vscode.window.showInformationMessage(`Successfully reviewed PR #${result.prNumber}`);
                        } else {
                            vscode.window.showErrorMessage(`Failed to review PR #${result.prNumber}: ${result.error}`);
                        }
                    });

                    // Update rate limits after each batch
                    this.handleGetRateLimits();
                }

                return completed;
            }
        );

        if (progress > 0) {
            vscode.window.showInformationMessage(`Completed batch review of ${progress} pull requests`);
        }
    }
}
