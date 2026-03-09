import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type RulesTab = 'core' | 'conventional' | 'casino';

function RulesContent({ tab }: { tab: RulesTab }) {
  if (tab === 'core') return (
    <div className="flex flex-col gap-4 text-slate-700 text-sm leading-relaxed">
      <div>
        <h3 className="font-bold text-slate-900 mb-1">🌙 What is Midnight Baseball?</h3>
        <p>Midnight Baseball is a poker-style card game where players are dealt 7 cards face-down and take turns flipping them one at a time, trying to build the best 5-card poker hand.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">🃏 Wild Cards</h3>
        <p><strong>3s and 9s are wild</strong> — they can represent any card to make the best possible hand. When you flip a 3 or 9, you must pay the pot to keep it as a wild, or fold your hand.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">4️⃣ The Four</h3>
        <p>When you flip a <strong>4</strong>, you may pay the pot to receive an extra face-down card dealt to your hand, or pass.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">🏆 Hand Rankings</h3>
        <p>Standard poker rankings apply: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, One Pair, High Card.</p>
      </div>
    </div>
  );

  if (tab === 'conventional') return (
    <div className="flex flex-col gap-4 text-slate-700 text-sm leading-relaxed">
      <div>
        <h3 className="font-bold text-slate-900 mb-1">👥 Players</h3>
        <p>2–7 players. Each player is dealt 7 cards face-down. A minimum bet (ante) starts the pot.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">▶️ How a Turn Works</h3>
        <p>On your turn, flip one face-down card. If your best visible hand <strong>beats the current high hand</strong>, the action moves to the next player. If it doesn't, you keep flipping until you beat it or run out of cards.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">🃏 Wilds & 4s</h3>
        <p>Flipping a <strong>3 or 9</strong>: pay the current pot value to keep it as wild, or fold. Flipping a <strong>4</strong>: pay the pot to receive one bonus card face-down, or decline.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">🏁 Winning</h3>
        <p>After all players have gone, the player with the best 5-card hand wins the pot. Ties split the pot.</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 text-slate-700 text-sm leading-relaxed">
      <div>
        <h3 className="font-bold text-slate-900 mb-1">🎯 The Setup</h3>
        <p>You bet on either the <strong>Banker</strong> or <strong>Player</strong> side. Both sides receive 7 cards face-down, with 3 random cards exposed on each side to start.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">▶️ Taking Turns</h3>
        <p>The side with the <strong>weaker visible hand</strong> flips a card first. Once your side beats the dealer's, the dealer flips. This continues until all cards are revealed or the game ends.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">🃏 Wilds & 4s</h3>
        <p>When a <strong>3 or 9</strong> appears on your side, pay your full initial bet to keep playing, or surrender and lose your total wagered amount. When a <strong>4</strong> appears, pay your initial bet to receive a bonus card, or surrender.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">💰 Payouts</h3>
        <p><strong>Win:</strong> receive 1:1 on everything wagered. <strong>Lose:</strong> forfeit all wagered chips. Starting balance is $1,000.</p>
      </div>
    </div>
  );
}

export function RulesButton({ defaultTab = 'core', className = '' }: { defaultTab?: RulesTab; className?: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<RulesTab>(defaultTab);

  const tabs: { id: RulesTab; label: string }[] = [
    { id: 'core', label: 'Core Rules' },
    { id: 'conventional', label: 'Conventional' },
    { id: 'casino', label: 'Casino Style' },
  ];

  return (
    <>
      <button
        onClick={() => { setTab(defaultTab); setOpen(true); }}
        className={className || 'text-white/60 hover:text-white text-sm underline'}
      >
        Rules
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📖</span>
                  <h2 className="text-lg font-bold text-slate-900">How to Play</h2>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">✕</button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={[
                      'flex-1 py-2.5 text-xs font-semibold transition',
                      tab === t.id
                        ? 'text-emerald-700 border-b-2 border-emerald-600'
                        : 'text-slate-400 hover:text-slate-600',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    <RulesContent tab={tab} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
