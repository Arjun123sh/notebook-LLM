'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Source } from '@/types';
import { Plus, FileText, Globe, AlignLeft, Trash2, CheckSquare, Square, Upload, X, Loader2, ChevronDown } from 'lucide-react';

interface Props {
  notebookId: string;
  sources: Source[];
  onSourceAdded: (s: Source) => void;
  onSourceDeleted: (id: string) => void;
  onSelectSource: (s: Source) => void;
  selectedSourceId?: string;
}

export default function SourcePanel({ notebookId, sources, onSourceAdded, onSourceDeleted, onSelectSource, selectedSourceId }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  async function extractTextFromPDFClient(file: File): Promise<string> {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress('Extracting text locally...');
    try {
      let extractedText = '';
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDFClient(file);
      } else {
        extractedText = await file.text();
      }

      if (!extractedText.trim()) throw new Error('Could not extract text from file');

      setUploadProgress('Saving source...');
      const { data: sourceData, error } = await supabase.from('sources')
        .insert([{ notebook_id: notebookId, name: file.name, type: file.type === 'application/pdf' ? 'pdf' : 'text', content: extractedText.substring(0, 5000) }])
        .select();
      if (error || !sourceData) throw new Error(error?.message);
      const source = sourceData[0];

      setUploadProgress('Generating embeddings...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('notebookId', notebookId);
      formData.append('sourceId', source.id);
      formData.append('sourceName', file.name);
      formData.append('extractedText', extractedText);

      const res = await fetch('/api/upload-source', { method: 'POST', body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      // Fetch updated source with content
      const { data: updatedSource } = await supabase.from('sources').select('*').eq('id', source.id).single();
      onSourceAdded(updatedSource);
      setShowModal(false);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    setUploading(true);
    try {
      const name = pasteTitle.trim() || 'Pasted text';
      const { data, error } = await supabase.from('sources')
        .insert([{ notebook_id: notebookId, name, type: 'text', content: pasteText }])
        .select();
      if (error || !data) throw new Error(error?.message);
      const source = data[0];
      const blob = new Blob([pasteText], { type: 'text/plain' });
      const file = new File([blob], name + '.txt', { type: 'text/plain' });
      const fd = new FormData();
      fd.append('file', file); fd.append('notebookId', notebookId);
      fd.append('sourceId', source.id); fd.append('sourceName', name);
      await fetch('/api/upload-source', { method: 'POST', body: fd });

      // Fetch updated source with content
      const { data: updatedSource } = await supabase.from('sources').select('*').eq('id', source.id).single();
      onSourceAdded(updatedSource);
      setPasteText(''); setPasteTitle(''); setShowModal(false);
    } catch (err: any) { alert('Failed: ' + err.message); }
    finally { setUploading(false); }
  }

  async function handleUrlSubmit() {
    if (!urlInput.trim()) return;
    setUploading(true);
    try {
      const { data, error } = await supabase.from('sources')
        .insert([{ notebook_id: notebookId, name: urlInput, type: 'url', content: `Content from ${urlInput}` }])
        .select();
      if (error || !data) throw new Error(error?.message);
      onSourceAdded(data[0]); setUrlInput(''); setShowModal(false);
    } catch (err: any) { alert('Failed: ' + err.message); }
    finally { setUploading(false); }
  }

  async function deleteSource(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from('sources').delete().eq('id', id);
    onSourceDeleted(id);
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  function getIcon(type: string) {
    if (type === 'pdf') return <FileText size={15} style={{ color: 'var(--red)' }} />;
    if (type === 'url') return <Globe size={15} style={{ color: 'var(--green)' }} />;
    return <AlignLeft size={15} style={{ color: 'var(--accent)' }} />;
  }

  return (
    <>
      <div style={{ width: 280, borderRight: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sources</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 10, padding: '2px 7px' }}>{sources.length}</span>
          </div>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '9px 12px', borderRadius: 8, background: 'var(--accent-surface)', border: '1px solid var(--border)', color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <Plus size={15} /> Add source
          </button>
        </div>

        {/* Source list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          {sources.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>Add PDFs, text files, or URLs to get started</p>
            </div>
          ) : sources.map(src => (
            <div key={src.id} onClick={() => onSelectSource(src)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, background: selectedSourceId === src.id ? 'var(--bg-active)' : 'transparent', border: selectedSourceId === src.id ? '1px solid var(--border-light)' : '1px solid transparent', transition: 'all 0.1s' }}
              onMouseEnter={e => { if (selectedSourceId !== src.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (selectedSourceId !== src.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <button onClick={e => toggleSelect(src.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: selected.has(src.id) ? 'var(--accent)' : 'var(--text-muted)', padding: 0, flexShrink: 0 }}>
                {selected.has(src.id) ? <CheckSquare size={14} /> : <Square size={14} />}
              </button>
              {getIcon(src.type)}
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={src.name}>{src.name}</span>
              <button onClick={e => deleteSource(src.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, borderRadius: 4, opacity: 0, transition: 'opacity 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Source Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="animate-fadeIn" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, width: 520, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px' }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>Add source</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 6, padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', padding: '0 24px', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
              {(['upload', 'text', 'url'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                  {tab === 'upload' ? 'Upload file' : tab === 'text' ? 'Paste text' : 'Website URL'}
                </button>
              ))}
            </div>

            <div style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
              {activeTab === 'upload' && (
                <div>
                  <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer', background: 'var(--bg-surface)', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                    <p style={{ color: 'var(--text-primary)', marginBottom: 6, fontWeight: 500 }}>Drop a file or click to browse</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>PDF, TXT, MD, and more</p>
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileUpload} style={{ display: 'none' }} />
                  {uploading && (
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
                      <Loader2 size={16} className="animate-spin" /> {uploadProgress}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input value={pasteTitle} onChange={e => setPasteTitle(e.target.value)} placeholder="Source title (optional)" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                  <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste your text here…" rows={8} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                  <button onClick={handlePasteSubmit} disabled={uploading || !pasteText.trim()} style={{ background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: !pasteText.trim() ? 0.5 : 1 }}>
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : 'Add source'}
                  </button>
                </div>
              )}

              {activeTab === 'url' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                  <button onClick={handleUrlSubmit} disabled={uploading || !urlInput.trim()} style={{ background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: !urlInput.trim() ? 0.5 : 1 }}>
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : 'Add source'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
