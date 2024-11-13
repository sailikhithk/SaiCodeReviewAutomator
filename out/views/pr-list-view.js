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
    generateHtml(pullRequests) {
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
    setupMessageHandling() {
        if (!this.panel) {
            return;
        }
        this.panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'startReview') {
                try {
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
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    vscode.window.showErrorMessage(`Failed to process review: ${errorMessage}`);
                }
            }
        });
    }
}
exports.PRListView = PRListView;
//# sourceMappingURL=pr-list-view.js.map