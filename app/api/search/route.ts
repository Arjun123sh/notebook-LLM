import { NextRequest, NextResponse } from "next/server";
import { ollamaService } from "@/lib/services/ollama.service";
import { storageService } from "@/lib/services/storage.service";
import { withApiHandler } from "@/lib/api-handler";

export const POST = withApiHandler(async (req: NextRequest) => {
    const { query, notebookId, topK = 5 } = await req.json();

    if (!query || !notebookId) {
        throw new Error("query and notebookId are required");
    }

    // 1. Embed the query via Ollama
    const queryEmbedding = await ollamaService.generateEmbedding(query);

    // 2. Search via Supabase match_source_chunks RPC via storageService
    const chunks = await storageService.matchChunks(queryEmbedding, notebookId, topK);

    const matches = (chunks || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        sourceId: c.source_id,
        score: c.similarity,
        metadata: c.metadata,
    }));

    return NextResponse.json({ matches });
});
