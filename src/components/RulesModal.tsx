import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type RulesTab = 'core' | 'casino' | 'ironCross' | 'bonusPayouts' | 'highLowPayouts' | 'highLow';

function RulesContent({ tab }: { tab: RulesTab }) {
  if (tab === 'bonusPayouts') return (
    <div className="flex flex-col gap-4 text-slate-700 text-sm leading-relaxed">
      <div>
        <h3 className="font-bold text-slate-900 mb-2">Iron Cross — Bonus Bet Payouts</h3>
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
            ['Royal Flush',      'A K Q J 10 (same suit)'],
            ['Straight Flush',   '9 8 7 6 5 (same suit)'],
            ['4 Four of a Kind',  'K K K K 2'],
            ['Full House',       'Q Q Q 7 7'],
            ['Flush',             'A J 8 4 2 (same suit)'],
            ['Straight',         '7 6 5 4 3 (mixed suits)'],
            ['Three of a Kind', 'J J J 5 2'],
            ['Two Pair',        'A A 9 9 K'],
            ['One Pair',        'Q Q 7 4 2'],
            ['High Card',        'A J 8 5 2 (no match)'],
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

  if (tab === 'highLow') return (
  <div className="flex flex-col gap-4 text-slate-700 text-sm leading-relaxed">
    <div>
      <h3 className="font-bold text-slate-900 mb-2">How to Play — High or Low</h3>
      <ol className="flex flex-col gap-2 text-sm text-slate-600 list-decimal list-inside">
        <li>Place a bet between $1 and $100.</li>
        <li>A card is dealt face-up. This is your starting card.</li>
        <li>Guess whether the next card will be <strong>Higher</strong> or <strong>Lower</strong>.</li>
        <li>If you're right, your streak grows and you can <strong>Cash Out</strong> or keep going.</li>
        <li>If you're wrong, you lose your bet and start over.</li>
        <li>Hit 7 correct guesses in a row to win the maximum payout.</li>
      </ol>
    </div>
    <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1.5">
      <p className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1">Rules</p>
      <p className="text-xs text-slate-500">Aces are always <strong>High</strong> — the highest card in the deck.</p>
      <p className="text-xs text-slate-500">Ties always <strong>Lose</strong> — the next card must be strictly higher or lower.</p>
      <p className="text-xs text-slate-500">Cash out any time after a correct guess to keep your winnings.</p>
    </div>
  </div>
);

if (tab === 'highLowPayouts') return (
  <div className="flex flex-col gap-4 text-slate-700 text-sm leading-relaxed">
    <div>
      <h3 className="font-bold text-slate-900 mb-2">Hi/Lo Multiplier Payouts</h3>
      <p className="text-slate-500 text-xs mb-3">Build a streak of correct guesses to multiply your bet. Cash out any time after a correct guess.</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left px-3 py-2 rounded-tl font-semibold text-slate-700">Streak</th>
            <th className="text-right px-3 py-2 font-semibold text-slate-700">Multiplier</th>
            <th className="text-right px-3 py-2 rounded-tr font-semibold text-slate-700">$10 Pays</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['1 correct', '0.7×', '$7'],
            ['2 correct', '1×',   '$10'],
            ['3 correct', '2.5×', '$25'],
            ['4 correct', '3.5×', '$35'],
            ['5 correct', '6×',   '$60'],
            ['6 correct', '10×',  '$100'],
            ['7 correct', '25×',  '$250'],
          ].map(([streak, multi, pays], i) => (
            <tr key={streak} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="px-3 py-2 font-medium">{streak}</td>
              <td className="px-3 py-2 text-right text-orange-600 font-semibold">{multi}</td>
              <td className="px-3 py-2 text-right">{pays}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

  if (tab === 'ironCross') return (
    <div className="flex flex-col gap-4 text-slate-700 text-sm leading-relaxed">
      <div>
        <h3 className="font-bold text-slate-900 mb-1">The Setup</h3>
        <p>Place your initial bet. You and the Dealer each receive <strong>5 cards</strong>. Your cards are face up. The Dealer's cards are face down. A cross-shaped board of <strong>5 cards</strong> is dealt in the center.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">The Board</h3>
        <p>The board is arranged like a cross: one card on top, three across the middle (left, center, right), and one on the bottom. Two cards are immediately revealed: the <strong>top</strong> and the <strong>right</strong>.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">Choose Your Row</h3>
        <p><strong>Top Row</strong>: use Top · Center · Bottom cards with your hand.</p>
        <p><strong>Right Row</strong>: use Left · Center · Right cards with your hand.</p>
        <p><strong>Mystery</strong>: use Left · Center · Bottom — neither card has been revealed yet!</p>
        <p>Or <strong>Surrender</strong> and forfeit your initial bet.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">Back Up Bet</h3>
        <p>After choosing a row, you may place a Back Up Bet from $0 up to <strong>4× your initial bet</strong>, making the maximum total wager 5× your initial bet.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">The Reveal</h3>
        <p>The Dealer's cards and all remaining board cards flip over. You make the best 5-card hand from your 5 cards + your chosen 3 board cards (best 5 of 8). The Dealer automatically picks whichever row gives <em>them</em> the best hand. Best hand wins 1:1 on total wagered. Ties return your bet.</p>
      </div>
    </div>
  );

  // casino
  return (
    <div className="flex flex-col gap-4 text-slate-700 text-sm leading-relaxed">
      <div>
        <h3 className="font-bold text-slate-900 mb-1">The Setup</h3>
        <p>You bet on either the <strong>Player</strong> or <strong>Widow</strong> side. Both sides receive 7 cards face-down, with 3 random cards exposed on each side to start.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">Taking Turns</h3>
        <p>The side with the <strong>weaker visible hand</strong> flips a card first. Once your side beats the dealer's, the dealer flips. This continues until all cards are revealed or the game ends.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">Wilds & 4s</h3>
        <p>When a <strong>3 or 9</strong> appears on your side, pay your full initial bet to keep playing, or surrender and lose your total wagered amount. When a <strong>4</strong> appears, pay your initial bet to receive a bonus card, or surrender.</p>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">Payouts</h3>
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

export function RulesButton({ defaultTab = 'core', className = '', label = 'Rules' }: { defaultTab?: RulesTab; className?: string; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || 'text-white/60 hover:text-white text-sm underline'}
      >
        {label}
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
                  <h2 className="text-lg font-bold text-slate-900">How to Play</h2>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">✕</button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-5">
                <RulesContent tab={defaultTab} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
