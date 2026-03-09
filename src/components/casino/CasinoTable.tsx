import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCasinoStore } from '../../store/CasinoStore';
import { Card } from '../Card';
import type { CasinoSide } from '../../types/casino';

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function CasinoSetup({ onBack }: { onBack: () => void }) {
  const { initCasino, balance } = useCasinoStore();
  const betOptions = [10, 25, 50, 100];

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-sm mb-4">← Back</button>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">🎰 Casino Style</h1>
        <p className="text-slate-500 text-xs sm:text-sm mb-2">Midnight Baseball · Banker vs Player</p>
        <p className="text-emerald-700 font-semibold mb-6">Balance: <span className="text-2xl">${balance}</span></p>

        <p className="text-sm font-semibold text-slate-700 mb-3">Choose your side:</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['banker', 'player'] as CasinoSide[]).map(side => (
            <div key={side} className="space-y-2">
              <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {side === 'banker' ? '🏦 Banker' : '🧑 Player'}
              </p>
              {betOptions.map(bet => (
                <button
                  key={bet}
                  onClick={() => initCasino(side, bet)}
                  disabled={bet > balance}
                  className="w-full border border-slate-200 rounded-lg py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  ${bet}
                </button>
              ))}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center">Select a side and bet amount to deal</p>
      </div>
    </div>
  );
}

// ─── Hand Side Display ────────────────────────────────────────────────────────

function SideHand({
  label,
  sideState,
  isBettorSide,
  isActive,
  onFlip,
}: {
  label: string;
  sideState: { hand: any[]; evaluatedHand: any };
  isBettorSide: boolean;
  isActive: boolean;
  onFlip?: (idx: number) => void;
}) {
  return (
    <div className={[
      'rounded-xl p-3 transition-colors duration-300',
      isActive && isBettorSide
        ? 'bg-yellow-50 ring-2 ring-yellow-400 shadow-lg shadow-yellow-100'
        : isActive
        ? 'bg-blue-50 ring-2 ring-blue-300'
        : 'bg-white/60 ring-1 ring-slate-200',
    ].join(' ')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={[
            'w-2 h-2 rounded-full flex-shrink-0',
            isActive ? 'animate-pulse' : '',
            isBettorSide ? 'bg-yellow-400' : 'bg-blue-400',
          ].join(' ')} />
          <span className="font-semibold text-slate-800 text-sm">{label}</span>
          {isBettorSide && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Your Side</span>}
        </div>
        <AnimatePresence mode="wait">
          {sideState.evaluatedHand && (
            <motion.span
              key={sideState.evaluatedHand.label}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full"
            >
              {sideState.evaluatedHand.label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-1 w-full">
        {sideState.hand.map((card: any, idx: number) => (
          <div key={card.id} className="flex-1 min-w-0">
            <Card
              card={card}
              onClick={isBettorSide && isActive && !card.faceUp ? () => onFlip?.(idx) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Prompt Modals ────────────────────────────────────────────────────────────

function PayOrSurrenderPrompt({
  initialBet,
  totalWagered,
  isWild,
  onPay,
  onSurrender,
}: {
  initialBet: number;
  totalWagered: number;
  isWild: boolean;
  onPay: () => void;
  onSurrender: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
      >
        <div className="text-4xl text-center mb-3">{isWild ? '🃏' : '4️⃣'}</div>
        <h2 className="text-xl font-bold text-slate-800 text-center mb-1">
          {isWild ? 'Wild Card!' : 'Four Card!'}
        </h2>
        <p className="text-slate-500 text-sm text-center mb-5">
          {isWild
            ? <>A wild card appeared on your side.<br />Pay <strong>${initialBet}</strong> to continue, or surrender.</>
            : <>A 4 appeared on your side.<br />Pay <strong>${initialBet}</strong> to receive a bonus card, or surrender.</>
          }
        </p>
        <div className="flex gap-3">
          <button onClick={onSurrender} className="flex-1 border border-red-200 text-red-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-red-50 transition">
            Surrender = ${totalWagered}
          </button>
          <button onClick={onPay} className="flex-1 bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-emerald-500 transition">
            Pay ${initialBet}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Casino Table ────────────────────────────────────────────────────────

export function CasinoTable({ onBack }: { onBack: () => void }) {
  const {
    phase, banker, player, bettorSide, activeSide,
    handToBeat, handToBeatSide, initialBet, totalWagered,
    balance, resultMessage, flipCount,
    flipBettorCard, payWildAndContinue, foldHand,
    payFourForCard, triggerCpuFlip, resetCasino,
  } = useCasinoStore();

  // Auto-trigger CPU flip with a short delay so the player can see it
  const cpuFlipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    if (activeSide === null) {
      // determineActive returned null — game should end, trigger final CPU flip to resolve
      triggerCpuFlip();
      return;
    }
    if (activeSide !== bettorSide) {
      cpuFlipTimer.current = setTimeout(() => {
        triggerCpuFlip();
      }, 900);
    }
    return () => {
      if (cpuFlipTimer.current) clearTimeout(cpuFlipTimer.current);
    };
  }, [phase, activeSide, bettorSide, flipCount]);

  if (phase === 'SETUP') return <CasinoSetup onBack={onBack} />;

  const bettorIsActive = activeSide === bettorSide;

  return (
    <div className="min-h-screen bg-emerald-900 p-3 sm:p-4 flex flex-col gap-3 items-center">

      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white/60 hover:text-white text-sm underline">← Home</button>
          <h1 className="text-white font-bold text-base sm:text-xl">🎰 Casino Style</h1>
        </div>
        <div className="text-emerald-300 text-sm font-semibold">Balance: <span className="text-white">${balance}</span></div>
      </div>

      {/* Hand to Beat */}
      <div className="bg-emerald-800/60 rounded-xl p-3 w-full max-w-2xl">
        <div className="text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">Current Best Hand</div>
        <div className="text-white font-bold text-sm sm:text-base">
          {handToBeat ? (
            <span>{handToBeat.label} <span className="text-emerald-300 font-normal text-xs">({handToBeatSide === bettorSide ? 'Your Side' : 'Dealer'})</span></span>
          ) : 'None yet'}
        </div>
      </div>

      {/* Wager info */}
      <div className="flex gap-3 w-full max-w-2xl">
        <div className="flex-1 bg-emerald-800/40 rounded-xl p-3 text-center">
          <div className="text-emerald-300 text-xs uppercase tracking-wider">Initial Bet</div>
          <div className="text-white font-bold text-lg">${initialBet}</div>
        </div>
        <div className="flex-1 bg-emerald-800/40 rounded-xl p-3 text-center">
          <div className="text-emerald-300 text-xs uppercase tracking-wider">Total Wagered</div>
          <div className="text-white font-bold text-lg">${totalWagered}</div>
        </div>
      </div>

      {/* Banker Hand */}
      <div className="w-full max-w-2xl">
        <SideHand
          label="🏦 Banker"
          sideState={banker}
          isBettorSide={bettorSide === 'banker'}
          isActive={activeSide === 'banker' && phase === 'PLAYING'}
          onFlip={flipBettorCard}
        />
      </div>

      {/* Player Hand */}
      <div className="w-full max-w-2xl">
        <SideHand
          label="🧑 Player"
          sideState={player}
          isBettorSide={bettorSide === 'player'}
          isActive={activeSide === 'player' && phase === 'PLAYING'}
          onFlip={flipBettorCard}
        />
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl p-3 sm:p-4 w-full max-w-2xl">
        {phase === 'PLAYING' && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {bettorIsActive
                ? <><span className="font-semibold">Your turn</span> — tap a face-down card to flip it</>
                : <span className="text-slate-500 animate-pulse">Dealer is flipping…</span>
              }
            </div>
            {bettorIsActive && (
              <button
                onClick={() => {
                  const side = bettorSide === 'banker' ? banker : player;
                  const idx = side.hand.findIndex((c: any) => !c.faceUp);
                  if (idx !== -1) flipBettorCard(idx);
                }}
                className="flex-shrink-0 bg-yellow-500 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-yellow-400 transition"
              >
                Flip Card
              </button>
            )}
          </div>
        )}

        {phase === 'GAME_OVER' && (
          <div className="flex flex-col gap-3">
            <div className="text-base sm:text-lg font-bold text-slate-800">{resultMessage}</div>
            <div className="text-sm text-slate-500">New balance: <span className="font-semibold text-slate-700">${balance}</span></div>
            <div className="flex gap-2">
              <button onClick={resetCasino} className="flex-1 bg-emerald-700 text-white rounded-lg py-2.5 font-semibold hover:bg-emerald-600 transition">
                Play Again
              </button>
              <button onClick={onBack} className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2.5 font-semibold hover:bg-slate-50 transition">
                Home
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(phase === 'WILD_PROMPT' || phase === 'FOUR_PROMPT') && (
        <PayOrSurrenderPrompt
          initialBet={initialBet}
          totalWagered={totalWagered}
          isWild={phase === 'WILD_PROMPT'}
          onPay={phase === 'WILD_PROMPT' ? payWildAndContinue : payFourForCard}
          onSurrender={foldHand}
        />
      )}
    </div>
  );
}
