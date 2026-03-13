import { getAppUrl } from './utils/url';

export const CONFIG = {
    BASE_URL: getAppUrl(),
    SUPABASE: {
        URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    },
    CLOUD: {
        PROVIDER: (process.env.AI_PROVIDER || 'groq') as 'groq' | 'openai' | 'ollama',
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        IS_PROD: process.env.NODE_ENV === 'production',
    },
    OLLAMA: {
        HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
        CHAT_MODEL: process.env.OLLAMA_CHAT_MODEL || 'llama3.2',
        EMBEDDING_MODEL: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
        SUPPORTED_MODELS: [
            { id: 'llama3.2', name: 'Llama 3.2 (Default)', desc: 'Balanced speed and intelligence' },
            { id: 'mistral', name: 'Mistral', desc: 'Fast and efficient for summaries' },
            { id: 'phi3', name: 'Phi-3 Mini', desc: 'Lightweight and extremely fast' },
            { id: 'llama3:8b', name: 'Llama 3 8B', desc: 'Deep reasoning for complex queries' },
        ],
    },
    PROCESSING: {
        CHUNK_SIZE: 800,
        CHUNK_OVERLAP: 150,
        MAX_CONTEXT_CHUNKS: 50,
    }
} as const;

export type Config = typeof CONFIG;
