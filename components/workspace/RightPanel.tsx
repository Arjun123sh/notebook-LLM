'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Source, Note } from '@/types';
import { supabase } from '@/lib/supabase';
import {
    Bookmark, Plus, Trash2, Loader2, BookOpen, FileQuestion, AlignLeft,
    Clock, List, Headphones, MonitorPlay, Video, GitBranch, BarChart2,
    CreditCard, HelpCircle, PieChart, Table2, FileText, Download, Share2,
    Timer, File, X, Copy, PlayCircle
} from 'lucide-react';
import AudioNarrativePlayer from './AudioNarrativePlayer';
import RelationshipGraph from './RelationshipGraph';
import { CONFIG } from '@/lib/config';

interface Props {
    notebookId: string;
    sources: Source[];
    notes: Note[];
    onNoteAdded: (n: Note) => void;
    onNoteDeleted: (id: string) => void;
    width?: number;
}

type Tab = 'notes' | 'studio';

const STUDIO_GROUPS = [
    {
        label: 'Audio & Visual',
        items: [
            { id: 'audio-overview', icon: Headphones, label: 'Audio Overview', desc: 'Podcast-style dialogue script between two hosts' },
            { id: 'video-overview', icon: Video, label: 'Video Overview', desc: 'Narrated video script with visual directions' },
            { id: 'slide-deck', icon: MonitorPlay, label: 'Slide Deck', desc: 'Structured presentation outline (8-12 slides)' },
        ],
    },
    {
        label: 'Visual Structures',
        items: [
            { id: 'mind-map', icon: GitBranch, label: 'Mind Map', desc: 'Branching concept map of key topics' },
            { id: 'infographic', icon: PieChart, label: 'Infographic', desc: 'Stats, icons, and visual layout outline' },
            { id: 'data-table', icon: Table2, label: 'Data Table', desc: 'Structured tables from source data/stats' },
        ],
    },
    {
        label: 'Study Tools',
        items: [
            { id: 'flashcards', icon: CreditCard, label: 'Flashcards', desc: '12-15 Q&A cards for studying' },
            { id: 'quiz', icon: HelpCircle, label: 'Quiz', desc: '10-question multiple choice quiz' },
            { id: 'study-guide', icon: BookOpen, label: 'Study Guide', desc: 'Key concepts, Q&A, and vocabulary' },
        ],
    },
    {
        label: 'Documents',
        items: [
            { id: 'reports', icon: FileText, label: 'Report', desc: 'Full research report with analysis' },
            { id: 'briefing', icon: AlignLeft, label: 'Briefing Doc', desc: 'Executive summary with recommendations' },
            { id: 'faq', icon: FileQuestion, label: 'FAQ', desc: '8-10 frequently asked questions with answers' },
            { id: 'timeline', icon: Clock, label: 'Timeline', desc: 'Chronological events and milestones' },
            { id: 'key-topics', icon: List, label: 'Key Topics', desc: 'Overview of 6-8 main topics' },
        ],
    },
];

// Flatten for lookup
const ALL_ITEMS = STUDIO_GROUPS.flatMap(g => g.items);

const ModelSelector = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
    <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <GitBranch size={14} style={{ color: 'var(--accent)' }} />
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', cursor: 'pointer' }}
        >
            {CONFIG.OLLAMA.SUPPORTED_MODELS.map(m => (
                <option key={m.id} value={m.id} title={m.desc}>{m.name}</option>
            ))}
        </select>
    </div>
);

function cleanMarkdown(text: string): string {
    let cleaned = text;

    cleaned = cleaned.replace(/\*\*/g, '');

    cleaned = cleaned.replace(/【\d+[^\]]*】/g, '');

    cleaned = cleaned.replace(/^### (.+)$/gm, '━━━ $1 ━━━');
    cleaned = cleaned.replace(/^## (.+)$/gm, '▄▄▄ $1 ▄▄▄');
    cleaned = cleaned.replace(/^# (.+)$/gm, '▀▀▀ $1 ▀▀▀');

    cleaned = cleaned.replace(/^(\|.+\|)$/gm, (match) => {
        const trimmed = match.trim();
        if (trimmed.startsWith('|---') || trimmed.startsWith('|:--') || trimmed.startsWith('|---:') || trimmed.startsWith('|:-')) {
            return '';
        }
        const cells = trimmed.split('|').filter(c => c.trim());
        return cells.map(c => c.trim().padEnd(20)).join(' │ ');
    });

    cleaned = cleaned.replace(/^[-*] (.+)$/gm, '• $1');

    cleaned = cleaned.replace(/^(\d+)\. (.+)$/gm, '$1. $2');

    cleaned = cleaned.replace(/`{3}[\s\S]*?`{3}/g, '');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

    return cleaned;
}

function exportToExcel(content: string, type: string) {
    const rows = content.split('\n');
    let csvContent = '\uFEFF';

    for (const row of rows) {
        const cells = row.split('|').filter(c => c.trim());
        if (cells.length > 1) {
            const processedCells = cells.map(cell => {
                let value = cell.trim();
                value = value.replace(/\*\*/g, '');
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvContent += processedCells.join(',') + '\n';
        }
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

function exportFlashcardsCSV(content: string) {
    const lines = content.split('\n');
    let csvContent = 'Question,Answer\n';

    let inCard = false;
    let question = '';
    let answer = '';

    for (const line of lines) {
        if (line.includes('CARD')) {
            if (question && answer) {
                csvContent += `"${question.replace(/"/g, '""')}","${answer.replace(/"/g, '""')}"\n`;
            }
            inCard = true;
            question = '';
            answer = '';
        } else if (line.startsWith('FRONT:')) {
            question = line.replace('FRONT:', '').trim();
        } else if (line.startsWith('BACK:')) {
            answer = line.replace('BACK:', '').trim();
        }
    }

    if (question && answer) {
        csvContent += `"${question.replace(/"/g, '""')}","${answer.replace(/"/g, '""')}"\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flashcards_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

function exportFlashcardsPDF(content: string) {
    const lines = content.split('\n');
    let html = `<!DOCTYPE html><html><head><title>Flashcards</title>
<style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .card { border: 1px solid #ccc; border-radius: 8px; padding: 15px; margin: 10px 0; page-break-inside: avoid; }
    .front { font-weight: bold; color: #2563eb; font-size: 14px; margin-bottom: 8px; }
    .back { color: #333; font-size: 13px; }
    @media print { .card { break-inside: avoid; } }
</style></head><body><h1>Flashcards</h1>`;

    let inCard = false;
    let question = '';
    let answer = '';

    for (const line of lines) {
        if (line.includes('CARD')) {
            if (question || answer) {
                html += `<div class="card"><div class="front">${question}</div><div class="back">${answer}</div></div>`;
            }
            question = '';
            answer = '';
        } else if (line.startsWith('FRONT:')) {
            question = line.replace('FRONT:', '').trim();
        } else if (line.startsWith('BACK:')) {
            answer = line.replace('BACK:', '').trim();
        }
    }

    if (question || answer) {
        html += `<div class="card"><div class="front">${question}</div><div class="back">${answer}</div></div>`;
    }

    html += '</body></html>';

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flashcards_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
}

export default function RightPanel({ notebookId, sources, notes, onNoteAdded, onNoteDeleted, width = 340 }: Props) {
    const [tab, setTab] = useState<Tab>('notes');
    const [addingNote, setAddingNote] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState<{ type: string; content: string } | null>(null);
    const [showSavedToast, setShowSavedToast] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showShareToast, setShowShareToast] = useState(false);
    const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);
    const [showMindMap, setShowMindMap] = useState(false);
    const [selectedModel, setSelectedModel] = useState(CONFIG.OLLAMA.CHAT_MODEL);
    const [examTimer, setExamTimer] = useState<{ active: boolean; duration: number; remaining: number }>({ active: false, duration: 30, remaining: 30 });
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    function showToast() {
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2000);
    }

    useEffect(() => {
        if (examTimer.active && examTimer.remaining > 0) {
            timerRef.current = setTimeout(() => {
                setExamTimer(prev => ({ ...prev, remaining: prev.remaining - 1 }));
            }, 1000);
        } else if (examTimer.active && examTimer.remaining === 0) {
            setExamTimer(prev => ({ ...prev, active: false }));
            alert('Time is up!');
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [examTimer.active, examTimer.remaining]);

    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function startTimer(minutes: number) {
        setExamTimer({ active: true, duration: minutes * 60, remaining: minutes * 60 });
    }

    function stopTimer() {
        setExamTimer({ active: false, duration: 30, remaining: 30 });
    }

    async function createShareLink() {
        const shareId = crypto.randomUUID();
        const shareUrl = `${window.location.origin}/share/${shareId}`;

        await supabase.from('shared_notebooks').insert({
            id: shareId,
            notebook_id: notebookId,
            created_at: new Date().toISOString()
        });

        await navigator.clipboard.writeText(shareUrl);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
    }

    async function saveNote() {
        if (!noteContent.trim()) return;
        setSaving(true);
        const { data } = await supabase.from('notes').insert({ notebook_id: notebookId, title: 'Note', content: noteContent }).select();
        if (data?.[0]) { onNoteAdded(data[0]); setNoteContent(''); setAddingNote(false); showToast(); }
        setSaving(false);
    }

    async function deleteNote(id: string) {
        await supabase.from('notes').delete().eq('id', id);
        onNoteDeleted(id);
    }

    async function generate(type: string) {
        if (sources.length === 0) { alert('Add sources first.'); return; }
        setGenerating(type);
        setGeneratedContent(null);
        setRelatedQuestions([]);
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, notebookId, model: selectedModel }),
            });
            const data = await res.json();
            if (res.ok) {
                setGeneratedContent({ type, content: data.content });

                // Generate related questions
                const questionsRes = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'related-questions', notebookId, context: data.content }),
                });
                const questionsData = await questionsRes.json();
                if (questionsRes.ok && questionsData.content) {
                    const questions = questionsData.content
                        .split('\n')
                        .filter((q: string) => q.trim().match(/^[-*\d.]/))
                        .slice(0, 3)
                        .map((q: string) => q.replace(/^[-*\d.]\s*/, '').trim());
                    setRelatedQuestions(questions);
                }
            }
        } catch (e: any) { alert('Error: ' + e.message); }
        finally { setGenerating(null); }
    }

    async function saveGeneratedAsNote() {
        if (!generatedContent) return;
        const label = ALL_ITEMS.find(i => i.id === generatedContent.type)?.label || generatedContent.type;
        const { data } = await supabase.from('notes').insert({ notebook_id: notebookId, title: label, content: generatedContent.content }).select();
        if (data?.[0]) { onNoteAdded(data[0]); showToast(); }
    }

    function formatDate(d: string) {
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return (
        <div style={{ width, borderLeft: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
            {showSavedToast && (
                <div className="animate-fadeIn" style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#0D1117', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    Note saved!
                </div>
            )}
            {showShareToast && (
                <div className="animate-fadeIn" style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#22c55e', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Share2 size={14} /> Share link copied!
                </div>
            )}
            {/* Timer overlay */}
            {examTimer.active && (
                <div style={{ position: 'absolute', top: 50, right: 10, background: examTimer.remaining <= 60 ? '#ef4444' : '#22c55e', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 700, zIndex: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    <Timer size={12} style={{ marginRight: 4 }} /> {formatTime(examTimer.remaining)}
                </div>
            )}
            {/* Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', flex: 1 }}>
                    {(['notes', 'studio'] as Tab[]).map(t => (
                        <button key={t} onClick={() => { setTab(t); setGeneratedContent(null); }}
                            style={{ flex: 1, padding: '14px 0', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 600 : 400, textTransform: 'capitalize' }}>
                            {t === 'notes' ? `Notes${notes.length > 0 ? ` (${notes.length})` : ''}` : 'Studio'}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 4, paddingRight: 8 }}>
                    {!examTimer.active ? (
                        <button onClick={() => { const mins = prompt('Enter exam duration in minutes:', '30'); if (mins) startTimer(parseInt(mins) || 30); }} title="Start Exam Timer"
                            style={{ padding: '6px 8px', background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <Timer size={14} />
                        </button>
                    ) : (
                        <button onClick={stopTimer} title="Stop Timer"
                            style={{ padding: '6px 8px', background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>
                            <X size={14} />
                        </button>
                    )}
                    <button onClick={createShareLink} title="Share Notebook"
                        style={{ padding: '6px 8px', background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Share2 size={14} />
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

                {/* ═══ NOTES TAB ═══ */}
                {tab === 'notes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button onClick={() => setAddingNote(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'var(--bg-elevated)', border: '1px dashed var(--border)', borderRadius: 10, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, width: '100%' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                            <Plus size={14} /> New note
                        </button>

                        {addingNote && (
                            <div className="animate-fadeIn" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent)', borderRadius: 10, padding: 13 }}>
                                <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Write your note…" rows={5} autoFocus
                                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', marginBottom: 10, lineHeight: 1.6 }} />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={saveNote} disabled={saving || !noteContent.trim()} style={{ flex: 1, padding: '7px', background: 'var(--accent)', color: '#0D1117', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                                    </button>
                                    <button onClick={() => { setAddingNote(false); setNoteContent(''); }} style={{ padding: '7px 12px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                                </div>
                            </div>
                        )}

                        {notes.length === 0 && !addingNote ? (
                            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                                <Bookmark size={26} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>Save AI responses or write your own notes</p>
                            </div>
                        ) : notes.map(n => (
                            <div key={n.id} className="animate-fadeIn" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: 13 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <div>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{n.title}</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{formatDate(n.created_at)}</span>
                                    </div>
                                    <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 120, overflow: 'hidden' }}>{cleanMarkdown(n.content)}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ═══ STUDIO TAB ═══ */}
                {tab === 'studio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <ModelSelector value={selectedModel} onChange={setSelectedModel} />

                        {showAudioPlayer && generatedContent?.type === 'audio-overview' && (
                            <AudioNarrativePlayer
                                script={generatedContent.content}
                                onClose={() => setShowAudioPlayer(false)}
                            />
                        )}

                        {showMindMap && (
                            <RelationshipGraph
                                sources={sources}
                                onClose={() => setShowMindMap(false)}
                            />
                        )}
                        {/* Generated result view */}
                        {generatedContent && (
                            <div className="animate-fadeIn" style={{
                                background: 'var(--bg-base)',
                                borderRadius: 16,
                                overflow: 'hidden',
                                marginBottom: 14,
                                border: '1px solid var(--border)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                            }}>
                                <div style={{
                                    background: 'var(--bg-surface)',
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                background: 'var(--accent-surface)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {(() => {
                                                    const item = ALL_ITEMS.find(i => i.id === generatedContent.type);
                                                    return item?.icon && React.createElement(item.icon, { size: 18, style: { color: 'var(--accent)' } });
                                                })()}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {ALL_ITEMS.find(i => i.id === generatedContent.type)?.label}
                                                </span>
                                                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Generated from your sources</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            {generatedContent.type === 'audio-overview' && (
                                                <button onClick={() => setShowAudioPlayer(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--accent-surface)', border: '1px solid var(--accent)', borderRadius: 8, color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                                    <PlayCircle size={14} /> Listen
                                                </button>
                                            )}
                                            <button onClick={() => setGeneratedContent(null)} style={{ padding: '8px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer' }} title="Back">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                                        <button onClick={saveGeneratedAsNote} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                            <Bookmark size={14} /> Save to notes
                                        </button>
                                        <button onClick={() => { navigator.clipboard.writeText(generatedContent.content.replace(/\*\*/g, '').replace(/【\d+[^\]]*】/g, '')); showToast(); }}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
                                            <Copy size={14} /> Copy
                                        </button>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'var(--bg-base)',
                                    padding: 20,
                                    maxHeight: 'calc(100vh - 380px)',
                                    overflowY: 'auto',
                                }}>
                                    <div style={{
                                        fontSize: 13,
                                        color: 'var(--text-primary)',
                                        lineHeight: 1.8,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}>
                                        {generatedContent.content.split('\n').map((line, i) => {
                                            const cleaned = line.replace(/\*\*/g, '').replace(/【\d+[^\]]*】/g, '').trim();
                                            if (!cleaned) return <div key={i} style={{ height: 12 }} />;

                                            if (cleaned.startsWith('━━━') || cleaned.startsWith('▄▄▄') || cleaned.startsWith('▀▀▀')) {
                                                const text = cleaned.replace(/^[━━━▄▄▄▀▀▀\s]+|[━━━▄▄▄▀▀▀\s]+$/g, '');
                                                return <h3 key={i} style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 24, marginBottom: 12, borderBottom: '2px solid var(--accent)', paddingBottom: 8 }}>{text}</h3>;
                                            }

                                            if (cleaned.match(/^[A-Z\s\-_]{3,}:?$/)) {
                                                return <h4 key={i} style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cleaned}</h4>;
                                            }

                                            if (cleaned.startsWith('•') || cleaned.startsWith('-')) {
                                                return <div key={i} style={{ paddingLeft: 16, marginBottom: 8, color: 'var(--text-primary)', position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>•</span>{cleaned.replace(/^[•\-]\s*/, '')}</div>;
                                            }

                                            return <p key={i} style={{ marginBottom: 12, color: 'var(--text-primary)', lineHeight: 1.7 }}>{cleaned}</p>;
                                        })}
                                    </div>
                                </div>

                                {relatedQuestions.length > 0 && (
                                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested next steps</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {relatedQuestions.map((q, i) => (
                                                <button key={i} onClick={() => { navigator.clipboard.writeText(q); showToast(); }}
                                                    style={{ textAlign: 'left', padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-base)'; }}
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Item buttons grouped */}
                        {!generatedContent && STUDIO_GROUPS.map(group => (
                            <div key={group.label} style={{ marginBottom: 16 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{group.label}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {group.items.map(item => (
                                        <button key={item.id} onClick={() => {
                                            if (item.id === 'mind-map') setShowMindMap(true);
                                            else generate(item.id);
                                        }}
                                            disabled={!!generating || sources.length === 0}
                                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: generating === item.id ? 'var(--bg-active)' : 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, cursor: sources.length === 0 ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: sources.length === 0 ? 0.6 : 1, transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                            onMouseEnter={e => { if (sources.length > 0 && !generating) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                            onMouseLeave={e => { if (generating !== item.id) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                                        >
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                background: generating === item.id ? 'var(--accent-glow)' : 'var(--bg-surface)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: '1px solid var(--border)',
                                                flexShrink: 0
                                            }}>
                                                {generating === item.id
                                                    ? <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
                                                    : <item.icon size={16} style={{ color: 'var(--accent)' }} />}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.label}</p>
                                                <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {sources.length === 0 && !generatedContent && (
                            <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                <FileQuestion size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Add sources to enable studio features</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
