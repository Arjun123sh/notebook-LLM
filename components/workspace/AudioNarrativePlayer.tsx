'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface AudioNarrativePlayerProps {
    script: string;
    onClose: () => void;
}

interface ScriptSegment {
    speaker: 'ALEX' | 'SAM';
    text: string;
}

export default function AudioNarrativePlayer({ script, onClose }: AudioNarrativePlayerProps) {
    const [segments, setSegments] = useState<ScriptSegment[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);

    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        // Parse script into segments
        const lines = script.split('\n');
        const parsed: ScriptSegment[] = [];
        let currentSpeaker: 'ALEX' | 'SAM' | null = null;
        let currentText = '';

        lines.forEach(line => {
            const alexMatch = line.match(/^ALEX:\s*(.*)/i);
            const samMatch = line.match(/^SAM:\s*(.*)/i);

            if (alexMatch) {
                if (currentSpeaker && currentText) parsed.push({ speaker: currentSpeaker, text: currentText.trim() });
                currentSpeaker = 'ALEX';
                currentText = alexMatch[1];
            } else if (samMatch) {
                if (currentSpeaker && currentText) parsed.push({ speaker: currentSpeaker, text: currentText.trim() });
                currentSpeaker = 'SAM';
                currentText = samMatch[1];
            } else if (currentSpeaker) {
                currentText += ' ' + line.trim();
            }
        });
        if (currentSpeaker && currentText) parsed.push({ speaker: currentSpeaker, text: currentText.trim() });
        setSegments(parsed);

        synthRef.current = window.speechSynthesis;
        return () => {
            synthRef.current?.cancel();
        };
    }, [script]);

    const playSegment = (index: number) => {
        if (!synthRef.current || !segments[index]) return;

        synthRef.current.cancel();
        const segment = segments[index];
        const utterance = new SpeechSynthesisUtterance(segment.text);

        // Voice selection logic
        const voices = synthRef.current.getVoices();
        if (segment.speaker === 'ALEX') {
            // Try to find a deeper/male voice for Alex
            utterance.voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Male')) || voices[0];
            utterance.pitch = 0.9;
            utterance.rate = 1.0;
        } else {
            // Try to find a lighter/female voice for Sam
            utterance.voice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Female')) || voices[1];
            utterance.pitch = 1.2;
            utterance.rate = 1.05;
        }

        utterance.volume = muted ? 0 : volume;

        utterance.onend = () => {
            if (index < segments.length - 1) {
                setCurrentIndex(index + 1);
                playSegment(index + 1);
            } else {
                setIsPlaying(false);
                setProgress(100);
            }
        };

        utterance.onboundary = (event) => {
            // Simple progress simulation
            const totalLength = segments.reduce((acc, s) => acc + s.text.length, 0);
            const completedLength = segments.slice(0, index).reduce((acc, s) => acc + s.text.length, 0);
            const segmentProgress = (event.charIndex / segment.text.length) * (segment.text.length / totalLength);
            setProgress(((completedLength / totalLength) + segmentProgress) * 100);
        };

        utterRef.current = utterance;
        synthRef.current.speak(utterance);
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (isPlaying) {
            synthRef.current?.pause();
            setIsPlaying(false);
        } else {
            if (synthRef.current?.paused) {
                synthRef.current.resume();
                setIsPlaying(true);
            } else {
                playSegment(currentIndex);
            }
        }
    };

    const reset = () => {
        synthRef.current?.cancel();
        setCurrentIndex(0);
        setProgress(0);
        setIsPlaying(false);
    };

    return (
        <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Audio Overview</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {segments.length > 0 ? `Deep dive conversation with Alex & Sam` : `Generating narration...`}
                    </p>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            <div style={{ position: 'relative', height: 4, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 0.2s linear' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
                <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <SkipBack size={24} />
                </button>
                <button onClick={togglePlay} style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }}>
                    {isPlaying ? <Pause size={28} color="#000" /> : <Play size={28} color="#000" style={{ marginLeft: 4 }} />}
                </button>
                <button onClick={() => setCurrentIndex(Math.min(segments.length - 1, currentIndex + 1))} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <SkipForward size={24} />
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setMuted(!muted)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                    type="range"
                    min="0" max="1" step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent)', height: 4 }}
                />
                <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <RotateCcw size={18} />
                </button>
            </div>

            {segments[currentIndex] && (
                <div className="animate-fadeIn" style={{
                    padding: '16px',
                    background: 'var(--bg-active)',
                    borderRadius: 12,
                    borderLeft: `4px solid ${segments[currentIndex].speaker === 'ALEX' ? 'var(--accent)' : 'var(--text-muted)'}`
                }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        {segments[currentIndex].speaker} is speaking...
                    </span>
                    <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                        "{segments[currentIndex].text}"
                    </p>
                </div>
            )}
        </div>
    );
}

const X = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
