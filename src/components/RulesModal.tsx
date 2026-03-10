import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type RulesTab = 'casino' | 'ironCross';

function RulesContent({ tab }: { tab: RulesTab }) {

  if (tab === 'ironCross') return (
    <div className="flex flex-col gap-4 text-slate-700 text-sm leading-relaxed">
      <div>
        <h3 className="font-bold text-slate-900 mb-1">✝️ The Setup</h3>
        <p>Place your initial bet. You and the Dealer each receive <strong>5 cards</strong>. Your cards are face up. The Dealer's cards are face down. A cross-shaped board of <strong>5 cards</strong> is dealt in the center.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">🃏 The Board</h3>
        <p>The board is arranged like a cross: one card on top, three across the middle (left, center, right), and one on the bottom. Two cards are immediately revealed: the <strong>top</strong> and the <strong>right</strong>.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">🎯 Choose Your Row</h3>
        <p><strong>Top Row</strong>: use Top · Center · Bottom cards with your hand.</p>
        <p><strong>Right Row</strong>: use Left · Center · Right cards with your hand.</p>
        <p><strong>Mystery</strong>: use Left · Center · Bottom — neither card has been revealed yet!</p>
        <p>Or <strong>Surrender</strong> and forfeit your initial bet.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">💰 Back Up Bet</h3>
        <p>After choosing a row, you may place a Back Up Bet from $0 up to <strong>4× your initial bet</strong>, making the maximum total wager 5× your initial bet.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">🏁 The Reveal</h3>
        <p>The Dealer's cards and all remaining board cards flip over. You make the best 5-card hand from your 5 cards + your chosen 3 board cards (best 5 of 8). The Dealer automatically picks whichever row gives <em>them</em> the best hand. Best hand wins 1:1 on total wagered. Ties return your bet.</p>
      </div>
    </div>
  );

  // casino
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

export function RulesButton({ defaultTab = 'casino', className = '' }: { defaultTab?: RulesTab; className?: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<RulesTab>(defaultTab);

  const tabs: { id: RulesTab; label: string }[] = [
    { id: 'casino', label: 'Midnight Baseball' },
    { id: 'ironCross', label: 'The Cross' },
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
