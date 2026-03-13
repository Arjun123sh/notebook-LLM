import path from "path";
import { pathToFileURL } from "url";

export function chunkText(text: string, size: number, overlap: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        const chunk = text.slice(i, i + size).trim();
        if (chunk.length > 0) chunks.push(chunk);
        i += size - overlap;
    }
    return chunks;
}

export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const workerPath = path.join(
        process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableFontFace: true,
    }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = (content?.items ?? [])
            .map((item: any) => item?.str ?? "")
            .join(" ");
        text += pageText + "\n";
    }
    return text;
}
