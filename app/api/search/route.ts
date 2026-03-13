import { NextRequest, NextResponse } from "next/server";
import { ollamaService } from "@/lib/services/ollama.service";
import { storageService } from "@/lib/services/storage.service";
import { supabase } from "@/lib/supabase";
import { withApiHandler } from "@/lib/api-handler";

export const POST = withApiHandler(async (req: NextRequest) => {
    const { query, notebookId, topK = 5 } = await req.json();

    if (!query || !notebookId) {
        throw new Error("query and notebookId are required");
    }

    // 1. Embed the query via Ollama
    let queryEmbedding: number[] = [];
    let chunks: any[] = [];
    let searchError = "";

    try {
        queryEmbedding = await ollamaService.generateEmbedding(query);
        chunks = await storageService.matchChunks(queryEmbedding, notebookId, topK);
    } catch (e: any) {
        console.error("Embedding generation failed, falling back to keywords:", e.message);
        searchError = "Source search is limited (Local AI unreachable).";
    }

    // 3. Fallback: If no vector matches found (or embedding failed), try a simple keyword search
    // This is critical for "Zero-Cost" production deployments where embeddings might be unavailable.
    if ((!chunks || chunks.length === 0)) {
        console.log("No vector matches found, falling back to keyword search...");
        const { data: keywordChunks } = await supabase
            .from('source_chunks')
            .select('id, content, source_id, notebook_id')
            .eq('notebook_id', notebookId)
            .ilike('content', `%${query}%`)
            .limit(topK);

        if (keywordChunks && keywordChunks.length > 0) {
            chunks = keywordChunks;
        } else if (!chunks || chunks.length === 0) {
            // Last resort: If still nothing, just grab the most recent chunks to provide SOME context
            const { data: recentChunks } = await supabase
                .from('source_chunks')
                .select('id, content, source_id, notebook_id')
                .eq('notebook_id', notebookId)
                .limit(topK);
            chunks = recentChunks || [];
        }
    }

    const matches = (chunks || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        sourceId: c.source_id,
        score: c.similarity || 0.5, // Default score for fallback matches
        metadata: c.metadata,
    }));

    return NextResponse.json({ matches, error: searchError });
});
