import * as vscode from 'vscode';

export class StorageManager {
    constructor(private context: vscode.ExtensionContext) {}

    async storeSecret(key: string, value: string): Promise<void> {
        await this.context.secrets.store(key, value);
    }

    async getSecret(key: string): Promise<string | undefined> {
        return await this.context.secrets.get(key);
    }

    async deleteSecret(key: string): Promise<void> {
        await this.context.secrets.delete(key);
    }
}
