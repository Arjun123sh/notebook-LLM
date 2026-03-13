'use client';

import React, { useMemo } from 'react';
import { Source } from '@/types';
import { GitBranch, Box, Circle } from 'lucide-react';

interface Props {
    sources: Source[];
    onClose: () => void;
}

export default function RelationshipGraph({ sources, onClose }: Props) {
    // Generate mock nodes and links for visualization
    const data = useMemo(() => {
        const nodes: any[] = sources.map((s, i) => ({
            id: s.id,
            name: s.name,
            type: 'source',
            x: 100 + Math.random() * 400,
            y: 100 + Math.random() * 300
        }));

        // Add some "Concepts" extracted from sources
        const concepts = [
            "Market Trends", "Architecture", "User Experience",
            "Technical Debt", "Scalability", "Security"
        ];

        const conceptNodes = concepts.map((c, i) => ({
            id: `concept-${i}`,
            name: c,
            type: 'concept',
            x: 150 + Math.random() * 300,
            y: 150 + Math.random() * 200
        }));

        const links: any[] = [];
        nodes.forEach(n => {
            // Link each source to 1-2 random concepts
            const numLinks = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < numLinks; i++) {
                const target = conceptNodes[Math.floor(Math.random() * conceptNodes.length)];
                links.push({ source: n, target });
            }
        });

        return { nodes: [...nodes, ...conceptNodes], links };
    }, [sources]);

    return (
        <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            height: 500
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Knowledge Map</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Visualizing connections between sources and concepts</p>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            <div style={{ flex: 1, position: 'relative', background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <svg width="100%" height="100%" style={{ cursor: 'grab' }}>
                    {/* Render Links */}
                    {data.links.map((link, i) => (
                        <line
                            key={i}
                            x1={link.source.x} y1={link.source.y}
                            x2={link.target.x} y2={link.target.y}
                            stroke="var(--border)"
                            strokeWidth="1"
                            strokeOpacity="0.5"
                        />
                    ))}

                    {/* Render Concept Nodes */}
                    {data.nodes.filter(n => n.type === 'concept').map(node => (
                        <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                            <circle r="6" fill="var(--bg-elevated)" stroke="var(--text-muted)" strokeWidth="2" />
                            <text dy="20" textAnchor="middle" style={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 500 }}>{node.name}</text>
                        </g>
                    ))}

                    {/* Render Source Nodes */}
                    {data.nodes.filter(n => n.type === 'source').map(node => (
                        <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                            <rect x="-40" y="-15" width="80" height="30" rx="6" fill="var(--accent-surface)" stroke="var(--accent)" strokeWidth="1" />
                            <text dy="4" textAnchor="middle" style={{ fontSize: 10, fill: 'var(--text-primary)', fontWeight: 600 }}>
                                {node.name.length > 12 ? node.name.substring(0, 10) + '...' : node.name}
                            </text>
                            <circle r="3" cx="0" cy="-15" fill="var(--accent)" />
                        </g>
                    ))}
                </svg>

                <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-surface)', border: '1px solid var(--accent)' }} /> Source
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--text-muted)' }} /> Concept
                    </div>
                </div>
            </div>
        </div>
    );
}

const X = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
