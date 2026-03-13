import { NextRequest, NextResponse } from "next/server";
import { ollamaService } from "@/lib/services/ollama.service";
import { storageService } from "@/lib/services/storage.service";
import { withApiHandler } from "@/lib/api-handler";
import { chunkText, extractTextFromPDF } from "@/lib/utils/source-processing";
import { CONFIG } from "@/lib/config";

const CONCURRENCY_LIMIT = 3; // Process embeddings in small batches for local Ollama stability

export const POST = withApiHandler(async (req: NextRequest) => {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const notebookId = formData.get("notebookId") as string;
    const sourceId = formData.get("sourceId") as string;
    const sourceName = formData.get("sourceName") as string;
    const extractedText = formData.get("extractedText") as string;

    if (!file && !extractedText) {
        throw new Error("Either file or extractedText is required");
    }

    // 1. OBTAIN TEXT (Client-side extraction preferred)
    console.log(`Processing source: ${sourceName || file?.name || 'Text Source'}`);
    let text = extractedText || "";

    if (!text && file) {
        if (file.type === "application/pdf") {
            const buffer = await file.arrayBuffer();
            text = await extractTextFromPDF(buffer);
        } else {
            text = await file.text();
        }
    }

    if (!text.trim()) {
        throw new Error("No text extracted from file");
    }

    // 2. CHUNK TEXT
    const chunks = chunkText(text, CONFIG.PROCESSING.CHUNK_SIZE, CONFIG.PROCESSING.CHUNK_OVERLAP);
    console.log(`Chunks created: ${chunks.length}`);

    if (chunks.length === 0) {
        throw new Error("No chunks created");
    }

    // 3. GENERATE EMBEDDINGS + STORE (Optimized with controlled concurrency)
    let stored = 0;

    // Process in batches
    for (let i = 0; i < chunks.length; i += CONCURRENCY_LIMIT) {
        const batch = chunks.slice(i, i + CONCURRENCY_LIMIT);
        console.log(`Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}/${Math.ceil(chunks.length / CONCURRENCY_LIMIT)}...`);

        const embeddingPromises = batch.map(async (chunk, index) => {
            try {
                const chunkIndex = i + index;
                const embedding = await ollamaService.generateEmbedding(chunk);

                if (embedding.length === 0) return null;

                return {
                    source_id: sourceId,
                    notebook_id: notebookId,
                    content: chunk,
                    metadata: { sourceName: sourceName || file.name, chunkIndex },
                    embedding,
                };
            } catch (err) {
                console.error(`Error embedding chunk ${i + index}:`, err);
                return null;
            }
        });

        const batchResults = await Promise.all(embeddingPromises);
        const validResults = batchResults.filter((r): r is NonNullable<typeof r> => r !== null);

        if (validResults.length > 0) {
            await storageService.insertChunks(validResults);
            stored += validResults.length;
        }
    }

    console.log(`Successfully stored ${stored}/${chunks.length} chunks`);

    // Update source content (preview)
    await storageService.updateSourceContent(sourceId, text.substring(0, 5000));

    return NextResponse.json({
        success: true,
        characters: text.length,
        chunks: chunks.length,
        stored,
    });
});