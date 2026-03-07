'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDesignerStore } from '@/store/designerStore';

interface ScreenTipState {
  text: string;
  x: number;
  y: number;
  visible: boolean;
}

export const ScreenTip: React.FC = () => {
  const { designMode } = useDesignerStore();
  const isMoveTool = designMode === 'move';

  const [tip, setTip] = useState<ScreenTipState>({ text: '', x: 0, y: 0, visible: false });
  const lastTextRef = useRef('');
  const rafRef = useRef<number | null>(null);
  const pendingPosRef = useRef<{ x: number; y: number } | null>(null);

  const flushTipPosition = useCallback(() => {
    if (!pendingPosRef.current) return;
    const next = pendingPosRef.current;
    pendingPosRef.current = null;
    setTip(prev => ({ ...prev, x: next.x + 15, y: next.y + 20 }));
  }, []);

  const showTip = useCallback((text: string, x: number, y: number) => {
    if (text === lastTextRef.current && tip.visible) {
      pendingPosRef.current = { x, y };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          flushTipPosition();
        });
      }
      return;
    }
    lastTextRef.current = text;
    setTip({ text, x: x + 15, y: y + 20, visible: true });
  }, [tip.visible, flushTipPosition]);

  const hideTip = useCallback(() => {
    setTip(prev => ({ ...prev, visible: false }));
    lastTextRef.current = '';
  }, []);

  useEffect(() => {
    if (!isMoveTool) {
      hideTip();
      return;
    }

    const handleScreenTip = (e: CustomEvent<{ text: string; x: number; y: number }>) => {
      if (e.detail.text) {
        showTip(e.detail.text, e.detail.x, e.detail.y);
      } else {
        hideTip();
      }
    };

    window.addEventListener('screentip' as any, handleScreenTip);
    return () => {
      window.removeEventListener('screentip' as any, handleScreenTip);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isMoveTool, showTip, hideTip]);

  if (!isMoveTool || !tip.visible || !tip.text) return null;

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(${tip.x}px, ${tip.y}px)`,
        background: '#FFFFCC',
        border: '1px solid #808080',
        padding: '2px 6px',
        font: '11px sans-serif',
        color: '#000',
        pointerEvents: 'none',
        zIndex: 1000,
        whiteSpace: 'nowrap',
      }}
    >
      {tip.text}
    </div>
  );
};

export function emitScreenTip(text: string, x: number, y: number): void {
  window.dispatchEvent(new CustomEvent('screentip', { detail: { text, x, y } }));
}

