"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
class GeminiProvider {
    apiKey;
    name = 'gemini';
    supportsStructuredOutput = true;
    constructor(apiKey = process.env.GEMINI_API_KEY || '') {
        this.apiKey = apiKey;
    }
    async generateText(input) {
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY is not defined');
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
        // Map message roles (assistant -> model)
        const contents = input.messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));
        const body = {
            contents,
        };
        if (input.systemPrompt) {
            body.systemInstruction = {
                parts: [{ text: input.systemPrompt }],
            };
        }
        if (input.responseFormat === 'json') {
            body.generationConfig = {
                responseMimeType: 'application/json',
            };
        }
        if (input.maxTokens) {
            body.generationConfig = {
                ...body.generationConfig,
                maxOutputTokens: input.maxTokens,
            };
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API call failed: ${response.status} - ${errorText}`);
        }
        const data = (await response.json());
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('Empty response from Gemini API');
        }
        return {
            text,
            provider: 'gemini',
            usage: {
                promptTokens: data.usageMetadata?.promptTokenCount,
                completionTokens: data.usageMetadata?.candidatesTokenCount,
            },
        };
    }
    async generateEmbedding(input) {
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY is not defined');
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`;
        const texts = Array.isArray(input.text) ? input.text : [input.text];
        const embeddings = [];
        for (const text of texts) {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: {
                        parts: [{ text }],
                    },
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini Embedding API failed: ${response.status} - ${errorText}`);
            }
            const data = (await response.json());
            const values = data.embedding?.values;
            if (!values) {
                throw new Error('Empty embedding from Gemini API');
            }
            embeddings.push(values);
        }
        return {
            embeddings,
            provider: 'gemini',
        };
    }
}
exports.GeminiProvider = GeminiProvider;
