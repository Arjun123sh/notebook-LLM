const GROQ_API_KEY = "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";

async function testGroq() {
    console.log('--- Testing Groq Integration (Standalone) ---');
    console.log('Key:', GROQ_API_KEY ? 'Present' : 'Missing');

    try {
        const url = 'https://api.groq.com/openai/v1/chat/completions';
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'Say hello and tell me what model you are.' }],
                stream: false,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            console.error('Groq API Error:', err.error?.message || res.statusText);
            return;
        }

        const data = await res.json();
        console.log('Response:', data.choices[0].message.content);
        console.log('--- Success ---');
    } catch (e) {
        console.error('Test failed:', e);
    }
}

testGroq();
