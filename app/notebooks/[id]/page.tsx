'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Notebook, Source, SourceChunk, Note } from '@/types';
import SourcePanel from '@/components/workspace/SourcePanel';
import ChatPanel from '@/components/workspace/ChatPanel';
import RightPanel from '@/components/workspace/RightPanel';
import SourceViewer from '@/components/workspace/SourceViewer';
import { ChevronLeft, Share2, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NotebookWorkspace() {
  const { id } = useParams();
  const router = useRouter();
  const notebookId = id as string;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [highlightChunk, setHighlightChunk] = useState<SourceChunk | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [rightPanelWidth, setRightPanelWidth] = useState(340);
  const resizing = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [{ data: nb }, { data: src }, { data: nt }] = await Promise.all([
        supabase.from('notebooks').select('*').eq('id', notebookId).single(),
        supabase.from('sources').select('*').eq('notebook_id', notebookId).order('created_at'),
        supabase.from('notes').select('*').eq('notebook_id', notebookId).order('created_at', { ascending: false }),
      ]);
      if (!mounted) return;
      if (!nb) { router.push('/dashboard'); return; }
      setNotebook(nb);
      setTitleValue(nb.title);
      setSources(src || []);
      setNotes(nt || []);
      setLoading(false);
    }
    if (notebookId) load();
    return () => { mounted = false; };
  }, [notebookId, router]);

  async function saveTitle() {
    if (!titleValue.trim() || titleValue === notebook?.title) { setEditingTitle(false); return; }
    await supabase.from('notebooks').update({ title: titleValue }).eq('id', notebookId);
    setNotebook(nb => nb ? { ...nb, title: titleValue } : nb);
    setEditingTitle(false);
  }

  function handleCitationClick(chunk: SourceChunk) {
    const src = sources.find(s => s.id === chunk.source_id);
    if (src) { setSelectedSource(src); setHighlightChunk(chunk); }
  }

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    resizing.current = true;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    document.body.classList.add('resizing-panel');
  }

  function handleResize(e: MouseEvent): void {
    if (!resizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    setRightPanelWidth(Math.max(280, Math.min(600, newWidth)));
  }

  function stopResize(): void {
    resizing.current = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    document.body.classList.remove('resizing-panel');
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading notebook…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ height: 56, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, background: 'var(--bg-base)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ChevronLeft size={16} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #1a3a5c, #1e4976)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={13} style={{ color: 'var(--accent)' }} />
            </div>
            {editingTitle ? (
              <input autoFocus value={titleValue} onChange={e => setTitleValue(e.target.value)}
                onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent)', borderRadius: 6, padding: '3px 8px', color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, outline: 'none', minWidth: 200 }}
              />
            ) : (
              <span onClick={() => setEditingTitle(true)} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', cursor: 'text', padding: '3px 6px', borderRadius: 4 }}
                title="Click to rename"
              >{notebook?.title}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            <Share2 size={14} /> Share
          </button>
        </div>
      </header>

      {/* 3-panel body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Sources */}
        <SourcePanel
          notebookId={notebookId}
          sources={sources}
          onSourceAdded={s => setSources(prev => [...prev, s])}
          onSourceDeleted={id => setSources(prev => prev.filter(s => s.id !== id))}
          onSelectSource={s => { setSelectedSource(s); setHighlightChunk(null); }}
          selectedSourceId={selectedSource?.id}
        />

        {/* Center: Chat */}
        <ChatPanel
          notebookId={notebookId}
          sources={sources}
          onCitationClick={handleCitationClick}
          onSaveNote={(content, title) => {
            const cleaned = content.replace(/\*\*/g, '').replace(/【\d+[^\]]*】/g, '');
            supabase.from('notes').insert({ notebook_id: notebookId, title, content: cleaned }).select()
              .then(({ data }) => { if (data?.[0]) setNotes(prev => [data[0], ...prev]); });
          }}
        />

        {/* Resize Handle */}
        <div
          onMouseDown={startResize}
          style={{ width: 6, cursor: 'col-resize', background: 'var(--border)', flexShrink: 0, transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--border)'}
        />

        {/* Right: Notes / Studio — or Source Viewer overlay */}
        {selectedSource ? (
          <SourceViewer
            source={selectedSource}
            highlightChunk={highlightChunk}
            onClose={() => { setSelectedSource(null); setHighlightChunk(null); }}
          />
        ) : (
          <RightPanel
            notebookId={notebookId}
            sources={sources}
            notes={notes}
            width={rightPanelWidth}
            onNoteAdded={n => setNotes(prev => [n, ...prev])}
            onNoteDeleted={id => setNotes(prev => prev.filter(n => n.id !== id))}
          />
        )}
      </div>
    </div>
  );
}
