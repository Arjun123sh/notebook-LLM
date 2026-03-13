/**
 * Full End-to-End Test Suite
 * Tests the complete NotebookLM pipeline with REAL data:
 * 1. Create notebook in Supabase
 * 2. Create source record
 * 3. Upload & embed document via /api/upload-source
 * 4. Test semantic search
 * 5. Test chat with context
 * 6. Test all 14 Studio generators
 * 7. Test notes CRUD
 * 8. Cleanup
 */

import { createClient } from '@supabase/supabase-js';

const BASE = 'http://localhost:3001';
const SUPABASE_URL = 'https://auahtiylkcecrwwumpvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWh0aXlsa2NlY3J3d3VtcHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Mzg5MTUsImV4cCI6MjA4ODExNDkxNX0.SW3TbUEFECCd3ozusiE5d_XVuuorPfMsZQekIwJT7f4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Colors
const G = '\x1b[32m✅ PASS\x1b[0m';
const R = '\x1b[31m❌ FAIL\x1b[0m';
const S = '\x1b[33m⚠️  SKIP\x1b[0m';
const BOLD = s => `\x1b[1m${s}\x1b[0m`;
const DIM = s => `\x1b[2m${s}\x1b[0m`;

let passed = 0, failed = 0, skipped = 0;
const log = [];

async function test(name, fn) {
    process.stdout.write(`  ${DIM('→')} ${name}... `);
    try {
        const info = await fn();
        console.log(`${G}${info ? ` — ${info}` : ''}`);
        log.push({ name, status: 'pass', info });
        passed++;
    } catch (e) {
        console.log(`${R} — ${e.message}`);
        log.push({ name, status: 'fail', error: e.message });
        failed++;
    }
}

async function skip(name, reason) {
    console.log(`  ${DIM('→')} ${name}... ${S} — ${reason}`);
    log.push({ name, status: 'skip', reason });
    skipped++;
}

async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return { res, data: await res.json() };
}

// ═══════════════════════════════════════════════════════════════
// TEST DOCUMENT — rich enough content for all generators to work
// ═══════════════════════════════════════════════════════════════
const TEST_DOC = `
# Artificial Intelligence in Healthcare: A Comprehensive Study

## Executive Summary
This study examines the transformative impact of artificial intelligence (AI) on modern healthcare systems.
Published in 2024 by the Global Health Research Institute, findings show that AI adoption in hospitals
increased by 340% between 2020 and 2024, with ROI averaging 287% over 3 years.

## Key Statistics
- 87% of hospitals report improved diagnostic accuracy using AI imaging tools
- Average diagnosis time reduced from 4.2 hours to 23 minutes
- Patient readmission rates dropped by 31% with AI-assisted discharge planning
- Cost savings: $8.3 billion projected annually by 2026
- FDA approved 523 AI-enabled medical devices as of Q3 2024

## Core AI Technologies in Healthcare

### 1. Medical Imaging Analysis
Deep learning models now detect cancers in mammograms with 94.5% accuracy, surpassing the 88%
average for radiologists. Google DeepMind's AlphaFold3 has mapped 200 million protein structures,
accelerating drug discovery by an estimated 50x.

### 2. Natural Language Processing (NLP)
Clinical NLP automates note-taking, reduces physician burnout by 40%, and extracts structured data
from unstructured records. Epic Systems deployed NLP in 2,300 hospitals, processing 4.2 billion
clinical notes in 2023.

### 3. Predictive Analytics
Sepsis prediction models identify high-risk patients 6 hours before onset with 91% sensitivity.
Johns Hopkins Hospital reduced sepsis mortality by 20% using AI early-warning systems.

### 4. Robotic Surgery
The da Vinci surgical system, with AI-assisted guidance, has performed over 10 million procedures.
Complication rates are 5x lower compared to traditional laparoscopic surgery.

## Timeline of Key Events
- 2016: DeepMind's AI diagnoses eye diseases as accurately as expert doctors
- 2018: FDA clears first AI diagnostic system for diabetic retinopathy (IDx-DR)
- 2020: COVID-19 accelerates AI adoption; CT-scan AI detects COVID in 96% of cases
- 2021: AlphaFold2 solves the protein folding problem — dubbed "the biology moon landing"
- 2022: AI drug Halicin discovered — active against drug-resistant bacteria
- 2023: GPT-4 passes USMLE medical licensing exam with 90%+ score
- 2024: WHO releases global guidelines for AI in healthcare

## Challenges & Risks
1. **Data Privacy**: HIPAA compliance adds 23% overhead to AI implementation costs
2. **Bias**: Datasets underrepresent minority populations — algorithms perform 15-20% worse on non-white patients
3. **Regulatory hurdles**: Average FDA approval timeline for AI devices: 18 months
4. **Integration**: 67% of hospitals cite EHR integration as the #1 barrier to AI adoption
5. **Job displacement**: 35% of radiologists project significant role changes by 2030

## Recommendations
- Hospitals should allocate 3-5% of IT budgets to AI infrastructure
- Mandatory bias audits for all FDA-approved AI medical devices
- Establish AI ethics boards within healthcare institutions
- Partner with academic institutions for ongoing model validation

## Glossary
- **LLM**: Large Language Model — AI trained on vast text datasets
- **EHR**: Electronic Health Records
- **FDA**: Food and Drug Administration
- **ROI**: Return on Investment
- **Sepsis**: Life-threatening organ dysfunction caused by infection
`.trim();

// State shared across tests
let notebookId = null;
let sourceId = null;
let noteId = null;
let uploadSuccess = false;

// ════════════════════════════════════════════════════
console.log(BOLD('\n════════════════════════════════════════'));
console.log(BOLD('  NotebookLM — Full E2E Test Suite'));
console.log(BOLD('════════════════════════════════════════\n'));

// ── 1. SERVER ────────────────────────────────────────────────
console.log(BOLD('1. Server Health'));
await test('Dev server reachable at localhost:3001', async () => {
    const res = await fetch(`${BASE}/api/ollama/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"prompt":"hi","context":""}' });
    if (res.status === 200 || res.status === 400) return `HTTP ${res.status}`;
    throw new Error(`Unexpected status ${res.status}`);
});

// ── 2. SUPABASE SETUP ─────────────────────────────────────────
console.log(BOLD('\n2. Supabase — Create Test Notebook & Source'));

await test('Create test notebook', async () => {
    const { data, error } = await supabase.from('notebooks').insert([{ title: '[E2E Test] AI in Healthcare' }]).select();
    if (error) throw new Error(error.message);
    notebookId = data[0].id;
    return `id: ${notebookId}`;
});

await test('Create source record', async () => {
    if (!notebookId) throw new Error('No notebook ID from previous step');
    const { data, error } = await supabase.from('sources').insert([{
        notebook_id: notebookId, name: 'ai-healthcare-study.txt', type: 'text', content: ''
    }]).select();
    if (error) throw new Error(error.message);
    sourceId = data[0].id;
    return `id: ${sourceId}`;
});

// ── 3. UPLOAD + EMBED ─────────────────────────────────────────
console.log(BOLD('\n3. /api/upload-source — Text Embedding Pipeline'));

await test('Upload & embed test document (text → chunks → Supabase)', async () => {
    if (!notebookId || !sourceId) throw new Error('Missing IDs');
    const fd = new FormData();
    fd.append('file', new Blob([TEST_DOC], { type: 'text/plain' }), 'ai-healthcare.txt');
    fd.append('notebookId', notebookId);
    fd.append('sourceId', sourceId);
    fd.append('sourceName', 'AI in Healthcare Study');
    const res = await fetch(`${BASE}/api/upload-source`, { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    uploadSuccess = true;
    return `${data.chunks} chunks created, ${data.stored} stored, ${data.characters} chars`;
});

await test('Verify chunks in Supabase', async () => {
    if (!notebookId) throw new Error('No notebookId');
    const { data, count } = await supabase.from('source_chunks').select('id', { count: 'exact' }).eq('notebook_id', notebookId);
    if (!count || count === 0) throw new Error('No chunks found in Supabase');
    return `${count} chunk(s) in source_chunks table`;
});

// ── 4. SEARCH ────────────────────────────────────────────────
console.log(BOLD('\n4. /api/pinecone/search — Semantic Search'));

const SEARCH_QUERIES = [
    { q: 'AI diagnostic accuracy in medical imaging', expect: 'imaging or accuracy' },
    { q: 'sepsis prediction and patient outcomes', expect: 'sepsis' },
    { q: 'key statistics and ROI figures', expect: 'statistics' },
];

for (const { q, expect } of SEARCH_QUERIES) {
    await test(`Search: "${q.substring(0, 50)}"`, async () => {
        const { res, data } = await post('/api/pinecone/search', { query: q, notebookId, topK: 3 });
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        if (!Array.isArray(data.matches)) throw new Error('matches not array');
        const found = data.matches.length;
        if (found === 0 && uploadSuccess) throw new Error('Expected matches but got 0');
        return `${found} match(es)`;
    });
}

// ── 5. CHAT ──────────────────────────────────────────────────
console.log(BOLD('\n5. /api/ollama/chat — RAG Chat'));

const CHAT_TESTS = [
    { prompt: 'What percentage of hospitals report improved diagnostic accuracy?', ctx: 'Source: 87% of hospitals report improved diagnostic accuracy using AI imaging tools' },
    { prompt: 'What is the main challenge with AI bias in healthcare?', ctx: 'Bias: Datasets underrepresent minority populations — algorithms perform 15-20% worse on non-white patients' },
];

for (const { prompt, ctx } of CHAT_TESTS) {
    await test(`Chat: "${prompt.substring(0, 50)}"`, async () => {
        const { res, data } = await post('/api/ollama/chat', { prompt, context: ctx });
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        if (!data.content) throw new Error('No content returned');
        return `${data.content.length} chars — "${data.content.substring(0, 50).trim()}…"`;
    });
}

// ── 6. STUDIO — ALL 14 GENERATORS ────────────────────────────
console.log(BOLD('\n6. /api/generate — All 14 Studio Generators'));

const ALL_TYPES = [
    'audio-overview', 'video-overview', 'slide-deck',
    'mind-map', 'infographic', 'data-table',
    'flashcards', 'quiz', 'study-guide',
    'reports', 'briefing', 'faq', 'timeline', 'key-topics',
];

for (const type of ALL_TYPES) {
    await test(`Generate: ${type}`, async () => {
        if (!uploadSuccess) throw new Error('Upload failed — skipping generator test');
        const { res, data } = await post('/api/generate', { type, notebookId });
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        if (!data.content || data.content.length < 100) throw new Error(`Too short: ${data.content?.length} chars`);
        return `${data.content.length} chars`;
    });
}

// ── 7. NOTES CRUD ────────────────────────────────────────────
console.log(BOLD('\n7. /api/notes — CRUD with Real Notebook'));

await test('POST — create note in real notebook', async () => {
    if (!notebookId) throw new Error('No notebookId');
    const { res, data } = await post('/api/notes', {
        notebookId, title: 'E2E Test Note', content: 'This note was created during the E2E test.',
    });
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    noteId = data.note?.id;
    return `Created note id: ${noteId}`;
});

await test('GET — list notes for notebook', async () => {
    if (!notebookId) throw new Error('No notebookId');
    const res = await fetch(`${BASE}/api/notes?notebookId=${notebookId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    if (data.notes.length === 0) throw new Error('Expected at least 1 note');
    return `${data.notes.length} note(s) listed`;
});

await test('DELETE — remove test note', async () => {
    if (!noteId) throw new Error('No noteId');
    const res = await fetch(`${BASE}/api/notes`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: noteId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return `Deleted note ${noteId}`;
});

// ── 8. CLEANUP ────────────────────────────────────────────────
console.log(BOLD('\n8. Cleanup — Remove Test Data'));

await test('Delete source chunks', async () => {
    if (!notebookId) throw new Error('No notebookId');
    const { error } = await supabase.from('source_chunks').delete().eq('notebook_id', notebookId);
    if (error) throw new Error(error.message);
    return 'Chunks deleted';
});

await test('Delete source record', async () => {
    if (!sourceId) throw new Error('No sourceId');
    const { error } = await supabase.from('sources').delete().eq('id', sourceId);
    if (error) throw new Error(error.message);
    return 'Source deleted';
});

await test('Delete test notebook', async () => {
    if (!notebookId) throw new Error('No notebookId');
    const { error } = await supabase.from('notebooks').delete().eq('id', notebookId);
    if (error) throw new Error(error.message);
    return 'Notebook deleted';
});

// ── SUMMARY ──────────────────────────────────────────────────
const total = passed + failed + skipped;
const bar = '═'.repeat(42);
console.log(`\n${BOLD(bar)}`);
console.log(BOLD('  RESULTS'));
console.log(bar);
console.log(`  \x1b[32m✅ Passed:  ${passed}\x1b[0m`);
if (failed > 0) console.log(`  \x1b[31m❌ Failed:  ${failed}\x1b[0m`);
if (skipped > 0) console.log(`  \x1b[33m⚠️  Skipped: ${skipped}\x1b[0m`);
console.log(`  Total:    ${total}`);
console.log(BOLD(bar + '\n'));

if (failed > 0) {
    console.log('\x1b[31mFailed tests:\x1b[0m');
    log.filter(l => l.status === 'fail').forEach(l => console.log(`  ❌ ${l.name}: ${l.error}`));
    process.exit(1);
}
