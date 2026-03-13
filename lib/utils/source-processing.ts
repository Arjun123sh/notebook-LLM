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
    // PDF.js in Node.js environment needs some polyfills for browser globals
    if (typeof global !== 'undefined' && !(global as any).DOMMatrix) {
        (global as any).DOMMatrix = class DOMMatrix {
            a: number; b: number; c: number; d: number; e: number; f: number;
            constructor(arg?: any) {
                this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
                if (Array.isArray(arg)) {
                    [this.a, this.b, this.c, this.d, this.e, this.f] = arg;
                }
            }
        };
    }

    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // Use a CDN-hosted worker for production/Vercel compatibility
    // and disable the need for a separate worker file in Node environment
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.mjs`;

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
