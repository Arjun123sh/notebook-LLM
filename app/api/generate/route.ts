import { NextRequest, NextResponse } from 'next/server';
import { ollamaService } from '@/lib/services/ollama.service';
import { storageService } from '@/lib/services/storage.service';
import { withApiHandler } from '@/lib/api-handler';
import { PROMPTS, PromptType } from '@/lib/prompts';
import { CONFIG } from '@/lib/config';

export const POST = withApiHandler(async (req: NextRequest) => {
    const { type, notebookId, context: extraContext, model } = await req.json();

    if (!type || !notebookId) {
        throw new Error('type and notebookId are required');
    }

    const promptFn = PROMPTS[type as PromptType];
    if (!promptFn) throw new Error('Invalid generation type');

    let prompt = '';

    // For related-questions, use provided context if available
    if (type === 'related-questions' && extraContext) {
        prompt = promptFn('', { context: extraContext });
    } else {
        // Fetch source chunks for context
        const chunks = await storageService.getChunks(notebookId, CONFIG.PROCESSING.MAX_CONTEXT_CHUNKS);

        if (!chunks || chunks.length === 0) {
            throw new Error('No source content found. Please upload sources first.');
        }

        const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n');
        prompt = promptFn(context);
    }

    const content = await ollamaService.generateWithPrompt(prompt, model);
    return NextResponse.json({ content });
});
