"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalyzer = void 0;
const openai_1 = __importDefault(require("openai"));
class CodeAnalyzer {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    async analyzeDiff(diff) {
        try {
            const response = await this.openai.chat.completions.create({
                // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are a code review expert. Analyze the following code diff and provide specific, actionable review comments. Focus on code quality, potential bugs, and performance issues."
                    },
                    {
                        role: "user",
                        content: `Please analyze this diff and provide review comments in JSON format with the following structure: {"comments": [{"path": string, "line": number, "body": string}]}\n\n${diff}`
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
    parseAnalysisResponse(response) {
        const comments = [];
        for (const comment of response.comments || []) {
            if (comment.path && comment.line && comment.body) {
                comments.push({
                    path: comment.path,
                    line: comment.line,
                    body: comment.body
                });
            }
        }
        return comments;
    }
}
exports.CodeAnalyzer = CodeAnalyzer;
//# sourceMappingURL=code-analyzer.js.map