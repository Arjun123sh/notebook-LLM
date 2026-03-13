'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Upload, MessageSquare, BookMarked, FileText, Globe, Sparkles, ArrowRight, Check, Zap, Shield, Brain, ChevronRight, Layers, Cpu, Lock, Star } from 'lucide-react';

const FEATURES = [
    { icon: Brain, title: 'AI-Powered Q&A', desc: 'Ask anything about your sources. Get precise answers grounded in your documents — no hallucinations.' },
    { icon: FileText, title: 'Multi-format Sources', desc: 'Upload PDFs, paste text, or link URLs. Extract and index every word automatically.' },
    { icon: Sparkles, title: 'Smart Summaries', desc: 'Generate study guides, FAQs, briefing docs, and timelines from your sources in one click.' },
    { icon: BookMarked, title: 'Inline Citations', desc: 'Every answer links back to the exact passage in your source. Click to view highlighted text.' },
    { icon: Zap, title: 'Local & Fast', desc: 'Powered by local Ollama models. Your data stays on your machine — no cloud required.' },
    { icon: Shield, title: 'Fully Private', desc: 'All processing happens on your own hardware. No data is sent to external AI services.' },
];

const STEPS = [
    { icon: Upload, num: '01', title: 'Add your sources', desc: 'Upload PDFs, paste text, or add website URLs to your notebook.' },
    { icon: MessageSquare, num: '02', title: 'Ask questions', desc: 'Chat naturally with your sources. The AI retrieves the most relevant context automatically.' },
    { icon: BookMarked, num: '03', title: 'Save & synthesize', desc: 'Save insights as notes, generate study guides, FAQs, or briefing documents instantly.' },
];

const DEMO_MESSAGES = [
    { role: 'user', text: 'What are the key findings in the research?' },
    { role: 'ai', text: 'Based on the paper [1], the study found three major findings: improved accuracy by 23%, reduced latency by 40%, and significant cost savings compared to baseline models [2].' },
];

export default function Landing() {
    const [visibleMsg, setVisibleMsg] = useState(0);
    const [typed, setTyped] = useState('');
    const [typing, setTyping] = useState(true);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const msg = DEMO_MESSAGES[visibleMsg];
        if (!msg) return;

        if (typing) {
            if (typed.length < msg.text.length) {
                timeout = setTimeout(() => setTyped(msg.text.slice(0, typed.length + 1)), 22);
            } else {
                timeout = setTimeout(() => {
                    if (visibleMsg < DEMO_MESSAGES.length - 1) {
                        setVisibleMsg(v => v + 1);
                        setTyped('');
                    }
                }, 1500);
            }
        }
        return () => clearTimeout(timeout);
    }, [typed, typing, visibleMsg]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}>
            {/* ── NAV ── */}
            <nav style={{ position: 'sticky', top: 0, zIndex: 50, height: 64, borderBottom: '1px solid var(--border)', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,255,255,0.15)' }}>
                        <BookOpen size={14} color="#0a0a0a" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>NotebookLM</span>
                </Link>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Link href="/dashboard" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}
                    >Sign in</Link>
                    <Link href="/dashboard"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent)', color: '#0a0a0a', padding: '8px 20px', borderRadius: 22, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 0 0 0 rgba(255,255,255,0)' }}
                        onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 8px 24px rgba(255,255,255,0.2)'; }}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}
                    >
                        Get Started <ArrowRight size={14} />
                    </Link>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 48px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
                <div className="animate-fadeIn">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 24, padding: '6px 16px', marginBottom: 28, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
                        Powered by local Ollama
                    </div>
                    <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.04em', marginBottom: 24, color: 'var(--text-primary)' }}>
                        Your AI research<br />
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>notebook</span>,<br />
                        <span style={{ background: 'linear-gradient(90deg, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>reimagined.</span>
                    </h1>
                    <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40, maxWidth: 480, fontWeight: 400 }}>
                        Upload your sources. Ask questions. Get answers with precise citations — all powered by local AI, completely private.
                    </p>
                    <div style={{ display: 'flex', gap: 14 }}>
                        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: '#0a0a0a', padding: '14px 32px', borderRadius: 26, fontSize: 15, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(255,255,255,0.15)' }}
                            onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 12px 32px rgba(255,255,255,0.25)'; }}
                            onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'none'; el.style.boxShadow = '0 4px 20px rgba(255,255,255,0.15)'; }}
                        >
                            Start Free <ArrowRight size={16} />
                        </Link>
                        <a href="#how-it-works" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 28px', borderRadius: 26, fontSize: 15, color: 'var(--text-secondary)', textDecoration: 'none', border: '1px solid var(--border-light)', transition: 'all 0.15s' }}
                            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--text-muted)'; el.style.color = 'var(--text-primary)'; }}
                            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border-light)'; el.style.color = 'var(--text-secondary)'; }}
                        >
                            See how it works <ChevronRight size={16} />
                        </a>
                    </div>

                    <div style={{ display: 'flex', gap: 32, marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
                        {[
                            { icon: Lock, label: '100% Private', desc: 'Local processing' },
                            { icon: Zap, label: 'No Cloud APIs', desc: 'Runs offline' },
                            { icon: Star, label: 'Open Source', desc: 'Free forever' }
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <item.icon size={16} style={{ color: 'var(--text-secondary)' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── DEMO UI ── */}
                <div className="animate-fadeIn" style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
                    
                    {/* Decorative elements */}
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, border: '1px solid var(--border)', borderRadius: '50%', opacity: 0.3, animation: 'float 4s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, border: '1px solid var(--border-light)', borderRadius: '50%', opacity: 0.2, animation: 'float 5s ease-in-out infinite 0.5s' }} />

                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', position: 'relative' }}>
                        {/* Window chrome */}
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {['#3a3a3a', '#3a3a3a', '#3a3a3a'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === 1 ? 'var(--border-light)' : c }} />)}
                            </div>
                            <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>Research Paper Analysis</span>
                            <div style={{ width: 10 }} />
                        </div>
                        {/* Sources row */}
                        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                            {[{ icon: FileText, name: 'research.pdf' }, { icon: Globe, name: 'arxiv.org' }].map(s => (
                                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                                    <s.icon size={11} style={{ color: 'var(--text-muted)' }} /> {s.name}
                                </div>
                            ))}
                        </div>
                        {/* Chat */}
                        <div style={{ padding: '20px', minHeight: 200, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {DEMO_MESSAGES.slice(0, visibleMsg + 1).map((m, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: i === 0 ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ maxWidth: '88%', padding: '12px 16px', borderRadius: i === 0 ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: i === 0 ? 'var(--bg-elevated)' : 'var(--bg-active)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                                        {i === visibleMsg
                                            ? typed.split(/(\[[0-9]+\])/).map((p, j) =>
                                                /^\[[0-9]+\]$/.test(p)
                                                    ? <sup key={j} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 4, padding: '1px 5px', fontSize: 10, color: 'var(--text-secondary)', margin: '0 2px', fontFamily: "'JetBrains Mono', monospace" }}>{p.slice(1, -1)}</sup>
                                                    : <span key={j}>{p}</span>
                                            )
                                            : m.text.split(/(\[[0-9]+\])/).map((p, j) =>
                                                /^\[[0-9]+\]$/.test(p)
                                                    ? <sup key={j} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 4, padding: '1px 5px', fontSize: 10, color: 'var(--text-secondary)', margin: '0 2px', fontFamily: "'JetBrains Mono', monospace" }}>{p.slice(1, -1)}</sup>
                                                    : <span key={j}>{p}</span>
                                            )
                                        }
                                        {i === visibleMsg && typed.length < m.text.length && <span style={{ borderRight: '2px solid var(--text-secondary)', marginLeft: 2, animation: 'pulse 0.8s infinite' }} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Input bar */}
                        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', background: 'var(--bg-elevated)' }}>
                            <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Ask a question about your sources...</div>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ArrowRight size={14} color="#0a0a0a" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section id="how-it-works" style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '100px 48px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 72 }}>
                        <h2 style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 16, color: 'var(--text-primary)' }}>How it works</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>From document to insight in three simple steps</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
                        {STEPS.map((step, i) => (
                            <div key={step.num} style={{ position: 'relative', textAlign: 'center' }}>
                                {i < STEPS.length - 1 && (
                                    <div style={{ position: 'absolute', top: 32, left: 'calc(50% + 40px)', width: 'calc(100% - 80px)', height: 1, background: 'linear-gradient(90deg, var(--border) 0%, var(--border-light) 50%, var(--border) 100%)', zIndex: 0 }} />
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                                        <step.icon size={26} style={{ color: 'var(--text-primary)' }} />
                                    </div>
                                    <span style={{ fontSize: 48, fontWeight: 800, color: 'var(--border-light)', letterSpacing: '-0.04em', fontFamily: "'JetBrains Mono', monospace" }}>{step.num}</span>
                                    <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{step.title}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 260 }}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES GRID ── */}
            <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 48px' }}>
                <div style={{ textAlign: 'center', marginBottom: 64 }}>
                    <h2 style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 16, color: 'var(--text-primary)' }}>Everything you need</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 17 }}>Built to replicate and extend the best of NotebookLM</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    {FEATURES.map((f, i) => (
                        <div key={f.title} className="animate-fadeIn" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)', animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}
                            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border-light)'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }}
                            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border)'; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}
                        >
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                                <f.icon size={22} style={{ color: 'var(--text-primary)' }} />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>{f.title}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{ margin: '0 48px 80px', borderRadius: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-light)', padding: '80px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 50%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Layers size={28} style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <h2 style={{ fontSize: 40, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Start researching smarter</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 17, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
                        Create your first notebook, upload your sources, and start chatting with your documents in minutes.
                    </p>
                    <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: '#0a0a0a', padding: '16px 40px', borderRadius: 28, fontSize: 16, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 8px 30px rgba(255,255,255,0.15)' }}
                        onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 16px 40px rgba(255,255,255,0.25)'; }}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'none'; el.style.boxShadow = '0 8px 30px rgba(255,255,255,0.15)'; }}
                    >
                        Open NotebookLM <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={11} color="#0a0a0a" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>NotebookLM</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Powered by Ollama · Supabase · Next.js</p>
            </footer>
        </div>
    );
}
