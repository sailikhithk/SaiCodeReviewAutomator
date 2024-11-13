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
        const repoInput = await vscode.window.showInputBox({
            prompt: 'Enter repository (format: owner/repo)',
            placeHolder: 'e.g., microsoft/vscode'
        });

        if (!repoInput) {
            throw new Error('Repository information is required');
        }

        const [owner, repo] = repoInput.split('/');
        const pullRequests = await this.githubService.getOpenPullRequests(owner, repo);

        return this.generateHtml(pullRequests);
    }

    private generateHtml(pullRequests: PullRequest[]): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { padding: 20px; }
                    .pr-item {
                        padding: 10px;
                        margin-bottom: 10px;
                        border: 1px solid #ccc;
                        cursor: pointer;
                    }
                    .pr-item:hover {
                        background-color: #f0f0f0;
                    }
                </style>
            </head>
            <body>
                <h2>Open Pull Requests</h2>
                ${pullRequests.map(pr => `
                    <div class="pr-item" data-pr-number="${pr.number}" data-repo="${pr.base.repo.full_name}">
                        <h3>#${pr.number}: ${pr.title}</h3>
                        <p>Author: ${pr.user.login}</p>
                        <button onclick="startReview(${pr.number}, '${pr.base.repo.full_name}')">
                            Review
                        </button>
                    </div>
                `).join('')}
                <script>
                    const vscode = acquireVsCodeApi();
                    function startReview(prNumber, repoFullName) {
                        vscode.postMessage({
                            command: 'startReview',
                            prNumber: prNumber,
                            repo: repoFullName
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }

    private setupMessageHandling() {
        if (!this.panel) {
            return;
        }

        this.panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'startReview') {
                try {
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
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    vscode.window.showErrorMessage(`Failed to process review: ${errorMessage}`);
                }
            }
        });
    }
}
