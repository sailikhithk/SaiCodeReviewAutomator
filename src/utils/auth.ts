import * as vscode from 'vscode';
import { StorageManager } from './storage';

export class AuthManager {
    private readonly tokenKey = 'github.token';

    constructor(private storage: StorageManager) {}

    async authenticate(): Promise<void> {
        const token = await vscode.window.showInputBox({
            prompt: 'Enter your GitHub Personal Access Token',
            password: true,
            validateInput: (value) => {
                return value && value.length > 0 ? null : 'Token is required';
            }
        });

        if (!token) {
            throw new Error('Authentication cancelled');
        }

        await this.storage.storeSecret(this.tokenKey, token);
    }

    async getToken(): Promise<string> {
        const token = await this.storage.getSecret(this.tokenKey);
        if (!token) {
            throw new Error('No GitHub token found. Please authenticate first.');
        }
        return token;
    }

    async isAuthenticated(): Promise<boolean> {
        const token = await this.storage.getSecret(this.tokenKey);
        return !!token;
    }

    async logout(): Promise<void> {
        await this.storage.deleteSecret(this.tokenKey);
    }
}
