import OpenAI from 'openai';
import { ReviewComment } from '../github/github-service';
import { ConfigManager } from '../utils/config-manager';
import { ReviewCriteria, ReviewCategory, ReviewRule } from '../models/review-criteria';
import { AIModelConfig } from '../models/ai-model';
import { RateLimiter } from '../utils/rate-limiter';

export class CodeAnalyzer {
    private openai: OpenAI;
    private aiConfig: AIModelConfig;
    private rateLimiter: RateLimiter;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.aiConfig = ConfigManager.getAIModelConfig();
        // OpenAI's rate limits vary by model, using a conservative limit
        this.rateLimiter = new RateLimiter(60000, 50); // 50 requests per minute
    }

    async analyzeDiff(diff: string): Promise<ReviewComment[]> {
        try {
            const enabledRules = ConfigManager.getEnabledRules();
            const criteria = ConfigManager.getReviewCriteria();
            
            await this.rateLimiter.waitForToken();
            
            const response = await this.openai.chat.completions.create({
                model: this.aiConfig.type,
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
                max_tokens: this.aiConfig.maxTokens,
                temperature: this.aiConfig.temperature,
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('No content in OpenAI response');
            }

            const result = JSON.parse(content);
            return this.parseAnalysisResponse(result);
        } catch (error) {
            if (error instanceof Error && error.message.includes('rate limit')) {
                // Wait and retry once if we hit rate limit
                await new Promise(resolve => setTimeout(resolve, 20000));
                return this.analyzeDiff(diff);
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to analyze code: ${errorMessage}`);
        }
    }

    private generateSystemPrompt(criteria: ReviewCriteria): string {
        return `You are a code review expert. Your task is to analyze code diffs and provide specific, actionable review comments based on the following criteria:

${criteria.categories.map((category: ReviewCategory) => `
${category.name}:
${category.rules.map((rule: ReviewRule) => `- ${rule.name}: ${rule.description}`).join('\n')}`).join('\n')}

For each issue you find, provide:
1. The specific file path
2. The line number where the issue occurs
3. A clear, actionable comment explaining the issue and how to fix it
4. The rule ID that this issue relates to`;
    }

    private parseAnalysisResponse(response: any): ReviewComment[] {
        const comments: ReviewComment[] = [];
        
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

    async updateAIModel(config: AIModelConfig): Promise<void> {
        this.aiConfig = config;
        await ConfigManager.updateAIModelConfig(config);
    }

    getRemainingRequests(): number {
        return this.rateLimiter.getRemainingRequests();
    }
}
