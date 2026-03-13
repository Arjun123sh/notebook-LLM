'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Message, Source, SourceChunk, Citation } from '@/types';
import { supabase } from '@/lib/supabase';
import {
  Send, Loader2, Sparkles, Bookmark,
  ChevronDown, ChevronUp, ThumbsUp,
  ThumbsDown, Copy, Plus, X, Brain, Globe, Search
} from 'lucide-react';
import { CONFIG } from '@/lib/config';

// --- Types ---

interface ChatPanelProps {
  notebookId: string;
  sources: Source[];
  onCitationClick: (chunk: SourceChunk) => void;
  onSaveNote: (content: string, title: string) => void;
}

// --- Sub-components ---

const ChatToast = memo(({ message, type }: { message: string, type: 'success' | 'error' }) => (
  <div style={{
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    background: type === 'success' ? 'var(--green)' : 'var(--red)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }}>
    {message}
  </div>
));
ChatToast.displayName = 'ChatToast';

const NotebookGuide = memo(({ sources, suggested, onSend }: { sources: Source[], suggested: string[], onSend: (q: string) => void }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px', textAlign: 'center' }}>
    <div style={{
      width: 56,
      height: 56,
      borderRadius: 16,
      background: 'var(--accent-surface)',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20
    }}>
      <Sparkles size={24} style={{ color: 'var(--accent)' }} />
    </div>
    <h2 style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>Notebook guide</h2>
    <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 32, maxWidth: 420, lineHeight: 1.7 }}>
      {sources.length === 0
        ? 'Add sources to your notebook, then start asking questions about them.'
        : 'Ask a question about your sources, or try one of these:'}
    </p>
    {sources.length > 0 && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 480 }}>
        {suggested.map((q, i) => (
          <button
            key={i}
            onClick={() => onSend(q)}
            style={{
              textAlign: 'left',
              padding: '12px 18px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1.5,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
          >
            {q}
          </button>
        ))}
      </div>
    )}
  </div>
));
NotebookGuide.displayName = 'NotebookGuide';

const CitationChips = memo(({ citations, onCitationClick }: { citations: Citation[], onCitationClick: (c: Citation) => void }) => (
  <div className="animate-fadeIn" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
    {citations.map(c => (
      <button
        key={c.index}
        onClick={() => onCitationClick(c)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          background: 'var(--chip-bg)',
          border: '1px solid var(--chip-border)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--text-primary)',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>[{c.index}]</span> {c.sourceName}
      </button>
    ))}
  </div>
));
CitationChips.displayName = 'CitationChips';

const MessageItem = memo(({
  msg,
  feedback,
  expanded,
  onToggleCitations,
  onFeedback,
  onCopy,
  onSaveNote,
  onCitationClick
}: {
  msg: Message,
  feedback?: 'like' | 'dislike',
  expanded: boolean,
  onToggleCitations: (id: string) => void,
  onFeedback: (id: string, type: 'like' | 'dislike') => void,
  onCopy: (text: string) => void,
  onSaveNote: (text: string) => void,
  onCitationClick: (c: Citation) => void
}) => {
  const isModel = msg.role === 'model';

  const renderContent = (content: string) => {
    const cleaned = content.replace(/\*\*/g, '').replace(/【\d+[^\]]*】/g, '');
    const parts = cleaned.split(/(\[[0-9]+\])/g);
    return parts.map((part, i) => {
      if (/^\[[0-9]+\]$/.test(part)) {
        const n = parseInt(part.slice(1, -1));
        return (
          <sup key={i} style={{
            background: 'var(--accent-surface)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '1px 5px',
            fontSize: 10,
            color: 'var(--accent)',
            cursor: 'pointer',
            margin: '0 1px',
            fontWeight: 600
          }}>
            {n}
          </sup>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: msg.role === 'user' ? 'var(--bg-elevated)' : 'var(--accent-surface)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {msg.role === 'user' ? (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>U</span>
        ) : (
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
        )}
      </div>

      <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
        <div style={{
          padding: '12px 18px',
          borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
          background: msg.role === 'user' ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          fontSize: 14,
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          {isModel ? renderContent(msg.content) : msg.content}
        </div>

        {isModel && msg.citations && msg.citations.length > 0 && (
          <div>
            <button onClick={() => onToggleCitations(msg.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: '4px 0', fontWeight: 500 }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {msg.citations.length} source{msg.citations.length !== 1 ? 's' : ''} cited
            </button>
            {expanded && <CitationChips citations={msg.citations} onCitationClick={onCitationClick} />}
          </div>
        )}

        {isModel && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={() => onFeedback(msg.id, 'like')} title="Good response"
              style={{ display: 'flex', alignItems: 'center', padding: '6px', background: 'none', border: '1px solid transparent', borderRadius: 8, color: feedback === 'like' ? 'var(--green)' : 'var(--text-muted)', transition: 'all 0.2s' }}>
              <ThumbsUp size={14} />
            </button>
            <button onClick={() => onFeedback(msg.id, 'dislike')} title="Bad response"
              style={{ display: 'flex', alignItems: 'center', padding: '6px', background: 'none', border: '1px solid transparent', borderRadius: 8, color: feedback === 'dislike' ? 'var(--red)' : 'var(--text-muted)', transition: 'all 0.2s' }}>
              <ThumbsDown size={14} />
            </button>
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
            <button onClick={() => onCopy(msg.content)} title="Copy"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
              <Copy size={13} /> Copy
            </button>
            <button onClick={() => onSaveNote(msg.content)} title="Save as note"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
              <Bookmark size={13} /> Save note
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
MessageItem.displayName = 'MessageItem';

const SuggestedQuestionChips = memo(({ questions, onSelect }: { questions: string[], onSelect: (q: string) => void }) => {
  if (questions.length === 0) return null;
  return (
    <div style={{ maxWidth: 780, margin: '0 auto 12px' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        Try asking
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {questions.slice(0, 5).map((q, i) => (
          <button key={i} onClick={() => onSelect(q)}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              fontSize: 12,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
});
SuggestedQuestionChips.displayName = 'SuggestedQuestionChips';

// --- Main Component ---

export default function ChatPanel({ notebookId, sources, onCitationClick, onSaveNote }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Record<string, 'like' | 'dislike' | undefined>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(CONFIG.OLLAMA.CHAT_MODEL);
  const [useWeb, setUseWeb] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // --- Handlers ---

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleFeedback = useCallback((msgId: string, type: 'like' | 'dislike') => {
    const currentFeedback = feedback[msgId];
    const newFeedback = currentFeedback === type ? undefined : type;
    setFeedback(prev => ({ ...prev, [msgId]: newFeedback }));

    const msg = messages.find(m => m.id === msgId);
    if (msg && newFeedback) {
      supabase.from('chat_feedback').insert({
        message_id: msgId,
        notebook_id: notebookId,
        feedback_type: newFeedback,
        message_content: msg.content
      });
    }
  }, [feedback, messages, notebookId]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text.replace(/\*\*/g, '').replace(/【\d+[^\]]*】/g, ''));
    showToast('Copied to clipboard!');
  }, [showToast]);

  const fetchSuggestedQuestions = useCallback(async (lastContent: string) => {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'related-questions',
          notebookId,
          context: lastContent,
          model: selectedModel
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!data.content) return;

      const rawLines = data.content.split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 10);

      const questions = rawLines
        .filter((line: string) => {
          const lower = line.toLowerCase();
          return !lower.includes('question') &&
            !lower.includes('questions') &&
            !lower.includes('here are') &&
            !lower.includes('follow-up') &&
            !lower.includes('based on') &&
            !lower.startsWith('http') &&
            !/^[\d\-\*\•\.\s]+$/.test(line);
        })
        .slice(0, 5);

      if (questions.length > 0) {
        setSuggestedQuestions(questions);
      } else if (rawLines.length > 0) {
        setSuggestedQuestions(rawLines.slice(0, 5));
      }
    } catch (e) {
      console.error('Failed to fetch suggested questions:', e);
    }
  }, [notebookId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    setSuggestedQuestions([]);
    const msgId = crypto.randomUUID();
    const userMsg: Message = { id: msgId, role: 'user', content: text, createdAt: new Date(), notebook_id: notebookId };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    await supabase.from('chat_messages').insert({ id: msgId, notebook_id: notebookId, role: 'user', content: text });

    try {
      let context = '';
      let webSupplement = '';

      if (useWeb) {
        setIsSearchingWeb(true);
        try {
          const webRes = await fetch('/api/search-web', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text }),
          });
          const { results } = await webRes.json();
          webSupplement = results.map((r: any) => `[Web: ${r.title}] ${r.snippet}`).join('\n\n');
        } catch (e) {
          console.error('Web search failed', e);
        } finally {
          setIsSearchingWeb(false);
        }
      }

      let matches = [];
      let searchError = '';

      try {
        const searchRes = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text, notebookId }),
        });
        const searchData = await searchRes.json();

        if (searchRes.ok) {
          matches = searchData.matches || [];
        } else {
          searchError = searchData.error;
          console.warn('Search failed:', searchError);
        }
      } catch (e) {
        console.error('Search request failed', e);
      }

      const localContext = matches
        .map((m: any) => `[Source: ${sources.find(s => s.id === m.sourceId)?.name || 'Source'}] ${m.content}`)
        .join('\n\n') || '';

      context = localContext;
      if (webSupplement) {
        context = `REAL-TIME WEB DATA:\n${webSupplement}\n\nLOCAL SOURCES:\n${localContext || (searchError ? '[Error: Search unavailable]' : '[No results]')}`;
      } else if (!localContext && searchError) {
        context = `[NOTE: System was unable to retrieve source context: ${searchError}]`;
      }

      const citations: Citation[] = matches.map((m: any, i: number) => ({
        index: i + 1,
        content: m.content,
        sourceId: m.sourceId,
        sourceName: sources.find(s => s.id === m.sourceId)?.name || 'Source',
        chunkId: m.id,
      }));

      const chatRes = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, context, model: selectedModel }),
      });
      const chatData = await chatRes.json();

      if (!chatRes.ok) {
        throw new Error(chatData.error || 'Chat failed');
      }

      const { content } = chatData;

      const modelMsgId = crypto.randomUUID();
      const modelMsg: Message = {
        id: modelMsgId,
        role: 'model',
        content: content || "I couldn't find relevant information in your sources.",
        citations: citations.length > 0 ? citations : undefined,
        createdAt: new Date(),
        notebook_id: notebookId,
      };

      setMessages(prev => [...prev, modelMsg]);

      await supabase.from('chat_messages').insert({
        id: modelMsgId,
        notebook_id: notebookId,
        role: 'model',
        content: modelMsg.content,
        citations: modelMsg.citations
      });

      fetchSuggestedQuestions(modelMsg.content);
    } catch (err) {
      console.error('Error in sendMessage:', err);
      const errorId = crypto.randomUUID();
      const errMsg: Message = { id: errorId, role: 'model', content: 'An error occurred. Please try again.', createdAt: new Date(), notebook_id: notebookId };
      setMessages(prev => [...prev, errMsg]);
      await supabase.from('chat_messages').insert({ id: errorId, notebook_id: notebookId, role: 'model', content: errMsg.content });
    } finally {
      setLoading(false);
    }
  }, [loading, notebookId, sources, fetchSuggestedQuestions, useWeb, selectedModel]);

  const toggleCitations = useCallback((msgId: string) => {
    setExpandedCitations(prev => {
      const s = new Set(prev);
      s.has(msgId) ? s.delete(msgId) : s.add(msgId);
      return s;
    });
  }, []);

  const handleCitationClickBase = useCallback((citation: Citation) => {
    onCitationClick({
      id: citation.chunkId || '',
      source_id: citation.sourceId,
      notebook_id: notebookId,
      content: citation.content,
      metadata: { sourceName: citation.sourceName }
    });
  }, [onCitationClick, notebookId]);

  // --- Effects ---

  useEffect(() => {
    async function loadInitialData() {
      const [msgData, feedbackData] = await Promise.all([
        supabase.from('chat_messages').select('*').eq('notebook_id', notebookId).order('created_at', { ascending: true }),
        supabase.from('chat_feedback').select('message_id, feedback_type').eq('notebook_id', notebookId)
      ]);

      if (msgData.data) {
        setMessages(msgData.data.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          citations: m.citations,
          createdAt: new Date(m.created_at),
          notebook_id: m.notebook_id
        })));
      }

      if (feedbackData.data) {
        const feedbackMap: Record<string, 'like' | 'dislike'> = {};
        feedbackData.data.forEach(f => { feedbackMap[f.message_id] = f.feedback_type as 'like' | 'dislike'; });
        setFeedback(feedbackMap);
      }
    }
    loadInitialData();
  }, [notebookId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const defaultQuestions = sources.length > 0 ? [
    `What are the key topics in ${sources[0]?.name || 'these sources'}?`,
    'Summarize the main points from all sources',
    'What are the most important concepts covered?',
    'What questions does this material leave unanswered?',
    'Create a brief overview of the content'
  ] : [];

  const displayQuestions = suggestedQuestions.length > 0 ? suggestedQuestions : (messages.length === 0 ? defaultQuestions : []);

  const isEmpty = messages.length === 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden', minWidth: 0, position: 'relative' }}>
      {toast && <ChatToast message={toast.message} type={toast.type} />}

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: isEmpty ? 0 : '32px 0' }}>
        {isEmpty ? (
          <NotebookGuide sources={sources} suggested={defaultQuestions} onSend={sendMessage} />
        ) : (
          <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>
            {messages.map(msg => (
              <MessageItem
                key={msg.id}
                msg={msg}
                feedback={feedback[msg.id]}
                expanded={expandedCitations.has(msg.id)}
                onToggleCitations={toggleCitations}
                onFeedback={handleFeedback}
                onCopy={copyToClipboard}
                onSaveNote={(content) => onSaveNote(content, 'Note from chat')}
                onCitationClick={handleCitationClickBase}
              />
            ))}

            {loading && (
              <div className="animate-fadeIn" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ padding: '14px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px 20px 20px 20px', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'block', animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        padding: '24px 32px',
        borderTop: isEmpty ? 'none' : '1px solid var(--border)',
        background: 'var(--bg-base)',
        boxShadow: isEmpty ? 'none' : '0 -4px 24px rgba(0,0,0,0.02)'
      }}>
        <SuggestedQuestionChips
          questions={suggestedQuestions.length > 0 ? suggestedQuestions : (isEmpty ? [] : [])}
          onSelect={(q) => { setInput(q); inputRef.current?.focus(); }}
        />

        <div style={{
          maxWidth: 780,
          margin: '0 auto',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8 }}>
            <Brain size={14} style={{ color: 'var(--accent)' }} />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', cursor: 'pointer' }}
            >
              {CONFIG.OLLAMA.SUPPORTED_MODELS.map(m => (
                <option key={m.id} value={m.id} title={m.desc}>{m.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setUseWeb(!useWeb)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: useWeb ? 'var(--accent-surface)' : 'var(--bg-surface)',
              border: `1px solid ${useWeb ? 'var(--accent)' : 'var(--border)'}`,
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Globe size={14} style={{ color: useWeb ? 'var(--accent)' : 'var(--text-muted)' }} />
            <span style={{ fontSize: 12, color: useWeb ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: useWeb ? 600 : 400 }}>
              {useWeb ? 'Web Search ON' : 'Web Search OFF'}
            </span>
          </button>

          {isSearchingWeb && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent)' }}>
              <Loader2 size={12} className="animate-spin" />
              <span>Researching web...</span>
            </div>
          )}
        </div>

        <div style={{
          maxWidth: 780,
          margin: '0 auto',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-end',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '12px 16px',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Start typing to chat with your sources..."
            aria-label="Chat input"
            rows={1}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              maxHeight: 120,
              overflowY: 'auto'
            }}
            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg-elevated)',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              flexShrink: 0
            }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            ) : (
              <Send size={18} style={{ color: input.trim() ? '#fff' : 'var(--text-muted)' }} />
            )}
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
          NotebookLM can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
