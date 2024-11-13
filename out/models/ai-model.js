"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultAIModelConfig = exports.AIModelType = void 0;
var AIModelType;
(function (AIModelType) {
    AIModelType["GPT4"] = "gpt-4";
    AIModelType["GPT35Turbo"] = "gpt-3.5-turbo";
    AIModelType["GPT4Turbo"] = "gpt-4-turbo-preview";
})(AIModelType || (exports.AIModelType = AIModelType = {}));
exports.defaultAIModelConfig = {
    type: AIModelType.GPT4,
    maxTokens: 2048,
    temperature: 0.3
};
//# sourceMappingURL=ai-model.js.map