import * as vscode from 'vscode';
import { GithubService } from './github/github-service';
import { CodeAnalyzer } from './ai/code-analyzer';
import { PRListView } from './views/pr-list-view';
import { AuthManager } from './utils/auth';
import { StorageManager } from './utils/storage';
import { ConfigManager } from './utils/config-manager';
import { defaultReviewCriteria } from './models/review-criteria';
import { AIModelType, AIModelConfig } from './models/ai-model';

export async function activate(context: vscode.ExtensionContext) {
    const storageManager = new StorageManager(context);
    const authManager = new AuthManager(storageManager);
    const githubService = new GithubService(authManager);
    const codeAnalyzer = new CodeAnalyzer();
    const prListView = new PRListView(githubService, codeAnalyzer);

    let startReview = vscode.commands.registerCommand('code-review-assistant.startReview', async () => {
        try {
            if (!await authManager.isAuthenticated()) {
                const choice = await vscode.window.showInformationMessage(
                    'You need to authenticate with GitHub first.',
                    'Authenticate'
                );
                if (choice === 'Authenticate') {
                    await authenticate();
                }
                return;
            }
            await prListView.show();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to start review: ${errorMessage}`);
        }
    });

    let authenticate = async () => {
        try {
            await authManager.authenticate();
            vscode.window.showInformationMessage('Successfully authenticated with GitHub!');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Authentication failed: ${errorMessage}`);
        }
    };

    let configureReviewCriteria = vscode.commands.registerCommand('code-review-assistant.configureReviewCriteria', async () => {
        try {
            const currentCriteria = ConfigManager.getReviewCriteria();
            
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
            
            await ConfigManager.updateReviewCriteria(currentCriteria);
            vscode.window.showInformationMessage('Review criteria updated successfully!');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to update review criteria: ${errorMessage}`);
        }
    });

    let configureAIModel = vscode.commands.registerCommand('code-review-assistant.configureAIModel', async () => {
        try {
            const modelType = await vscode.window.showQuickPick(Object.values(AIModelType), {
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

            const config: AIModelConfig = {
                type: modelType as AIModelType,
                maxTokens: parseInt(maxTokensInput),
                temperature: parseFloat(temperatureInput)
            };

            await codeAnalyzer.updateAIModel(config);
            vscode.window.showInformationMessage('AI model configuration updated successfully!');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to update AI model configuration: ${errorMessage}`);
        }
    });

    let authCommand = vscode.commands.registerCommand('code-review-assistant.authenticate', authenticate);

    context.subscriptions.push(startReview, authCommand, configureReviewCriteria, configureAIModel);
}

export function deactivate() {}
