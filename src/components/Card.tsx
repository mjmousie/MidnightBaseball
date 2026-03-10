import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { Card as CardType } from '../types';

const SUIT_COLOR: Record<string, string> = {
  hearts:   'text-red-500',
  diamonds: 'text-blue-500',
  spades:   'text-slate-900',
  clubs:    'text-emerald-500',
};

const SUIT_SYMBOL: Record<string, string> = {
  hearts:   '♥',
  diamonds: '♦',
  spades:   '♠',
  clubs:    '♣',
};

interface CardProps {
  card: CardType;
  onClick?: () => void;
  highlight?: boolean;
}

export function Card({ card, onClick, highlight }: CardProps) {
  const controls = useAnimation();

  useEffect(() => {
    if (card.faceUp) {
      controls.start({
        rotateY: [180, 192, 168, 188, 172, 192, 180, 180, 0],
        rotateX: [0, -10, 6, -11, 8, -9, 0, 0, 0],
        scale:   [1,   1,   1,   1,   1,   1,   1.1,   1.1,   1],
        transition: {
          duration: 2.2,
          ease: 'easeInOut',
          times: [0, 0.06, 0.12, 0.18, 0.24, 0.30, 0.36, 0.55, 1],
        },
      });
    } else {
      controls.set({ rotateY: 180, scale: 1 });
    }
  }, [card.faceUp]);

  return (
    <div
      draggable={false}
      onDragStart={e => e.preventDefault()}
      style={{ perspective: '600px', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
      className={`relative w-full aspect-[5/7] ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      onTouchEnd={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined}
    >
      <motion.div
  className="relative w-full h-full"
  style={{
    transformStyle: 'preserve-3d',
    WebkitTransformStyle: 'preserve-3d',
  }}
    initial={{ rotateY: 180, scale: 1 }}
    animate={controls}
>
        {/* Front */}
        <div
          className={[
            'absolute inset-0 rounded-md border flex flex-col items-start justify-between p-0.5 sm:p-1 select-none',
            'bg-white shadow-md',
            highlight ? 'ring-2 ring-yellow-400' : '',
            card.isWild && card.faceUp ? 'ring-2 ring-orange-600 shadow-orange-300 shadow-md' : '',
            SUIT_COLOR[card.suit],
          ].join(' ')}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <span className="font-bold text-lg leading-none">{card.rank}</span>
          <div className="absolute inset-0 flex items-center justify-center text-3xl select-none">
            {SUIT_SYMBOL[card.suit]}
          </div>
          {card.isWild && (
            <div className="absolute top-0 right-0 bg-orange-600 text-white text-[6px] sm:text-[8px] font-bold rounded-bl rounded-tr px-0.5 sm:px-1">
              WILD
            </div>
          )}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-md border flex items-center justify-center bg-gradient-to-br from-orange-600 to-orange-500 shadow-md"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            WebkitTransform: 'rotateY(180deg)',
          }}
        >
          <div className="w-3/4 h-3/4 border-2 border-white/30 rounded opacity-50" />
        </div>
      </motion.div>
    </div>
  );
}
