import { NextRequest, NextResponse } from 'next/server';
import { ollamaService } from '@/lib/services/ollama.service';
import { withApiHandler } from '@/lib/api-handler';

export const POST = withApiHandler(async (req: NextRequest) => {
    const { text } = await req.json();

    if (!text) {
        throw new Error('No text provided');
    }

    const embedding = await ollamaService.generateEmbedding(text);

    return NextResponse.json({ embedding });
});