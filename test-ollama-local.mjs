// Quick test for local Ollama embed + chat
const OLLAMA = 'http://localhost:11434';

async function testEmbed() {
    const res = await fetch(`${OLLAMA}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'nomic-embed-text', input: 'test embedding' }),
    });
    const data = await res.json();
    const dim = data.embeddings?.[0]?.length;
    if (!dim) throw new Error('No embedding returned: ' + JSON.stringify(data));
    console.log(`✅ nomic-embed-text OK → ${dim} dimensions`);
}

async function testChat() {
    const res = await fetch(`${OLLAMA}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama3.2',
            messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
            stream: false,
        }),
    });
    const data = await res.json();
    const reply = data.message?.content;
    if (!reply) throw new Error('No reply: ' + JSON.stringify(data));
    console.log(`✅ llama3.2 OK → "${reply.trim()}"`);
}

(async () => {
    try {
        await testEmbed();
        await testChat();
        console.log('\n🎉 All models working locally!');
    } catch (e) {
        console.error('❌ Test failed:', e.message);
        process.exit(1);
    }
})();
