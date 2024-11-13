"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRListView = void 0;
const vscode = __importStar(require("vscode"));
class PRListView {
    constructor(githubService, codeAnalyzer) {
        this.githubService = githubService;
        this.codeAnalyzer = codeAnalyzer;
    }
    async show() {
        this.panel = vscode.window.createWebviewPanel('prList', 'Pull Requests', vscode.ViewColumn.One, {
            enableScripts: true
        });
        this.panel.webview.html = await this.getWebviewContent();
        this.setupMessageHandling();
    }
    async getWebviewContent() {
        // Read the content from the HTML file
        const htmlContent = await vscode.workspace.fs.readFile(vscode.Uri.file('src/views/webview/pr-list.html'));
        return htmlContent.toString();
    }
    setupMessageHandling() {
        if (!this.panel) {
            return;
        }
        this.panel.webview.onDidReceiveMessage(async (message) => {
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
                }
            }
            catch (error) {
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
    async handleLoadPullRequests(repoFullName) {
        const [owner, repo] = repoFullName.split('/');
        const pullRequests = await this.githubService.getOpenPullRequests(owner, repo);
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'pullRequestsLoaded',
                pullRequests
            });
        }
    }
    async handleSingleReview(message) {
        const [owner, repo] = message.repo.split('/');
        const diff = await this.githubService.getPullRequestDiff(owner, repo, message.prNumber);
        const comments = await this.codeAnalyzer.analyzeDiff(diff);
        const shouldSubmit = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Submit review comments?'
        });
        if (shouldSubmit === 'Yes') {
            await this.githubService.submitReview(owner, repo, message.prNumber, comments);
            vscode.window.showInformationMessage('Review submitted successfully!');
        }
    }
    async handleBatchReview(pullRequests) {
        const progress = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Processing Pull Requests',
            cancellable: true
        }, async (progress, token) => {
            const total = pullRequests.length;
            let completed = 0;
            // Process PRs concurrently but with a limit
            const batchSize = 3; // Process 3 PRs at a time
            for (let i = 0; i < pullRequests.length; i += batchSize) {
                if (token.isCancellationRequested) {
                    break;
                }
                const batch = pullRequests.slice(i, i + batchSize);
                const promises = batch.map(async (pr) => {
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
                    }
                    catch (error) {
                        return {
                            success: false,
                            prNumber: pr.number,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        };
                    }
                });
                const results = await Promise.all(promises);
                // Report results for this batch
                results.forEach(result => {
                    if (result.success) {
                        vscode.window.showInformationMessage(`Successfully reviewed PR #${result.prNumber}`);
                    }
                    else {
                        vscode.window.showErrorMessage(`Failed to review PR #${result.prNumber}: ${result.error}`);
                    }
                });
            }
            return completed;
        });
        if (progress > 0) {
            vscode.window.showInformationMessage(`Completed batch review of ${progress} pull requests`);
        }
    }
}
exports.PRListView = PRListView;
//# sourceMappingURL=pr-list-view.js.map