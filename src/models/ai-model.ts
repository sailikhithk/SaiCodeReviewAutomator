export enum AIModelType {
    GPT4 = 'gpt-4',
    GPT35Turbo = 'gpt-3.5-turbo',
    GPT4Turbo = 'gpt-4-turbo-preview'
}

export interface AIModelConfig {
    type: AIModelType;
    maxTokens?: number;
    temperature?: number;
}

export const defaultAIModelConfig: AIModelConfig = {
    type: AIModelType.GPT4,
    maxTokens: 2048,
    temperature: 0.3
};
