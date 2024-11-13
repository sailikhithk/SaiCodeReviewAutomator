import * as vscode from 'vscode';
import { ReviewCriteria, defaultReviewCriteria } from '../models/review-criteria';

export class ConfigManager {
    private static readonly CRITERIA_CONFIG_KEY = 'codeReviewAssistant.reviewCriteria';

    static getReviewCriteria(): ReviewCriteria {
        const config = vscode.workspace.getConfiguration();
        const savedCriteria = config.get<ReviewCriteria>(this.CRITERIA_CONFIG_KEY);
        return savedCriteria || defaultReviewCriteria;
    }

    static async updateReviewCriteria(criteria: ReviewCriteria): Promise<void> {
        const config = vscode.workspace.getConfiguration();
        await config.update(this.CRITERIA_CONFIG_KEY, criteria, vscode.ConfigurationTarget.Global);
    }

    static getEnabledRules(): string[] {
        const criteria = this.getReviewCriteria();
        const enabledRules: string[] = [];

        criteria.categories.forEach(category => {
            if (category.enabled) {
                category.rules
                    .filter(rule => rule.enabled)
                    .forEach(rule => enabledRules.push(rule.id));
            }
        });

        return enabledRules;
    }
}
