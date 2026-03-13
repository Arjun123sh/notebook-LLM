'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Notebook } from '@/types';
import { Plus, BookOpen, MoreVertical, Trash2, Pencil, Search, X, Loader2, FileText, FolderOpen, Clock, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotebooks();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchNotebooks() {
    setLoading(true);
    const { data } = await supabase.from('notebooks').select('*').order('created_at', { ascending: false });
    if (data) setNotebooks(data);
    setLoading(false);
  }

  async function createNotebook() {
    setCreating(true);
    const title = 'Untitled notebook';
    const { data, error } = await supabase.from('notebooks').insert([{ title }]).select();
    if (error) { alert('Error: ' + error.message); setCreating(false); return; }
    if (data?.[0]) setNotebooks(prev => [data[0], ...prev]);
    setCreating(false);
  }

  async function deleteNotebook(id: string) {
    setMenuOpen(null);
    await supabase.from('notebooks').delete().eq('id', id);
    setNotebooks(prev => prev.filter(n => n.id !== id));
  }

  async function renameNotebook() {
    if (!renaming) return;
    await supabase.from('notebooks').update({ title: renaming.title }).eq('id', renaming.id);
    setNotebooks(prev => prev.map(n => n.id === renaming.id ? { ...n, title: renaming.title } : n));
    setRenaming(null);
    setMenuOpen(null);
  }

  const filtered = notebooks.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

  function formatDate(d: string) {
    const date = new Date(d);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Top nav */}
      <nav style={{ height: 64, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'var(--bg-surface)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(255,255,255,0.1)' }}>
            <BookOpen size={14} color="#0a0a0a" strokeWidth={3} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>NotebookLM</span>
        </Link>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', padding: '8px 12px', borderRadius: 8, transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--text-primary)'; (e.target as HTMLElement).style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--text-secondary)'; (e.target as HTMLElement).style.background = 'transparent'; }}
        >
          <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to home
        </Link>
      </nav>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>My notebooks</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{notebooks.length} notebook{notebooks.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notebooks..."
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px 10px 42px', color: 'var(--text-primary)', fontSize: 14, width: 260, outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>
            {/* New notebook */}
            <button
              onClick={createNotebook}
              disabled={creating}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: '#0a0a0a', borderRadius: 22, padding: '10px 22px', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 2px 10px rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { if (!creating) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,255,255,0.2)'; }}}
              onMouseLeave={e => { if (!creating) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(255,255,255,0.1)'; }}}
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              New notebook
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 100, paddingBottom: 60 }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--border)' }}>
              <FolderOpen size={34} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              {search ? 'No notebooks found' : 'No notebooks yet'}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 15 }}>
              {search ? 'Try a different search term.' : 'Create your first notebook to get started!'}
            </p>
            {!search && (
              <button onClick={createNotebook} style={{ background: 'var(--accent)', color: '#0a0a0a', borderRadius: 22, padding: '12px 28px', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.15s', boxShadow: '0 4px 16px rgba(255,255,255,0.15)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,255,255,0.15)'; }}
              >
                <Plus size={16} /> Create notebook
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
            {filtered.map((nb, i) => (
              <div key={nb.id} className="animate-fadeIn" style={{ position: 'relative', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', animationDelay: `${i * 0.04}s`, animationFillMode: 'both' }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border-light)'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border)'; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}
              >
                <Link href={`/notebooks/${nb.id}`} style={{ display: 'block', padding: 24, textDecoration: 'none' }}>
                  {/* Notebook icon */}
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid var(--border-light)' }}>
                    <BookOpen size={24} style={{ color: 'var(--text-primary)' }} />
                  </div>
                  {renaming?.id === nb.id ? (
                    <input
                      autoFocus
                      value={renaming.title}
                      onChange={e => setRenaming({ ...renaming, title: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') renameNotebook(); if (e.key === 'Escape') setRenaming(null); }}
                      onBlur={renameNotebook}
                      onClick={e => e.preventDefault()}
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--text-muted)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 15, fontWeight: 500, width: '100%', outline: 'none' }}
                    />
                  ) : (
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nb.title}</h3>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                    <Clock size={12} /> {formatDate(nb.created_at)}
                  </div>
                </Link>
                {/* 3-dot menu */}
                <button
                  onClick={e => { e.preventDefault(); setMenuOpen(menuOpen === nb.id ? null : nb.id); }}
                  style={{ position: 'absolute', top: 14, right: 14, padding: 8, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <MoreVertical size={18} />
                </button>

                {menuOpen === nb.id && (
                  <div ref={menuRef} className="animate-fadeIn" style={{ position: 'absolute', top: 48, right: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', zIndex: 10, minWidth: 170, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                    <button onClick={() => { setRenaming({ id: nb.id, title: nb.title }); setMenuOpen(null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Pencil size={14} /> Rename
                    </button>
                    <button onClick={() => deleteNotebook(nb.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 14, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
