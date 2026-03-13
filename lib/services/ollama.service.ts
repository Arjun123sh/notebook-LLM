import { Ollama } from 'ollama';
import { CONFIG } from '../config';
import { PROMPTS } from '../prompts';

class AiService {
    private ollama: Ollama;

    constructor() {
        this.ollama = new Ollama({
            host: CONFIG.OLLAMA.HOST,
        });
    }

    private async callCloudApi(messages: any[], model?: string) {
        const { PROVIDER, GROQ_API_KEY, OPENAI_API_KEY } = CONFIG.CLOUD;

        const url = PROVIDER === 'groq'
            ? 'https://api.groq.com/openai/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';

        const key = PROVIDER === 'groq' ? GROQ_API_KEY : OPENAI_API_KEY;
        const cloudModel = PROVIDER === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        if (!key) {
            throw new Error(`Cloud provider ${PROVIDER} selected but no API key provided.`);
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model || cloudModel,
                messages,
                stream: false,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Cloud AI Error: ${err.error?.message || res.statusText}`);
        }

        const data = await res.json();
        return data.choices[0].message.content;
    }

    async generateEmbedding(input: string): Promise<number[]> {
        try {
            const res = await this.ollama.embed({
                model: CONFIG.OLLAMA.EMBEDDING_MODEL,
                input,
            });
            return res.embeddings?.[0] ?? (res as any).embedding ?? [];
        } catch (error: any) {
            if (CONFIG.CLOUD.IS_PROD) {
                console.warn('Ollama embedding failed in PROD. Ensure OLLAMA_HOST is reachable.');
            }
            console.error('Embedding error:', error);
            throw error;
        }
    }

    async chat(prompt: string, context?: string, model?: string) {
        const systemInstruction = PROMPTS['research-assistant'](context || '');
        const messages = [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
        ];

        const useCloud = CONFIG.CLOUD.PROVIDER !== 'ollama' && (CONFIG.CLOUD.IS_PROD || CONFIG.CLOUD.GROQ_API_KEY || CONFIG.CLOUD.OPENAI_API_KEY);

        if (useCloud) {
            try {
                return await this.callCloudApi(messages, model);
            } catch (e) {
                console.error('Cloud chat failed, falling back to Ollama:', e);
            }
        }

        const response = await this.ollama.chat({
            model: model || CONFIG.OLLAMA.CHAT_MODEL,
            messages,
            stream: false,
        });
        return response.message.content;
    }

    async generateWithPrompt(prompt: string, model?: string) {
        const messages = [{ role: 'user', content: prompt }];

        const useCloud = CONFIG.CLOUD.PROVIDER !== 'ollama' && (CONFIG.CLOUD.IS_PROD || CONFIG.CLOUD.GROQ_API_KEY || CONFIG.CLOUD.OPENAI_API_KEY);

        if (useCloud) {
            try {
                return await this.callCloudApi(messages, model);
            } catch (e) {
                console.error('Cloud generation failed, falling back to Ollama:', e);
            }
        }

        const response = await this.ollama.chat({
            model: model || CONFIG.OLLAMA.CHAT_MODEL,
            messages,
            stream: false,
        });
        return response.message.content;
    }

    async generateWithWebContext(prompt: string, webContext: string, model?: string): Promise<string> {
        const fullPrompt = `Below is some real-time information found from the web to supplement your knowledge:\n\n${webContext}\n\nBased on this and the previous context, please answer the following:\n\n${prompt}`;
        return this.generateWithPrompt(fullPrompt, model);
    }
}

export const ollamaService = new AiService();
