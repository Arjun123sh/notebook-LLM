import { NextRequest, NextResponse } from 'next/server';
import { ollamaService } from '@/lib/services/ollama.service';
import { withApiHandler } from '@/lib/api-handler';

export const POST = withApiHandler(async (req: NextRequest) => {
    const { prompt, context, model } = await req.json();

    if (!prompt) {
        throw new Error('No prompt provided');
    }

    const content = await ollamaService.chat(prompt, context, model);
    return NextResponse.json({ content });
});
