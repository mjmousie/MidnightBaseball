import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../types';
import { Card } from './Card';

interface PlayerHandProps {
  player: Player;
  isActive: boolean;
  onFlip?: () => void;
}

export function PlayerHand({ player, isActive, onFlip }: PlayerHandProps) {
  const bestFiveIds = new Set(
    player.evaluatedHand?.bestFive.map((c) => c.id) ?? []
  );

  return (
    <motion.div
      className={[
        'rounded-xl p-3 sm:p-4 transition-all duration-300',
        isActive
          ? 'bg-yellow-50 ring-2 ring-yellow-400 shadow-lg shadow-yellow-100'
          : 'bg-white/60 ring-1 ring-slate-200',
      ].join(' ')}
      layout
    >
      {/* Player header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
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

        {player.evaluatedHand && player.visibleCards.length > 0 && (
          <motion.span
            key={player.evaluatedHand.label}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 ml-1 text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full"
          >
            {player.evaluatedHand.label}
          </motion.span>
        )}
      </div>

      {/* Cards — scrollable row on mobile */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-1 sm:gap-2 flex-nowrap sm:flex-wrap">
          <AnimatePresence>
            {player.hand.map((card, idx) => (
              <motion.div
                key={card.id}
                className="flex-shrink-0"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card
                  card={card}
                  highlight={card.faceUp && bestFiveIds.has(card.id)}
                  onClick={isActive && !card.faceUp ? onFlip : undefined}
                  small={!isActive}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-1.5 text-xs text-slate-400">
        {player.hand.length} cards · {player.visibleCards.length} visible
      </div>
    </motion.div>
  );
}
