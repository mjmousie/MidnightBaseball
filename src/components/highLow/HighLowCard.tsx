import React from 'react';
import { motion } from 'framer-motion';
import type { Card as CardType } from '../../types';

const SUIT_COLOR: Record<string, string> = {
  hearts:   'text-red-500',
  diamonds: 'text-blue-500',
  spades:   'text-slate-900',
  clubs:    'text-emerald-600',
};

const SUIT_SYMBOL: Record<string, string> = {
  hearts:   '♥',
  diamonds: '♦',
  spades:   '♠',
  clubs:    '♣',
};

interface HighLowCardProps {
  card: CardType;
  greenBorder?: boolean;
  redBorder?: boolean;
}

export function HighLowCard({ card, greenBorder, redBorder }: HighLowCardProps) {
  return (
    <div
      className="relative w-full aspect-[5/7]"
      style={{ perspective: '600px', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
      draggable={false}
      onDragStart={e => e.preventDefault()}
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
        }}
        initial={{ rotateY: card.faceUp ? 0 : 180 }}
        animate={{ rotateY: card.faceUp ? 0 : 180 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Front */}
        <div
          className={[
            'absolute inset-0 rounded-md border flex flex-col items-start justify-between p-0.5 sm:p-1 select-none',
            'bg-white shadow-md',
            greenBorder ? 'ring-2 ring-green-500 shadow-green-900/40 shadow-lg' : redBorder ? 'ring-2 ring-red-500 shadow-red-900/40 shadow-lg' : '',
            SUIT_COLOR[card.suit],
          ].join(' ')}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <span className="font-bold text-3xl leading-none">{card.rank}</span>
          <div className="absolute inset-0 flex items-center justify-center text-5xl select-none">
            {SUIT_SYMBOL[card.suit]}
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-md border flex items-center justify-center bg-gradient-to-br from-orange-600 to-orange-400 shadow-md"
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
