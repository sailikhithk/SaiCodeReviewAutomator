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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const github_service_1 = require("./github/github-service");
const code_analyzer_1 = require("./ai/code-analyzer");
const pr_list_view_1 = require("./views/pr-list-view");
const auth_1 = require("./utils/auth");
const storage_1 = require("./utils/storage");
async function activate(context) {
    const storageManager = new storage_1.StorageManager(context);
    const authManager = new auth_1.AuthManager(storageManager);
    const githubService = new github_service_1.GithubService(authManager);
    const codeAnalyzer = new code_analyzer_1.CodeAnalyzer();
    const prListView = new pr_list_view_1.PRListView(githubService, codeAnalyzer);
    let startReview = vscode.commands.registerCommand('code-review-assistant.startReview', async () => {
        try {
            if (!await authManager.isAuthenticated()) {
                const choice = await vscode.window.showInformationMessage('You need to authenticate with GitHub first.', 'Authenticate');
                if (choice === 'Authenticate') {
                    await authenticate();
                }
                return;
            }
            await prListView.show();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to start review: ${errorMessage}`);
        }
    });
    let authenticate = async () => {
        try {
            await authManager.authenticate();
            vscode.window.showInformationMessage('Successfully authenticated with GitHub!');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Authentication failed: ${errorMessage}`);
        }
    };
    let authCommand = vscode.commands.registerCommand('code-review-assistant.authenticate', authenticate);
    context.subscriptions.push(startReview, authCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map