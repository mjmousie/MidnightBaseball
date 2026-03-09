import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../types';
import { Card } from './Card';

interface PlayerHandProps {
  player: Player;
  isActive: boolean;
  onFlip?: (cardIndex: number) => void;
}

export function PlayerHand({ player, isActive, onFlip }: PlayerHandProps) {
  const bestFiveIds = new Set(
    player.evaluatedHand?.bestFive.map((c) => c.id) ?? []
  );

  return (
    <div
      className={[
        'rounded-xl p-3 sm:p-4 transition-colors duration-300 min-w-0',
        isActive
          ? 'bg-yellow-50 ring-2 ring-yellow-400 shadow-lg shadow-yellow-100'
          : 'bg-white/60 ring-1 ring-slate-200',
      ].join(' ')}
    >
      {/* Player header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={[
            'w-2 h-2 flex-shrink-0 rounded-full',
            isActive ? 'bg-yellow-400 animate-pulse' : 'bg-slate-300',
          ].join(' ')} />
          <span className="font-semibold text-slate-800 text-sm truncate">{player.name}</span>
          {player.status === 'done' && (
            <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Done</span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {player.evaluatedHand && player.visibleCards.length > 0 && (
            <motion.span
              key={player.evaluatedHand.label}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex-shrink-0 ml-1 text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full"
            >
              {player.evaluatedHand.label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Cards — fill the container width evenly, never overflow */}
      <div className="flex gap-1 min-w-0 w-full">
        {player.hand.map((card, idx) => (
          <div key={card.id} className="flex-1 min-w-0">
            <Card
              card={card}
              highlight={card.faceUp && bestFiveIds.has(card.id)}
              onClick={isActive && !card.faceUp ? () => onFlip?.(idx) : undefined}
            />
          </div>
        ))}
      </div>

      <div className="mt-1.5 text-xs text-slate-400">
        {player.hand.length} cards · {player.visibleCards.length} visible
      </div>
    </div>
  );
}
