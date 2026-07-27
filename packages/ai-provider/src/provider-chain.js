"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderChain = exports.AllProvidersFailedError = void 0;
class AllProvidersFailedError extends Error {
    lastError;
    constructor(lastError) {
        super('All configured AI providers failed.');
        this.lastError = lastError;
        this.name = 'AllProvidersFailedError';
    }
}
exports.AllProvidersFailedError = AllProvidersFailedError;
class ProviderChain {
    providers;
    name = 'chain';
    supportsStructuredOutput = true;
    constructor(providers) {
        this.providers = providers;
    }
    async generateText(input) {
        let lastError;
        for (const provider of this.providers) {
            try {
                return await provider.generateText(input);
            }
            catch (err) {
                lastError = err;
                console.warn(`[AIProviderChain] Provider ${provider.name} failed, trying next fallback...`, err);
            }
        }
        throw new AllProvidersFailedError(lastError);
    }
    async generateEmbedding(input) {
        let lastError;
        for (const provider of this.providers) {
            try {
                return await provider.generateEmbedding(input);
            }
            catch (err) {
                lastError = err;
                console.warn(`[AIProviderChain] Embedding provider ${provider.name} failed...`, err);
            }
        }
        throw new AllProvidersFailedError(lastError);
    }
}
exports.ProviderChain = ProviderChain;
