import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type RulesTab = 'core' | 'conventional' | 'casino' | 'ironCross' | 'bonusPayouts';

function RulesContent({ tab }: { tab: RulesTab }) {
  if (tab === 'bonusPayouts') return (
    <div className="flex flex-col gap-4 text-slate-700 text-sm leading-relaxed">
      <div>
        <h3 className="font-bold text-slate-900 mb-2">🎰 Iron Cross — Bonus Bet Payouts</h3>
        <p className="text-slate-500 text-xs mb-3">The Bonus Bet pays on <strong>your final 5-card hand</strong>, win or lose the main game. Placed before the deal.</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-3 py-2 rounded-tl font-semibold text-slate-700">Hand</th>
              <th className="text-right px-3 py-2 rounded-tr font-semibold text-slate-700">Pays</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Royal Flush',    '400 to 1'],
              ['Straight Flush', '100 to 1'],
              ['Four of a Kind',  '25 to 1'],
              ['Full House',       '5 to 1'],
              ['Flush',            '2 to 1'],
              ['Straight',         '1 to 1'],
              ['All others',        'No pay'],
            ].map(([hand, pays], i) => (
              <tr key={hand} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-3 py-2 font-medium">{hand}</td>
                <td className={['px-3 py-2 text-right font-bold', pays === 'No pay' ? 'text-slate-400' : 'text-emerald-700'].join(' ')}>{pays}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-slate-400 text-xs mt-3">Bonus Bet is returned on a push (tie) in the main game only — it pays independently based on hand rank.</p>
      </div>
    </div>
  );
  if (tab === 'core') return (
    <div className="flex flex-col gap-3 text-slate-700 text-sm leading-relaxed">
      <p className="text-slate-500 text-xs">Ranked strongest to weakest. Best 5-card hand wins.</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left px-3 py-2 rounded-tl font-semibold text-slate-700">Hand</th>
            <th className="text-left px-3 py-2 rounded-tr font-semibold text-slate-700">Example</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['👑 Royal Flush',      'A K Q J 10 (same suit)'],
            ['🔥 Straight Flush',   '9 8 7 6 5 (same suit)'],
            ['4️⃣ Four of a Kind',  'K K K K 2'],
            ['🏠 Full House',       'Q Q Q 7 7'],
            ['♠ Flush',             'A J 8 4 2 (same suit)'],
            ['➡️ Straight',         '7 6 5 4 3 (mixed suits)'],
            ['3️⃣ Three of a Kind', 'J J J 5 2'],
            ['2️⃣ Two Pair',        'A A 9 9 K'],
            ['1️⃣ One Pair',        'Q Q 7 4 2'],
            ['🃏 High Card',        'A J 8 5 2 (no match)'],
          ].map(([hand, example], i) => (
            <tr key={hand} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="px-3 py-2 font-semibold whitespace-nowrap">{hand}</td>
              <td className="px-3 py-2 text-slate-500 text-xs">{example}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

export function BonusPayoutsButton({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const payouts = [
    ['Royal Flush',    '400 to 1'],
    ['Straight Flush', '100 to 1'],
    ['Four of a Kind',  '25 to 1'],
    ['Full House',       '5 to 1'],
    ['Flush',            '2 to 1'],
    ['Straight',         '1 to 1'],
    ['All others',        'No pay'],
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || 'text-white/60 hover:text-white text-sm underline'}
      >
        Bonus Pays
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎰</span>
                  <h2 className="text-lg font-bold text-slate-900">Bonus Bet Payouts</h2>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">✕</button>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <p className="text-slate-500 text-xs">Pays on your final 5-card hand, win or lose the main game.</p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-3 py-2 rounded-tl font-semibold text-slate-700">Hand</th>
                      <th className="text-right px-3 py-2 rounded-tr font-semibold text-slate-700">Pays</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map(([hand, pays], i) => (
                      <tr key={hand} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-3 py-2 font-medium">{hand}</td>
                        <td className={['px-3 py-2 text-right font-bold', pays === 'No pay' ? 'text-slate-400' : 'text-emerald-700'].join(' ')}>{pays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function RulesButton({ defaultTab = 'core', className = '' }: { defaultTab?: RulesTab; className?: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<RulesTab>(defaultTab);

  const tabs: { id: RulesTab; label: string }[] = [
    { id: 'core', label: 'Hand Strength' },
    { id: 'casino', label: 'Midnight Baseball' },
    { id: 'ironCross', label: 'Iron Cross' },
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
