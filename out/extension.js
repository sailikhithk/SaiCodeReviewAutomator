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
const config_manager_1 = require("./utils/config-manager");
const ai_model_1 = require("./models/ai-model");
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
    let configureReviewCriteria = vscode.commands.registerCommand('code-review-assistant.configureReviewCriteria', async () => {
        try {
            const currentCriteria = config_manager_1.ConfigManager.getReviewCriteria();
            for (const category of currentCriteria.categories) {
                const categoryEnabled = await vscode.window.showQuickPick(['Enable', 'Disable'], {
                    placeHolder: `${category.name} category`
                });
                if (categoryEnabled) {
                    category.enabled = categoryEnabled === 'Enable';
                    if (category.enabled) {
                        for (const rule of category.rules) {
                            const ruleEnabled = await vscode.window.showQuickPick(['Enable', 'Disable'], {
                                placeHolder: `${rule.name}: ${rule.description}`
                            });
                            if (ruleEnabled) {
                                rule.enabled = ruleEnabled === 'Enable';
                            }
                        }
                    }
                }
            }
            await config_manager_1.ConfigManager.updateReviewCriteria(currentCriteria);
            vscode.window.showInformationMessage('Review criteria updated successfully!');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to update review criteria: ${errorMessage}`);
        }
    });
    let configureAIModel = vscode.commands.registerCommand('code-review-assistant.configureAIModel', async () => {
        try {
            const modelType = await vscode.window.showQuickPick(Object.values(ai_model_1.AIModelType), {
                placeHolder: 'Select AI Model'
            });
            if (!modelType) {
                return;
            }
            const maxTokensInput = await vscode.window.showInputBox({
                prompt: 'Enter max tokens (1024-4096)',
                value: '2048',
                validateInput: (value) => {
                    const num = parseInt(value);
                    return (num >= 1024 && num <= 4096) ? null : 'Please enter a number between 1024 and 4096';
                }
            });
            if (!maxTokensInput) {
                return;
            }
            const temperatureInput = await vscode.window.showInputBox({
                prompt: 'Enter temperature (0.0-1.0)',
                value: '0.3',
                validateInput: (value) => {
                    const num = parseFloat(value);
                    return (num >= 0 && num <= 1) ? null : 'Please enter a number between 0 and 1';
                }
            });
            if (!temperatureInput) {
                return;
            }
            const config = {
                type: modelType,
                maxTokens: parseInt(maxTokensInput),
                temperature: parseFloat(temperatureInput)
            };
            await codeAnalyzer.updateAIModel(config);
            vscode.window.showInformationMessage('AI model configuration updated successfully!');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to update AI model configuration: ${errorMessage}`);
        }
    });
    let authCommand = vscode.commands.registerCommand('code-review-assistant.authenticate', authenticate);
    context.subscriptions.push(startReview, authCommand, configureReviewCriteria, configureAIModel);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map