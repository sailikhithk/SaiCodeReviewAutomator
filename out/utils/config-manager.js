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
exports.ConfigManager = void 0;
const vscode = __importStar(require("vscode"));
const review_criteria_1 = require("../models/review-criteria");
class ConfigManager {
    static getReviewCriteria() {
        const config = vscode.workspace.getConfiguration();
        const savedCriteria = config.get(this.CRITERIA_CONFIG_KEY);
        return savedCriteria || review_criteria_1.defaultReviewCriteria;
    }
    static async updateReviewCriteria(criteria) {
        const config = vscode.workspace.getConfiguration();
        await config.update(this.CRITERIA_CONFIG_KEY, criteria, vscode.ConfigurationTarget.Global);
    }
    static getEnabledRules() {
        const criteria = this.getReviewCriteria();
        const enabledRules = [];
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
exports.ConfigManager = ConfigManager;
ConfigManager.CRITERIA_CONFIG_KEY = 'codeReviewAssistant.reviewCriteria';
//# sourceMappingURL=config-manager.js.map