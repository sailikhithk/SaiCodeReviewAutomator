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
exports.AuthManager = void 0;
const vscode = __importStar(require("vscode"));
class AuthManager {
    constructor(storage) {
        this.storage = storage;
        this.tokenKey = 'github.token';
    }
    async authenticate() {
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
    async getToken() {
        const token = await this.storage.getSecret(this.tokenKey);
        if (!token) {
            throw new Error('No GitHub token found. Please authenticate first.');
        }
        return token;
    }
    async isAuthenticated() {
        const token = await this.storage.getSecret(this.tokenKey);
        return !!token;
    }
    async logout() {
        await this.storage.deleteSecret(this.tokenKey);
    }
}
exports.AuthManager = AuthManager;
//# sourceMappingURL=auth.js.map