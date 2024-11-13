"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalyzer = void 0;
const openai_1 = __importDefault(require("openai"));
const config_manager_1 = require("../utils/config-manager");
class CodeAnalyzer {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    async analyzeDiff(diff) {
        try {
            const enabledRules = config_manager_1.ConfigManager.getEnabledRules();
            const criteria = config_manager_1.ConfigManager.getReviewCriteria();
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: this.generateSystemPrompt(criteria)
                    },
                    {
                        role: "user",
                        content: `Please analyze this diff and provide review comments focusing on the following rules: ${enabledRules.join(', ')}. Return comments in JSON format with the following structure: {"comments": [{"path": string, "line": number, "body": string, "rule_id": string}]}\n\n${diff}`
                    }
                ],
                response_format: { type: "json_object" }
            });
            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('No content in OpenAI response');
            }
            const result = JSON.parse(content);
            return this.parseAnalysisResponse(result);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to analyze code: ${errorMessage}`);
        }
    }
    generateSystemPrompt(criteria) {
        return `You are a code review expert. Your task is to analyze code diffs and provide specific, actionable review comments based on the following criteria:

${criteria.categories.map((category) => `
${category.name}:
${category.rules.map((rule) => `- ${rule.name}: ${rule.description}`).join('\n')}`).join('\n')}

For each issue you find, provide:
1. The specific file path
2. The line number where the issue occurs
3. A clear, actionable comment explaining the issue and how to fix it
4. The rule ID that this issue relates to`;
    }
    parseAnalysisResponse(response) {
        const comments = [];
        for (const comment of response.comments || []) {
            if (comment.path && comment.line && comment.body) {
                comments.push({
                    path: comment.path,
                    line: comment.line,
                    body: `[${comment.rule_id || 'general'}] ${comment.body}`
                });
            }
        }
        return comments;
    }
}
exports.CodeAnalyzer = CodeAnalyzer;
//# sourceMappingURL=code-analyzer.js.map