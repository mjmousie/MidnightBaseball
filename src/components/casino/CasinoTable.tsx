import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCasinoStore } from '../../store/CasinoStore';
import { useBalanceStore } from '../../store/balanceStore';
import { Card } from '../Card';
import type { CasinoSide } from '../../types/casino';
import { AppHeader } from '../AppHeader';

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function CasinoSetup({ onBack, onDeal }: { onBack: () => void; onDeal: (side: CasinoSide, bet: number) => void }) {
  const { balance } = useBalanceStore();
  const { resetCasino } = useCasinoStore();
  const [selectedSide, setSelectedSide] = useState<CasinoSide | null>(null);
  const [pendingBet, setPendingBet] = useState<number | null>(null);
  const betOptions = [5, 25, 100];
  const isBroke = balance <= 0;

  return (
    <div className="h-dvh bg-slate-800 flex flex-col overflow-hidden">
      <AppHeader onHome={onBack} rulesTab="casino" />
      <div className="flex-1 min-h-0 flex items-center justify-center px-4 overflow-y-auto">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-5 w-full max-w-sm text-center">
          <div className="text-4xl mb-2 text-orange-600">⚪</div>
          <h2 className="text-xl font-bold text-white mb-1">Midnight Baseball</h2>
          <p className="text-slate-100 text-xs mb-1">Player vs Widow · Poker Game</p>

          {isBroke ? (
            <div className="py-4">
              <p className="text-slate-700 font-semibold text-lg mb-1">You're out of chips!</p>
              <p className="text-slate-500 text-sm mb-6">Reset your balance to $1,000 and play again.</p>
              <button onClick={resetCasino} className="w-full bg-emerald-600 text-white rounded-lg py-3 font-semibold hover:bg-emerald-500 transition">
                Reset Balance to $1,000
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-200 uppercase tracking-wider my-4">Choose your side</p>
              <div className="flex gap-3 my-4">
                {(['banker', 'player'] as CasinoSide[]).map(side => (
                  <button key={side} onClick={() => setSelectedSide(side)}
                    className={['flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all duration-800',
                      selectedSide === side
                        ? side === 'banker' ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-orange-600 border-orange-600 text-white shadow-lg'
                        : 'border-orange-500 text-slate-200 hover:border-orange-500'].join(' ')}>
                    {side === 'banker' ? 'Widow' : 'Player'}
                  </button>
                ))}
              </div>
              <p className="text-sm font-semibold text-slate-200 uppercase tracking-wider my-4">Choose your bet</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                
                {betOptions.map(bet => {
                  const canAfford = bet <= balance;
                  const enabled = canAfford && !!selectedSide;
                  return (
                    <button key={bet} onClick={() => enabled && setPendingBet(bet)} disabled={!enabled}
                      className={['py-2.5 rounded-lg text-sm font-semibold border transition-all duration-150',
                        pendingBet === bet
                        ? 'bg-orange-600 border-orange-600 text-white shadow-lg'
                        : enabled ? 'border-orange-500 text-slate-200 hover:border-orange-500 cursor-pointer'
                        : 'border-orange-300 text-slate-200 cursor-not-allowed'].join(' ')}>
                      ${bet >= 1000 ? '1K' : bet}
                    </button>
                  );
                })}
              </div>
              {pendingBet && (
                <div className="mt-6 bg-slate-700/40 rounded-xl p-3 text-left">
                  <p className="text-md font-semibold text-slate-200 mb-3 text-center">
                    You Choose
                  </p>
                  <p className="text-sm font-semibold text-slate-200 mb-3 text-center">
                    <span className="text-orange-500">{selectedSide === 'banker' ? 'Widow' : 'Player'}</span> for <span className="text-orange-500">${pendingBet}</span>
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setPendingBet(null)}
                      className="flex-1 py-2 rounded-lg text-slate-200 text-md font-semibold hover:bg-orange-500 hover:text-slate-200 transition">
                      Cancel
                    </button>
                    <button onClick={() => onDeal(selectedSide!, pendingBet)}
                      className="flex-1 py-2 rounded-lg bg-orange-600 text-white text-md font-semibold hover:bg-orange-500 transition">
                      Play Now
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hand Side Display ────────────────────────────────────────────────────────

function SideHand({
  label, sideState, isBettorSide, isActive, onFlip, animating, animCount, sideOffset,
}:

{
  label: string;
  sideState: { hand: any[]; evaluatedHand: any };
  isBettorSide: boolean;
  isActive: boolean;
  onFlip?: (idx: number) => void;
  animating: boolean;
  animCount: number;
  sideOffset: number; // 0 = banker, 1 = player
})
{
   // ← ADD IT HERE, before the return
  const [displayedHand, setDisplayedHand] = useState(sideState.evaluatedHand);
  useEffect(() => {
  const t = setTimeout(() => setDisplayedHand(sideState.evaluatedHand), 50);
  return () => clearTimeout(t);
}, [sideState.evaluatedHand?.label]);  // ← .label instead of the whole object
  return (
    <div className={[
      'rounded-xl p-3 my-4 transition-colors duration-1000',
      isActive && isBettorSide ? 'bg-slate-600 shadow-m shadow-slate-300'
      : isActive ? 'bg-slate-600'
      : 'bg-slate-700',
    ].join(' ')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200 text-sm">{label}</span>
          {isBettorSide && <span className="text-xs bg-orange-600 text-slate-200 px-1.5 py-0.5 rounded-full">Your Side</span>}
        </div>
        <AnimatePresence mode="wait">
          {displayedHand && !animating && (
            <motion.span key={sideState.evaluatedHand.label} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="text-xs font-medium text-slate-200 bg-slate-500 px-1.5 py-0.5 rounded-full">
              {displayedHand.label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="flex gap-1 w-full">
        {sideState.hand.map((card: any, idx: number) => {
          // Interleaved slot: banker=even slots (0,2,4...), player=odd slots (1,3,5...)
          const slotIndex = idx * 2 + sideOffset;
          const visible = !animating || slotIndex < animCount;
          return (
            <div key={card.id} className="flex-1 min-w-0">
              {animating ? (
                <AnimatePresence>
                  {visible && (
                    <motion.div
                      initial={{ opacity: 0, y: -28, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    >
                      <Card card={{ ...card, faceUp: false }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                <Card card={card} onClick={isBettorSide && isActive && !card.faceUp ? () => onFlip?.(idx) : undefined} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pay or Surrender Modal ───────────────────────────────────────────────────

function PayOrSurrenderPrompt({ initialBet, totalWagered, balance, isWild, onPay, onSurrender }: {
  initialBet: number; totalWagered: number; balance: number;
  isWild: boolean; onPay: () => void; onSurrender: () => void;
}) {
  const canAfford = balance >= initialBet;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-slate-800 text-center mb-1">{isWild ? 'Wild Card!' : 'Four Card!'}</h2>
        <p className="text-slate-500 text-sm text-center mb-1">
          {isWild
            ? <>A wild card appeared on your side.<br />Pay <strong>${initialBet}</strong> to continue, or surrender.</>
            : <>A 4 appeared on your side.<br />Pay <strong>${initialBet}</strong> to receive a bonus card, or surrender.</>}
        </p>
        {!canAfford && <p className="text-red-500 text-sm text-center mb-3 font-medium">Not enough chips — you must surrender.</p>}
        {canAfford && <div className="mb-4" />}
        <div className="flex gap-3">
          <button onClick={onSurrender} className="flex-1 border border-red-600 text-red-600 rounded-lg py-2.5 text-md font-semibold hover:bg-red-50 transition">
            Surrender = ${totalWagered}
          </button>
          <button onClick={onPay} disabled={!canAfford}
            className="flex-1 bg-orange-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition">
            Pay ${initialBet}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Casino Table ────────────────────────────────────────────────────────

export function CasinoTable({ onBack }: { onBack: () => void }) {
  const { balance } = useBalanceStore();
  const {
    phase, banker, player, bettorSide, activeSide,
    handToBeat, handToBeatSide, initialBet, totalWagered,
    resultMessage, flipCount,
    initCasino, flipBettorCard, payWildAndContinue, foldHand,
    payFourForCard, triggerCpuFlip, resetCasino,
  } = useCasinoStore();

  // ── Local deal animation state — completely independent of store ──
  const [animating, setAnimating] = useState(false);
  const [animCount, setAnimCount] = useState(0);
  const animCancelRef = useRef(false);

  // ── End-of-hand selection state ──
  const [endChoice, setEndChoice] = useState<null | 'changePick' | 'changeBet'>(null);
  const [pendingSide, setPendingSide] = useState<CasinoSide | null>(null);
  const [pendingBet, setPendingBet] = useState<number | null>(null);

  const startDeal = (side: CasinoSide, bet: number) => {
    setEndChoice(null);
    setPendingSide(null);
    setPendingBet(null);
    animCancelRef.current = true;
    initCasino(side, bet);
    animCancelRef.current = false;
    setAnimCount(0);
    setAnimating(true);

    let count = 0;
    const totalCards = 14;

    function tick() {
      if (animCancelRef.current) return;
      count += 1;
      setAnimCount(count);
      if (count < totalCards) {
        setTimeout(tick, 110);
      } else {
        setTimeout(() => {
          if (!animCancelRef.current) setAnimating(false);
        }, 300);
      }
    }
    setTimeout(tick, 80);
  };

  // Always return to setup screen when navigating here
  useEffect(() => { resetCasino(); }, []);

  // Auto-trigger CPU flip
  const cpuFlipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (phase !== 'PLAYING' || animating) return;
    if (activeSide === null) { triggerCpuFlip(); return; }
    if (activeSide !== bettorSide) {
      cpuFlipTimer.current = setTimeout(() => triggerCpuFlip(), 1800);
    }
    return () => { if (cpuFlipTimer.current) clearTimeout(cpuFlipTimer.current); };
  }, [phase, activeSide, bettorSide, flipCount, animating]);

  if (phase === 'SETUP') return <CasinoSetup onBack={onBack} onDeal={startDeal} />;

  const bettorIsActive = !animating && activeSide === bettorSide;

  return (
    <div className="h-dvh bg-slate-900 flex flex-col overflow-hidden">

      {/* Header */}
      <AppHeader onHome={onBack} rulesTab="casino" />

      {/* Cards area */}
      <div className="flex-1 min-h-0 overflow-hidden px-2 py-1 flex flex-col items-center">
        <div className="w-full max-w-sm flex flex-col gap-1.5 h-full justify-center">

        {/* Info bar: current best hand + wager */}
        <div className="flex gap-1.5 flex-shrink-0 my-2">
          <div className="flex-1 bg-slate-800/60 rounded-lg px-2 py-1">
            <div className="text-orange-400 text-[12px] font-semibold uppercase tracking-wider">Best Hand</div>
            <div className="text-white font-bold text-xs">
              {handToBeat && !animating
                ? <><span className="text-orange-300 font-normal">({handToBeatSide === 'player' ? 'Player' : 'Widow'}) </span>{handToBeat.label}</>
                : 'None yet'}
            </div>
          </div>
          <div className="bg-slate-800/40 rounded-lg px-2 py-1 text-center min-w-[56px] flex-shrink-0">
            <div className="text-orange-400 text-[10px] uppercase tracking-wider">Bet</div>
            <div className="text-white font-bold text-xs">${initialBet}</div>
          </div>
          <div className="bg-slate-800/40 rounded-lg px-2 py-1 text-center min-w-[64px] flex-shrink-0">
            <div className="text-orange-400 text-[10px] uppercase tracking-wider">Wagered</div>
            <div className="text-white font-bold text-xs">${totalWagered}</div>
          </div>
        </div>

        {/* Banker Hand */}
        <SideHand label="Widow" sideState={banker} isBettorSide={bettorSide === 'banker'}
          isActive={!animating && activeSide === 'banker' && phase === 'PLAYING'}
          onFlip={flipBettorCard} animating={animating} animCount={animCount} sideOffset={0} />

        {/* Player Hand */}
        <SideHand label="Player" sideState={player} isBettorSide={bettorSide === 'player'}
          isActive={!animating && activeSide === 'player' && phase === 'PLAYING'}
          onFlip={flipBettorCard} animating={animating} animCount={animCount} sideOffset={1} />

        </div>
      </div>

      {/* Bottom sheet — action bar */}
      <div className="flex-shrink-0 bg-slate-700 rounded-t-2xl px-3 align-center pt-3 pb-4 shadow-[0_-4px_24px_rgba(0,0,0,0.18)]">
        {(phase === 'PLAYING' || animating) && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {animating
                ? <span className="text-slate-400">Dealing cards…</span>
                : bettorIsActive
                ? <><span className="font-semibold text-slate-400">Your turn — tap a face-down card to flip it</span></>
                : <span className="text-slate-400 animate-pulse">Dealer is flipping…</span>}
            </div>
            {bettorIsActive && (
              <button
                onClick={() => {
                  const side = bettorSide === 'banker' ? banker : player;
                  const idx = side.hand.findIndex((c: any) => !c.faceUp);
                  if (idx !== -1) flipBettorCard(idx);
                }}
                className="flex-shrink-0 bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-orange-500 transition"
              >
                Flip Card
              </button>
            )}
          </div>
        )}

        {phase === 'GAME_OVER' && !animating && (
          <div className="flex flex-col gap-3">
            <div className="text-base font-bold text-slate-300">{resultMessage}</div>

            {balance <= 0 ? (
              <div className="flex gap-2">
                <button onClick={resetCasino} className="flex-1 bg-emerald-700 text-white rounded-lg py-2.5 font-semibold hover:bg-emerald-600 transition">Reset to $1,000</button>
              </div>
            ) : (
              <div className="relative flex items-center gap-2">
                <button onClick={() => bettorSide && startDeal(bettorSide, initialBet)} disabled={initialBet > balance}
                  className="flex-shrink-0 py-2.5 px-3 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  Replay ${initialBet}
                </button>
                <div className="relative">
                  <button onClick={() => { setEndChoice(endChoice === 'changePick' ? null : 'changePick'); setPendingSide(null); }}
                    className={['flex-shrink-0 py-2.5 px-3 rounded-lg text-sm font-semibold border-2 transition flex items-center gap-1', endChoice === 'changePick' ? 'bg-orange-600 border-orange-600 text-slate-200' : 'border-orange-500 text-slate-200 hover:border-orange-400'].join(' ')}>
                    {pendingSide ? (pendingSide === 'banker' ? 'Widow' : 'Player') : 'Change Pick'}
                    <span className="text-xs opacity-70">{endChoice === 'changePick' ? '▲' : '▼'}</span>
                  </button>
                  {endChoice === 'changePick' && (
                    <div className="absolute bottom-full mb-1 left-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-2 flex flex-col gap-1 min-w-[130px]">
                      {(['banker', 'player'] as CasinoSide[]).map(side => (
                        <button key={side} onClick={() => { setPendingSide(side); setEndChoice(null); }}
                          className={['w-full py-2 px-3 rounded-lg text-sm font-semibold text-left transition', pendingSide === side ? (side === 'banker' ? 'bg-orange-100 text-slate-700' : 'bg-orange-100 text-slate-700') : 'hover:bg-orange-600 text-slate-700 hover:text-slate-200'].join(' ')}>
                          {side === 'banker' ? 'Widow' : 'Player'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => { setEndChoice(endChoice === 'changeBet' ? null : 'changeBet'); setPendingBet(null); }}
                    className={['flex-shrink-0 py-2.5 px-3 rounded-lg text-sm font-semibold border-2 transition flex items-center gap-1', endChoice === 'changeBet' ? 'bg-orange-600 border-orange-600 text-white' : 'border-orange-500 text-slate-200 hover:border-orange-400'].join(' ')}>
                    {pendingBet ? `$${pendingBet >= 1000 ? '1K' : pendingBet}` : 'Change Bet'}
                    <span className="text-xs opacity-70">{endChoice === 'changeBet' ? '▲' : '▼'}</span>
                  </button>
                  {endChoice === 'changeBet' && (
                    <div className="absolute bottom-full mb-1 left-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-2 grid grid-cols-2 gap-1 min-w-[130px]">
                      {[5, 10, 25, 50, 100, 200, 500, 1000].map(bet => (
                        <button key={bet} onClick={() => { if (bet <= balance) { setPendingBet(bet); setEndChoice(null); } }} disabled={bet > balance}
                          className={['py-1.5 rounded-lg text-sm font-semibold text-center transition', pendingBet === bet ? 'bg-blue-100 text-blue-700' : bet <= balance ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'].join(' ')}>
                          ${bet >= 1000 ? '1K' : bet}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {(pendingSide || pendingBet) && (
                  <button onClick={() => startDeal(pendingSide ?? bettorSide!, pendingBet ?? initialBet)} disabled={(pendingBet ?? initialBet) > balance}
                    className="flex-shrink-0 py-2.5 px-3 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    Play Now →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {(phase === 'WILD_PROMPT' || phase === 'FOUR_PROMPT') && (
        <PayOrSurrenderPrompt
          initialBet={initialBet} totalWagered={totalWagered} balance={balance}
          isWild={phase === 'WILD_PROMPT'}
          onPay={phase === 'WILD_PROMPT' ? payWildAndContinue : payFourForCard}
          onSurrender={foldHand}
        />
      )}
    </div>
  );
}
