import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCasinoStore } from '../../store/CasinoStore';
import { useBalanceStore } from '../../store/balanceStore';
import { Card } from '../Card';
import { RulesButton } from '../RulesModal';
import type { CasinoSide } from '../../types/casino';

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function CasinoSetup({ onBack, onDeal }: { onBack: () => void; onDeal: (side: CasinoSide, bet: number) => void }) {
  const { balance } = useBalanceStore();
  const { resetCasino } = useCasinoStore();
  const [selectedSide, setSelectedSide] = useState<CasinoSide | null>(null);
  const betOptions = [5, 10, 25, 50, 100, 200, 500, 1000];
  const isBroke = balance <= 0;

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-sm block mb-4 text-left">← Back</button>
        <div className="text-4xl mb-2">🎰</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">Casino Style</h1>
        <p className="text-slate-500 text-xs sm:text-sm mb-1">Midnight Baseball · Widow vs Player</p>
        <div className="mb-4"><RulesButton defaultTab="casino" className="text-emerald-600 hover:text-emerald-800 text-xs underline" /></div>
        <p className="text-emerald-700 font-semibold mb-6">
          Balance: <span className="text-2xl font-bold">${balance.toLocaleString()}</span>
        </p>

        {isBroke ? (
          <div className="py-4">
            <div className="text-5xl mb-3">💸</div>
            <p className="text-slate-700 font-semibold text-lg mb-1">You're out of chips!</p>
            <p className="text-slate-500 text-sm mb-6">Reset your balance to $1,000 and play again.</p>
            <button onClick={resetCasino} className="w-full bg-emerald-600 text-white rounded-lg py-3 font-semibold hover:bg-emerald-500 transition">
              Reset Balance to $1,000
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Choose your side</p>
            <div className="flex gap-3 mb-6">
              {(['banker', 'player'] as CasinoSide[]).map(side => (
                <button
                  key={side}
                  onClick={() => setSelectedSide(side)}
                  className={[
                    'flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all duration-150',
                    selectedSide === side
                      ? side === 'banker'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                        : 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400',
                  ].join(' ')}
                >
                  {side === 'banker' ? '🕷️ Widow' : '👤 Player'}
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Choose your bet</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {betOptions.map(bet => {
                const canAfford = bet <= balance;
                const enabled = canAfford && !!selectedSide;
                return (
                  <button
                    key={bet}
                    onClick={() => enabled && onDeal(selectedSide!, bet)}
                    disabled={!enabled}
                    className={[
                      'py-2.5 rounded-lg text-sm font-semibold border transition-all duration-150',
                      enabled
                        ? 'border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 cursor-pointer'
                        : 'border-slate-100 text-slate-300 cursor-not-allowed',
                    ].join(' ')}
                  >
                    ${bet >= 1000 ? '1K' : bet}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400">
              {!selectedSide ? 'Pick a side first, then select a bet to deal' : 'Select a bet amount to deal'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Hand Side Display ────────────────────────────────────────────────────────

function SideHand({
  label, sideState, isBettorSide, isActive, onFlip, animating, animCount, sideOffset,
}: {
  label: string;
  sideState: { hand: any[]; evaluatedHand: any };
  isBettorSide: boolean;
  isActive: boolean;
  onFlip?: (idx: number) => void;
  animating: boolean;
  animCount: number;
  sideOffset: number; // 0 = banker, 1 = player
}) {
  return (
    <div className={[
      'rounded-xl p-3 transition-colors duration-1000',
      isActive && isBettorSide ? 'bg-yellow-50 ring-2 ring-yellow-400 shadow-lg shadow-yellow-100'
      : isActive ? 'bg-blue-50 ring-2 ring-blue-300'
      : 'bg-white/60 ring-1 ring-slate-200',
    ].join(' ')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={['w-2 h-2 rounded-full flex-shrink-0', isActive ? 'animate-pulse' : '', isBettorSide ? 'bg-yellow-400' : 'bg-blue-400'].join(' ')} />
          <span className="font-semibold text-slate-800 text-sm">{label}</span>
          {isBettorSide && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Your Side</span>}
        </div>
        <AnimatePresence mode="wait">
          {sideState.evaluatedHand && !animating && (
            <motion.span key={sideState.evaluatedHand.label} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
              {sideState.evaluatedHand.label}
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
        <div className="text-4xl text-center mb-3">{isWild ? '🃏' : '4️⃣'}</div>
        <h2 className="text-xl font-bold text-slate-800 text-center mb-1">{isWild ? 'Wild Card!' : 'Four Card!'}</h2>
        <p className="text-slate-500 text-sm text-center mb-1">
          {isWild
            ? <>A wild card appeared on your side.<br />Pay <strong>${initialBet}</strong> to continue, or surrender.</>
            : <>A 4 appeared on your side.<br />Pay <strong>${initialBet}</strong> to receive a bonus card, or surrender.</>}
        </p>
        {!canAfford && <p className="text-red-500 text-xs text-center mb-3 font-medium">💸 Not enough chips — you must surrender.</p>}
        {canAfford && <div className="mb-4" />}
        <div className="flex gap-3">
          <button onClick={onSurrender} className="flex-1 border border-red-200 text-red-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-red-50 transition">
            Surrender = ${totalWagered}
          </button>
          <button onClick={onPay} disabled={!canAfford}
            className="flex-1 bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition">
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
    <div className="relative min-h-screen bg-emerald-900 p-3 sm:p-4 flex flex-col gap-3 items-center">

      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white/60 hover:text-white text-sm underline">← Home</button>
          <h1 className="text-white font-bold text-base sm:text-xl">🎰 Casino Style</h1>
        </div>
        <div className="flex items-center gap-3">
          <RulesButton defaultTab="casino" />
          <div className="text-emerald-300 text-sm font-semibold">Balance: <span className="text-white">${balance.toLocaleString()}</span></div>
        </div>
      </div>

      {/* Current Best Hand */}
      <div className="bg-emerald-800/60 rounded-xl p-3 w-full max-w-2xl">
        <div className="text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">Current Best Hand</div>
        <div className="text-white font-bold text-sm sm:text-base">
          {handToBeat && !animating
            ? <><span className="text-white font-bold text-lg">{handToBeatSide === 'player' ? 'Player' : 'Widow'}</span> <span className='text-emerald-300 font-normal text-xs'>({handToBeat.label})</span> </>
            : 'None yet'}
        </div>
      </div>

      {/* Wager info */}
      <div className="flex gap-3 w-full max-w-2xl">
        <div className="flex-1 bg-emerald-800/40 rounded-xl p-3 text-center">
          <div className="text-emerald-300 text-xs uppercase tracking-wider">Bet / Hand</div>
          <div className="text-white font-bold text-lg">${initialBet}</div>
        </div>
        <div className="flex-1 bg-emerald-800/40 rounded-xl p-3 text-center">
          <div className="text-emerald-300 text-xs uppercase tracking-wider">Total Wagered</div>
          <div className="text-white font-bold text-lg">${totalWagered}</div>
        </div>
      </div>

      {/* Banker Hand */}
      <div className="w-full max-w-2xl">
        <SideHand label="🕷️ Widow" sideState={banker} isBettorSide={bettorSide === 'banker'}
          isActive={!animating && activeSide === 'banker' && phase === 'PLAYING'}
          onFlip={flipBettorCard} animating={animating} animCount={animCount} sideOffset={0} />
      </div>

      {/* Player Hand */}
      <div className="w-full max-w-2xl">
        <SideHand label="👤 Player" sideState={player} isBettorSide={bettorSide === 'player'}
          isActive={!animating && activeSide === 'player' && phase === 'PLAYING'}
          onFlip={flipBettorCard} animating={animating} animCount={animCount} sideOffset={1} />
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl p-3 sm:p-4 w-full max-w-2xl">
        {(phase === 'PLAYING' || animating) && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {animating
                ? <span className="text-slate-400">Dealing cards…</span>
                : bettorIsActive
                ? <><span className="font-semibold">Your turn</span> — tap a face-down card to flip it</>
                : <span className="text-slate-500 animate-pulse">Widow is flipping…</span>}
            </div>
            {bettorIsActive && (
              <button
                onClick={() => {
                  const side = bettorSide === 'banker' ? banker : player;
                  const idx = side.hand.findIndex((c: any) => !c.faceUp);
                  if (idx !== -1) flipBettorCard(idx);
                }}
                className="flex-shrink-0 bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-emerald-500 transition"
              >
                Flip Card
              </button>
            )}
          </div>
        )}

        {phase === 'GAME_OVER' && !animating && (
          <div className="flex flex-col gap-3">
            <div className="text-base sm:text-lg font-bold text-slate-800">{resultMessage}</div>

            {balance <= 0 ? (
              <div className="flex gap-2">
                <button onClick={resetCasino} className="flex-1 bg-emerald-700 text-white rounded-lg py-2.5 font-semibold hover:bg-emerald-600 transition">Reset to $1,000</button>
              </div>
            ) : (
              <div className="relative flex items-center gap-2">

                {/* Replay */}
                <button
                  onClick={() => bettorSide && startDeal(bettorSide, initialBet)}
                  disabled={initialBet > balance}
                  className="flex-shrink-0 py-2.5 px-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Replay ${initialBet}
                </button>

                {/* Change Pick dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setEndChoice(endChoice === 'changePick' ? null : 'changePick'); setPendingSide(null); }}
                    className={['flex-shrink-0 py-2.5 px-3 rounded-lg text-sm font-semibold border-2 transition flex items-center gap-1', endChoice === 'changePick' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-700 hover:border-blue-400'].join(' ')}
                  >
                    {pendingSide ? (pendingSide === 'banker' ? '🕷️ Widow' : '🕷️ Player') : 'Change Pick'}
                    <span className="text-xs opacity-70">{endChoice === 'changePick' ? '▲' : '▼'}</span>
                  </button>
                  {endChoice === 'changePick' && (
                    <div className="absolute bottom-full mb-1 left-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-2 flex flex-col gap-1 min-w-[130px]">
                      {(['banker', 'player'] as CasinoSide[]).map(side => (
                        <button
                          key={side}
                          onClick={() => { setPendingSide(side); setEndChoice(null); }}
                          className={['w-full py-2 px-3 rounded-lg text-sm font-semibold text-left transition', pendingSide === side ? (side === 'banker' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700') : 'hover:bg-slate-100 text-slate-700'].join(' ')}
                        >
                          {side === 'banker' ? '🕷️ Widow' : '🕷️ Player'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Change Bet dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setEndChoice(endChoice === 'changeBet' ? null : 'changeBet'); setPendingBet(null); }}
                    className={['flex-shrink-0 py-2.5 px-3 rounded-lg text-sm font-semibold border-2 transition flex items-center gap-1', endChoice === 'changeBet' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-700 hover:border-blue-400'].join(' ')}
                  >
                    {pendingBet ? `$${pendingBet >= 1000 ? '1K' : pendingBet}` : 'Change Bet'}
                    <span className="text-xs opacity-70">{endChoice === 'changeBet' ? '▲' : '▼'}</span>
                  </button>
                  {endChoice === 'changeBet' && (
                    <div className="absolute bottom-full mb-1 left-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-2 grid grid-cols-2 gap-1 min-w-[130px]">
                      {[5, 10, 25, 50, 100, 200, 500, 1000].map(bet => (
                        <button
                          key={bet}
                          onClick={() => { if (bet <= balance) { setPendingBet(bet); setEndChoice(null); } }}
                          disabled={bet > balance}
                          className={['py-1.5 rounded-lg text-sm font-semibold text-center transition', pendingBet === bet ? 'bg-blue-100 text-blue-700' : bet <= balance ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'].join(' ')}
                        >
                          ${bet >= 1000 ? '1K' : bet}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Play Now — only when a change selected */}
                {(pendingSide || pendingBet) && (
                  <button
                    onClick={() => startDeal(pendingSide ?? bettorSide!, pendingBet ?? initialBet)}
                    disabled={(pendingBet ?? initialBet) > balance}
                    className="flex-shrink-0 py-2.5 px-3 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Play Now →
                  </button>
                )}

              </div>
            )}
          </div>
        )}
      </div>

      {/* Dealing overlay */}
      <AnimatePresence>
        {animating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-10">
          </motion.div>
        )}
      </AnimatePresence>

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
