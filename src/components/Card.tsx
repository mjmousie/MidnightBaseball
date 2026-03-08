import { motion } from 'framer-motion';
import type { Card as CardType } from '../types';

const SUIT_COLOR: Record<string, string> = {
  hearts:   'text-red-500',
  diamonds: 'text-red-500',
  spades:   'text-slate-900',
  clubs:    'text-slate-900',
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
  small?: boolean;
}

export function Card({ card, onClick, highlight, small }: CardProps) {
  // Fluid sizing: small cards for inactive players, larger for active
  const size = small
    ? 'w-9 h-12 sm:w-10 sm:h-14 text-xs'
    : 'w-10 h-14 sm:w-14 sm:h-20 text-xs';

  return (
    <div
      className={`relative ${size} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ perspective: '600px' }}
      onClick={onClick}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: card.faceUp ? 0 : 180 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {/* Front */}
        <div
          className={[
            'absolute inset-0 rounded-md border flex flex-col items-start justify-between p-0.5 sm:p-1',
            'bg-white shadow-md',
            highlight ? 'ring-2 ring-yellow-400' : '',
            card.isWild && card.faceUp ? 'ring-2 ring-purple-500 shadow-purple-300 shadow-md' : '',
            SUIT_COLOR[card.suit],
          ].join(' ')}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex flex-col items-center leading-none">
            <span className="font-bold">{card.rank}</span>
            <span>{SUIT_SYMBOL[card.suit]}</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center text-lg sm:text-2xl opacity-20 select-none">
            {SUIT_SYMBOL[card.suit]}
          </div>

          {card.isWild && (
            <div className="absolute top-0 right-0 bg-purple-500 text-white text-[6px] sm:text-[8px] font-bold rounded-bl rounded-tr px-0.5 sm:px-1">
              WILD
            </div>
          )}

          <div className="flex flex-col items-center leading-none self-end rotate-180">
            <span className="font-bold">{card.rank}</span>
            <span>{SUIT_SYMBOL[card.suit]}</span>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-md border flex items-center justify-center bg-gradient-to-br from-blue-800 to-blue-600 shadow-md"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="w-3/4 h-3/4 border-2 border-white/30 rounded opacity-50" />
        </div>
      </motion.div>
    </div>
  );
}
