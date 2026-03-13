'use client';

import React, { useEffect, useRef } from 'react';
import { Source, SourceChunk } from '@/types';
import { X, FileText, Globe, AlignLeft, ChevronLeft } from 'lucide-react';

interface Props {
  source: Source | null;
  highlightChunk: SourceChunk | null;
  onClose: () => void;
}

export default function SourceViewer({ source, highlightChunk, onClose }: Props) {
  const highlightRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightChunk]);

  if (!source) return null;

  function getIcon() {
    if (source?.type === 'pdf') return <FileText size={15} style={{ color: 'var(--red)' }} />;
    if (source?.type === 'url') return <Globe size={15} style={{ color: 'var(--green)' }} />;
    return <AlignLeft size={15} style={{ color: 'var(--accent)' }} />;
  }

  function renderContent() {
    const text = source?.content || 'No content available for this source.';
    if (!highlightChunk) {
      return <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</p>;
    }

    const chunk = highlightChunk.content;
    const idx = text.indexOf(chunk);
    if (idx === -1) {
      return (
        <>
          <div style={{ background: 'var(--accent-glow)', border: '1px solid var(--chip-border)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 6, fontWeight: 700 }}>Referenced passage</p>
            <span ref={highlightRef} style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.8, background: 'var(--accent-surface)', borderRadius: 4, padding: '2px 0' }}>{chunk}</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{text}</p>
        </>
      );
    }

    const before = text.slice(0, idx);
    const highlighted = text.slice(idx, idx + chunk.length);
    const after = text.slice(idx + chunk.length);

    return (
      <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {before}
        <span ref={highlightRef} style={{ background: 'var(--accent-glow)', borderRadius: 3, padding: '2px 2px', color: 'var(--text-primary)', outline: '1px solid var(--accent)', outlineOffset: 1 }}>
          {highlighted}
        </span>
        {after}
      </p>
    );
  }

  return (
    <div className="animate-slideIn" style={{ width: 340, borderLeft: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 6, fontSize: 13 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ChevronLeft size={15} />
        </button>
        {getIcon()}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{source.name}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}>
          <X size={16} />
        </button>
      </div>

      {highlightChunk && (
        <div style={{ padding: '10px 16px', background: 'var(--accent-surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>↓ Scroll to highlighted passage</p>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
        {renderContent()}
      </div>
    </div>
  );
}
