export async function generateEmbedding(text: string): Promise<number[]> {
    const res = await fetch('/api/ollama/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate embedding');
    return data.embedding;
}

export async function generateChat(prompt: string, context: string): Promise<string> {
    const res = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate chat response');
    return data.content;
}
