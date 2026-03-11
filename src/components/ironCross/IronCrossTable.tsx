import { useState, useEffect, useRef } from 'react';
import { useIronCrossStore } from '../../store/IronCrossStore';
import { useBalanceStore } from '../../store/balanceStore';
import { Card } from '../Card';
import { RulesButton, BonusPayoutsButton } from '../RulesModal';
import { cardLabel } from '../../utils/deck';
import type { RowChoice } from '../../types/ironCross';

const BET_OPTIONS = [5, 25, 100, 500];
const BONUS_OPTIONS = [0, 5, 10];

const ROW_LABELS: Record<RowChoice, string> = {
  top: 'Top Row', right: 'Right Row', mystery: 'Mystery', both: 'Both Revealed',
};

// Returns a card-based label when board is available, falls back to ROW_LABELS
function rowLabel(row: RowChoice, board: { top: any; right: any } | null): string {
  if (!board) return ROW_LABELS[row];
  if (row === 'top')     return `${cardLabel(board.top)} Row`;
  if (row === 'right')   return `${cardLabel(board.right)} Row`;
  if (row === 'both')    return `${cardLabel(board.top)} & ${cardLabel(board.right)}`;
  return 'Mystery';
}

// Which board positions belong to each row
function boardPositionsForRow(row: RowChoice): string[] {
  if (row === 'top')   return ['top', 'center', 'bottom'];
  if (row === 'right') return ['left', 'center', 'right'];
  if (row === 'both')  return ['top', 'right'];
  return ['left', 'center', 'bottom'];
}

// Which row does clicking a board position suggest?
const POS_TO_ROW: Record<string, RowChoice> = {
  top:    'top',
  bottom: 'top',
  right:  'right',
  left:   'mystery',
  center: 'mystery',
};

// ── Setup (two-step: bet → bonus bet) ─────────────────────────────────────────
function IronCrossSetup({ onBack }: { onBack: () => void }) {
  const { balance, reset } = useBalanceStore();
  const { initGame } = useIronCrossStore();
  const [step, setStep]         = useState<'bet' | 'bonus'>('bet');
  const [chosenBet, setChosenBet] = useState(0);
  const [bonusBet, setBonusBet]  = useState(5);

  const startGame = () => initGame(chosenBet, bonusBet);

  return (
    <div className="h-dvh bg-slate-900 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-emerald-800/50">
        <button onClick={onBack} className="text-white/60 hover:text-white text-sm underline">← Home</button>
        <h1 className="text-white font-bold text-sm">Iron Cross</h1>
        <div className="py-0.5 px-4 bg-slate-600 rounded-3xl border-[1px] border-slate-700">
          <span className="text-white text-s font-semibold">Balance: <span className="text-white">${balance.toLocaleString()}</span></span>
          </div>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center px-4 overflow-y-auto">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-5 w-full max-w-sm text-center">
          <div className="text-4xl mb-2 text-orange-600">🕀</div>
          <h2 className="text-xl font-bold text-slate-200 mb-1">Iron Cross</h2>
          <p className="text-slate-200 text-xs mb-1">Player vs Dealer · Board Game</p>
          <div className="mb-4"><RulesButton defaultTab="ironCross" className="text-orange-700 text-xs underline" /></div>

        {balance <= 0 ? (
          <div>
            <div className="text-5xl mb-3">💸</div>
            <p className="text-slate-500 text-sm mb-4">You're out of chips!</p>
            <button onClick={reset} className="w-full bg-slate-700 text-white rounded-lg py-3 font-semibold">
              Reset to $1,000
            </button>
          </div>
        ) : step === 'bet' ? (
          <>
            <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider my-4">Choose your initial bet</p>
            <div className="grid grid-cols-4 gap-2">
              {BET_OPTIONS.map(b => {
                const ok = b <= balance;
                return (
                  <button key={b} onClick={() => { if (ok) { setChosenBet(b); setBonusBet(5); setStep('bonus'); } }}
                    disabled={!ok}
                    className={['py-2.5 rounded-lg text-sm font-semibold border transition',
                      ok ? 'border-orange-500 text-slate-200 hover:bg-orange-600 hover:border-orange-600'
                         : 'border-orange-500 text-slate-300 cursor-not-allowed'].join(' ')}>
                    ${b >= 1000 ? '1K' : b}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="text-slate-200 font-semibold mb-1">Initial Bet: <span className="text-orange-400">${chosenBet}</span></p>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Add a Bonus Bet?</p>
              <BonusPayoutsButton className="text-orange-500 text-sm underline hover:text-orange-600" />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {BONUS_OPTIONS.filter(b => b === 0 || b <= balance - chosenBet).map(b => (
                <button key={b} onClick={() => setBonusBet(b)}
                  className={['py-2 rounded-lg text-sm font-semibold border transition',
                  bonusBet === b ? 'bg-orange-600 border-orange-600 text-white'
                : 'border-orange-500 text-slate-200 hover:bg-slate-800 hover:border-orange-600'].join(' ')}>
                  {b === 0 ? 'No Thanks' : `$${b}`}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('bet')}
                className="flex-1 text-slate-200 rounded-lg py-2 text-sm font-semibold hover:text-orange-400 transition">
                ← Back
              </button>
              <button onClick={startGame}
                className="flex-1 bg-orange-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-orange-500 transition">
                Deal{bonusBet > 0 ? `: $${chosenBet + bonusBet}` : `: $${chosenBet}`}
              </button>
            </div>
          </>
        )}
          </div>
        </div>
      </div>
  );
}
function Ghost() { return <div className="w-full aspect-[5/7]" />; }

// ── Board cross ───────────────────────────────────────────────────────────────
// 7 flex-1 slots per row (matching hand rows).
// During CHOOSING: cards are clickable, pending row is highlighted,
// and a "Pick Face Up Cards" link appears at row0-slot4 (between top & right).

function BoardCross({ board, highlightRow, gameId, onCardClick, pendingRow }: {
  board: NonNullable<ReturnType<typeof useIronCrossStore.getState>['board']>;
  highlightRow: RowChoice | null;
  gameId: number;
  onCardClick?: (pos: string) => void;
  pendingRow?: RowChoice | null;
}) {
  const activeRow = pendingRow ?? highlightRow;
  const h = new Set(activeRow ? boardPositionsForRow(activeRow) : []);
  const interactive = !!onCardClick;

  const g = <div className="flex-1 min-w-0"><Ghost /></div>;

  const slot = (card: any, pos: string) => {
    const highlighted = h.has(pos);
    return (
      <div key={`${gameId}-${pos}`}
        className={[
          'flex-1 min-w-0 rounded-md transition-all',
          interactive ? 'cursor-pointer' : '',
          highlighted ? 'ring-4 ring-orange-600' : '',
          interactive && !highlighted ? 'hover:ring-2 hover:ring-orange-200' : '',
        ].join(' ')}
        onClick={() => onCardClick?.(pos)}
      >
        <Card card={card} />
      </div>
    );
  };

  // "Pick Face Up Cards" appears at row0-slot4 (right of top, above right)
  const bothLink = interactive ? (
    <div key="both-link" className="flex-1 min-w-0 flex items-center justify-center">
      <button
        onClick={() => onCardClick?.('both')}
        className={[
          'text-[9px] font-bold leading-tight text-center px-0.5 py-1 rounded transition w-full',
          pendingRow === 'both'
            ? 'bg-yellow-400 text-slate-900'
            : 'text-yellow-300 hover:text-yellow-100 underline',
        ].join(' ')}
      >
        Pick<br/>Both
      </button>
    </div>
  ) : g;

  return (
    <div className="w-full flex flex-col gap-1">
      {/* top row: _ _ _ top [both?] _ _ */}
      <div className="flex w-full gap-1">{g}{g}{g}{slot(board.top, 'top')}{bothLink}{g}{g}</div>
      {/* mid row: _ _ left ctr right _ _ */}
      <div className="flex w-full gap-1">{g}{g}{slot(board.left, 'left')}{slot(board.center, 'center')}{slot(board.right, 'right')}{g}{g}</div>
      {/* bot row: _ _ _ bot _ _ _ */}
      <div className="flex w-full gap-1">{g}{g}{g}{slot(board.bottom, 'bottom')}{g}{g}{g}</div>
    </div>
  );
}

// ── Hand row ──────────────────────────────────────────────────────────────────
function HandRow({ label, slots, gameId }: { label: string; slots: (any | null)[]; gameId: number }) {
  return (
    <div className="w-full">
      <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2 text-center">{label}</p>
      <div className="flex w-full gap-1">
        {slots.map((c, i) => (
          <div key={`${gameId}-${c?.id ?? `g${i}`}`} className="flex-1 min-w-0">
            {c ? <Card card={c} /> : <Ghost />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────
export function IronCrossTable({ onBack }: { onBack: () => void }) {
  const { balance, reset } = useBalanceStore();
  const {
    phase, gameId, playerHand, dealerHand, board,
    chosenRow, dealerChosenRow,
    initialBet, bonusBet, bonusWin, backupBet,
    playerBestHand, dealerBestHand,
    winner, resultMessage,
    surrender, surrenderDraw, confirmRowAndBet, resetGame, initGame,
    drawCards, standPat, flipTopCard, flipRightCard, revealDrawnCards, applyPayout,
  } = useIronCrossStore();

  const [pendingBackup, setPendingBackup] = useState(0);
  const [pendingRow, setPendingRow]       = useState<RowChoice | null>(null);
  const [endChoice, setEndChoice]         = useState<null | 'changeBet'>(null);
  const [pendingBet, setPendingBet]       = useState<number | null>(null);
  const [discardSet, setDiscardSet]       = useState<Set<number>>(new Set());
  const [boardReady, setBoardReady]       = useState(false);
  // replayBonus: when set, we're in the "pick bonus for next game" step
  const [replayBonus, setReplayBonus]     = useState<{ bet: number; bonus: number } | null>(null);

  const boardRevealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reveal order: left(1) → bottom(2) → center(3) → dealer[0-4](4-8)
  const TOTAL_REVEAL = 8;
  const [revealStep, setRevealStep] = useState(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always return to setup screen when navigating here
  useEffect(() => { resetGame(); }, []);

  useEffect(() => {
    if (phase === 'DRAWING') {
      setBoardReady(false);
      boardRevealTimer.current = setTimeout(() => {
        flipTopCard();
        boardRevealTimer.current = setTimeout(() => {
          flipRightCard();
          setBoardReady(true);
        }, 1000);
      }, 600);
    }
    return () => { if (boardRevealTimer.current) clearTimeout(boardRevealTimer.current); };
  }, [phase]);

  useEffect(() => {
    if (phase === 'REVEAL') {
      setRevealStep(0);
      let step = 0;
      const tick = () => {
        step += 1;
        setRevealStep(step);
        if (step < TOTAL_REVEAL) revealTimer.current = setTimeout(tick, 2200);
      };
      revealTimer.current = setTimeout(tick, 400);
    }
    return () => { if (revealTimer.current) clearTimeout(revealTimer.current); };
  }, [phase]);

  const [showResult,  setShowResult]  = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  // Staggered end-of-hand sequence: last card flips → 0.6s → result → 0.4s → balance
  useEffect(() => {
    if (revealStep >= TOTAL_REVEAL) {
      const t1 = setTimeout(() => setShowResult(true),  600);
      const t2 = setTimeout(() => { setShowBalance(true); applyPayout(); }, 1000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setShowResult(false);
      setShowBalance(false);
    }
  }, [revealStep]);

  if (phase === 'SETUP') return <IronCrossSetup onBack={onBack} />;

  // beginReplay: show inline bonus picker before starting next game
  const beginReplay = (bet: number) => {
    setEndChoice(null); setPendingBet(null); setPendingRow(null);
    setReplayBonus({ bet, bonus: 5 });
  };

  // launchGame: actually start, resetting all animation state
  const launchGame = (bet: number, bonus: number) => {
    setPendingBackup(0); setEndChoice(null); setPendingBet(null);
    setDiscardSet(new Set()); setPendingRow(null); setReplayBonus(null);
    setRevealStep(0); setBoardReady(false); setShowResult(false); setShowBalance(false);
    initGame(bet, bonus);
  };

  const backupOpts = [1, 2, 3, 4].map(m => m * initialBet);

  // Reveal order: left(1) bottom(2) center(3) dealer[0](4)..dealer[4](8)
  const visBoard = board ? {
    top:    board.top,
    right:  board.right,
    left:   { ...board.left,   faceUp: phase === 'REVEAL' ? revealStep >= 1 : board.left.faceUp   },
    bottom: { ...board.bottom, faceUp: phase === 'REVEAL' ? revealStep >= 2 : board.bottom.faceUp },
    center: { ...board.center, faceUp: phase === 'REVEAL' ? revealStep >= 3 : board.center.faceUp },
  } : null;

  const visDealer = dealerHand.map((c, i) => ({
    ...c,
    faceUp: phase === 'REVEAL' ? revealStep >= i + 4 : c.faceUp,
  }));

  const dealerSlots: (any | null)[] = [null, ...visDealer, null];
  const playerSlots: (any | null)[] = [null, ...playerHand, null];

  // Handle clicking a board card during CHOOSING
  const handleBoardClick = (pos: string) => {
    if (phase !== 'CHOOSING') return;
    if (pos === 'both') { setPendingRow('both'); return; }
    const row = POS_TO_ROW[pos];
    if (row) setPendingRow(row);
  };

  return (
    <div className="h-dvh bg-slate-800 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-emerald-800/50">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-white/60 hover:text-white text-sm underline">← Home</button>
          <h1 className="text-white font-bold text-sm">Iron Cross</h1>
        </div>
        <div className="flex items-center gap-2">
          <RulesButton defaultTab="ironCross" />
          <BonusPayoutsButton />
          <div className="py-0.5 px-4 bg-slate-600 rounded-3xl border-[1px] border-slate-700">
          <span className="text-white text-s font-semibold">Balance: <span className="text-white">${balance.toLocaleString()}</span></span>
          </div>
        </div>
      </div>

      {/* Cards area — fills remaining height above bottom sheet */}
      <div className="flex-1 min-h-0 overflow-hidden px-2 py-1 flex flex-col items-center">
        <div className="w-full max-w-[80%] flex flex-col gap-0.5 h-full mt-2">

        {/* Dealer */}
        <HandRow label="Dealer" slots={dealerSlots} gameId={gameId} />

        {/* Board */}
        <div className="my-4">
          <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider text-center mb-0.5">The Cross</p>
          {visBoard && (
            <BoardCross
              board={visBoard}
              highlightRow={phase === 'REVEAL' ? chosenRow : null}
              pendingRow={phase === 'CHOOSING' ? pendingRow : null}
              gameId={gameId}
              onCardClick={phase === 'CHOOSING' ? handleBoardClick : undefined}
            />
          )}
          {phase === 'CHOOSING' && (
            <p className="text-orange-300/70 text-[10px] text-center mt-0.5">
              Tap a card to select its row
            </p>
          )}
        
        </div>

        {/* Player hand */}
        <div className="w-full">
          <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2 text-center">Your Hand</p>
          <div className="flex w-full gap-1">
            {playerSlots.map((c, i) => {
              const cardIndex = i - 1;
              const isSelectable = phase === 'DRAWING' && c !== null;
              const isSelected   = discardSet.has(cardIndex);
              return (
                <div key={`${gameId}-${c?.id ?? `g${i}`}`}
                  className={['flex-1 min-w-0 transition', isSelectable ? 'cursor-pointer' : ''].join(' ')}
                  onClick={() => {
                    if (!isSelectable) return;
                    setDiscardSet(prev => {
                      const next = new Set(prev);
                      if (next.has(cardIndex)) next.delete(cardIndex);
                      else if (next.size < 2) next.add(cardIndex);
                      return next;
                    });
                  }}
                >
                  {c ? (
                    <div className={['rounded-md transition-all',
                      isSelected ? 'ring-2 ring-red-500 opacity-50 scale-95'
                      : isSelectable ? 'hover:ring-2 hover:ring-red-300' : ''].join(' ')}>
                      <Card card={c} />
                    </div>
                  ) : <Ghost />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bet amounts */}
        <div className="flex gap-1 mt-0.5">
          <div className="flex-1 bg-slate-950/40 rounded-lg px-1.5 py-1 text-center">
            <div className="text-orange-300 text-[12px] uppercase tracking-wider">Initial Bet</div>
            <div className="text-white font-bold text-md">${initialBet}</div>
          </div>
          <div className="flex-1 bg-slate-950/40 rounded-lg px-1.5 py-1 text-center">
            <div className="text-orange-300 text-[12px] uppercase tracking-wider">Bonus Bet</div>
            <div className="text-white font-bold text-md">{bonusBet > 0 ? `$${bonusBet}` : '—'}</div>
          </div>
          <div className="flex-1 bg-slate-950/40 rounded-lg px-1.5 py-1 text-center">
            <div className="text-orange-300 text-sm uppercase tracking-wider">Back Up Bet</div>
            <div className="text-slate-200 font-bold text-md">{backupBet > 0 ? `$${backupBet}` : '—'}</div>
          </div>
        </div>

        </div>
      </div>

      {/* Bottom sheet — action panel */}
      <div className="flex-shrink-0 bg-slate-700 rounded-t-2xl px-3 pt-3 pb-4 max-h-[45vh] overflow-y-auto shadow-[0_-4px_24px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-2">

          {/* ── DRAWING ── */}
          {phase === 'DRAWING' && (
            <>
              {!boardReady ? (
                <p className="text-slate-200 text-xs text-center animate-pulse">Revealing board…</p>
              ) : (
                <>
                  <p className="text-slate-200 text-sm font-semibold">
                    Tap up to 2 cards to discard and draw replacements.
                  </p>
                  {discardSet.size > 0 && (
                    <p className="text-orange-400 text-sm">{discardSet.size} card{discardSet.size > 1 ? 's' : ''} selected for discard</p>
                  )}
                  <div className="flex gap-1.5">
                    <button onClick={() => { standPat(); setDiscardSet(new Set()); }}
                      className="flex-1 py-2 rounded-lg border-2 border-orange-400 text-slate-200 text-md font-semibold hover:bg-orange-500 hover:text-slate-200 transition">
                      Stand Pat
                    </button>
                    <button
                      onClick={() => {
                        drawCards([...discardSet]);
                        setDiscardSet(new Set());
                        setTimeout(() => revealDrawnCards(), 150);
                      }}
                      disabled={discardSet.size === 0}
                      className="flex-1 py-2 rounded-lg bg-orange-600 text-white text-md font-semibold hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition">
                      {discardSet.size === 0 ? 'Draw Cards' : `Draw ${discardSet.size} Card${discardSet.size > 1 ? 's' : ''}`}
                    </button>
                    <button onClick={surrenderDraw}
                      className="flex-1 py-2 rounded-lg border-2 border-red-600 text-slate-200 text-md font-semibold hover:bg-red-500 transition">
                      Surrender
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── CHOOSING — interactive row select + backup bet confirm ── */}
          {phase === 'CHOOSING' && board && (
            <>
              {!pendingRow ? (
                <p className="text-slate-500 text-xs text-center">Tap a board card to select your row</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-s font-semibold text-slate-200">
                      Row: <span className="text-orange-400">{rowLabel(pendingRow as RowChoice, board)}</span>
                    </span>
                    <button onClick={() => setPendingRow(null)}
                      className="text-[12px] text-slate-200 underline hover:text-slate-600">
                      Change
                    </button>
                  </div>

                  {/* Row description */}
                  <p className="text-[12px] text-slate-400">
                    {pendingRow === 'top'     && `${cardLabel(board.top)} · Center · Bottom`}
                    {pendingRow === 'right'   && `Left · Center · ${cardLabel(board.right)}`}
                    {pendingRow === 'mystery' && 'Left · Center · Bottom (face-down cards)'}
                    {pendingRow === 'both'    && `${cardLabel(board.top)} · ${cardLabel(board.right)} (face-up only)`}
                  </p>

                  <p className="text-s font-semibold text-slate-200">Back Up Bet:</p>
                  <div className="grid grid-cols-5 gap-1">
                    {backupOpts.map(amt => {
                      const ok = amt === 0 || amt <= balance;
                      return (
                        <button key={amt} onClick={() => ok && setPendingBackup(amt)} disabled={!ok}
                          className={['py-1.5 rounded-lg text-s font-semibold border transition',
                            pendingBackup === amt
                              ? 'bg-orange-600 text-slate-200 border-orange-600'
                              : ok ? 'border-orange-500 text-slate-200 hover:border-orange-400'
                                   : 'border-orange-200 text-slate-200 cursor-not-allowed'].join(' ')}>
                                  {`$${amt >= 1000 ? '1K' : amt}`}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => { confirmRowAndBet(pendingRow!, pendingBackup); }}
                    className="w-full bg-orange-600 text-white rounded-lg py-2 font-semibold text-s hover:bg-orange-500 transition">
                    Confirm Bet: ${initialBet + pendingBackup}
                  </button>
                </>
              )}
              <button onClick={surrender}
                className="w-full py-1.5 border bg-red-600 border-red-600 text-slate-200 rounded-lg text-s font-semibold hover:bg-red-600 transition">
                Surrender [Lose ${initialBet}]
              </button>
            </>
          )}

          {/* ── REVEAL ── */}
          {phase === 'REVEAL' && (
            <div className="flex flex-col gap-2">
              {revealStep < TOTAL_REVEAL ? (
                <p className="text-slate-400 text-xs text-center animate-pulse">Revealing cards…</p>
              ) : (
                <>
                  {showResult && (
                    <>
                      <div className="text-md font-semibold text-slate-200 text-center">{resultMessage}</div>

                      {/* Bonus win callout */}
                      {bonusBet > 0 && (
                        <div className={['rounded-lg px-3 py-2 text-center text-sm font-semibold',
                          bonusWin > 0 ? 'bg-slate-800 ring-2 ring-orange-500 text-slate-300'
                                       : 'bg-slate-800 text-slate-300'].join(' ')}>
                          {bonusWin > 0
                            ? `Bonus Bet wins $${bonusWin}! (${playerBestHand?.label})`
                            : `Bonus Bet — no win (${playerBestHand?.label})`}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div className={['rounded-lg p-2 text-center bg-slate-800',
                          winner === 'player' ? 'bg-emerald-50 ring-2 ring-emerald-400'
                          : winner === 'tie'  ? 'bg-yellow-50 ring-2 ring-yellow-300'
                          : 'bg-slate-50'].join(' ')}>
                          <p className="text-xs text-slate-300">Your Hand · {chosenRow ? rowLabel(chosenRow as RowChoice, board) : ''}</p>
                          <p className="font-semibold text-slate-300 text-sm">{playerBestHand?.label ?? '—'}</p>
                        </div>
                        <div className={['rounded-lg p-2 text-center bg-slate-800',
                          winner === 'dealer' ? 'bg-red-50 ring-2 ring-red-400'
                          : winner === 'tie'  ? 'bg-yellow-50 ring-2 ring-yellow-300'
                          : 'bg-slate-50'].join(' ')}>
                          <p className="text-xs text-slate-300">Dealer · {dealerChosenRow ? rowLabel(dealerChosenRow as RowChoice, board) : ''}</p>
                          <p className="font-semibold text-slate-300 text-sm">{dealerBestHand?.label ?? '—'}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {showBalance && (
                    replayBonus ? (
                    /* ── Inline bonus picker for next game ── */
                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-s font-semibold text-slate-200">
                          Next game: <span className="text-orange-500">${replayBonus.bet}</span>
                        </span>
                        <button onClick={() => setReplayBonus(null)} className="text-[10px] text-slate-400 underline hover:text-slate-600">Cancel</button>
                      </div>
                      <div className="flex items-center justify-between"><p className="text-s font-semibold text-slate-200">Add a Bonus Bet?</p><BonusPayoutsButton className="text-orange-400 text-xs underline hover:text-emerald-900" /></div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {BONUS_OPTIONS.filter(b => b === 0 || b <= balance - replayBonus.bet).map(b => (
                          <button key={b}
                            onClick={() => setReplayBonus(prev => prev ? { ...prev, bonus: b } : prev)}
                            className={['py-1.5 rounded-lg text-md font-semibold border transition',
                              replayBonus.bonus === b
                                ? 'bg-orange-700 border-orange-700 text-white'
                                : 'border-orange-500 text-slate-200 hover:bg-orange-5000 hover:border-orange-500'].join(' ')}>
                            {b === 0 ? 'No Thanks' : `$${b}`}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => launchGame(replayBonus.bet, replayBonus.bonus)}
                        disabled={replayBonus.bet > balance}
                        className="w-full bg-orange-700 text-white rounded-lg py-2 font-bold text-s hover:bg-orange-600 disabled:opacity-40 transition">
                        Deal: ${replayBonus.bet + replayBonus.bonus}
                      </button>
                    </div>
                  ) : balance <= 0 ? (
                    <div className="flex gap-2">
                      <button onClick={reset} className="flex-1 bg-emerald-700 text-white rounded-lg py-2 text-sm font-semibold">Reset to $1,000</button>
                      <button onClick={onBack} className="border border-slate-200 text-slate-600 rounded-lg px-3 py-2 text-sm font-semibold">Home</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => beginReplay(initialBet)} disabled={initialBet > balance}
                        className="py-2 px-3 bg-orange-700 text-white rounded-lg text-md font-semibold hover:bg-orange-600 disabled:opacity-40 transition">
                        Replay ${initialBet}
                      </button>
                      <div className="relative">
                        <button onClick={() => { setEndChoice(endChoice === 'changeBet' ? null : 'changeBet'); setPendingBet(null); }}
                          className={['py-2 px-3 rounded-lg text-sm font-semibold border-2 transition flex items-center gap-1',
                            endChoice === 'changeBet' ? 'bg-orange-600 border-orange-600 text-white'
                                                      : 'border-orange-500 text-slate-200'].join(' ')}>
                          {pendingBet ? `$${pendingBet >= 1000 ? '1K' : pendingBet}` : 'Change Bet'}
                          <span className="text-xs opacity-70">{endChoice === 'changeBet' ? '▲' : '▼'}</span>
                        </button>
                        {endChoice === 'changeBet' && (
                          <div className="absolute bottom-full mb-1 left-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-2 grid grid-cols-2 gap-1 min-w-[130px]">
                            {BET_OPTIONS.map(b => (
                              <button key={b} onClick={() => { if (b <= balance) { setPendingBet(b); setEndChoice(null); } }} disabled={b > balance}
                                className={['py-1.5 rounded-lg text-sm font-semibold text-center transition',
                                  pendingBet === b ? 'bg-blue-100 text-blue-700'
                                  : b <= balance ? 'hover:bg-slate-100 text-slate-700'
                                  : 'text-slate-300 cursor-not-allowed'].join(' ')}>
                                ${b >= 1000 ? '1K' : b}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {pendingBet && (
                        <button onClick={() => beginReplay(pendingBet)} disabled={pendingBet > balance}
                          className="py-2 px-3 bg-orange-700 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 transition">
                          Pick Bonus →
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── GAME_OVER (surrender) ── */}
          {phase === 'GAME_OVER' && (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-bold text-slate-800">{resultMessage}</div>
              {replayBonus ? (
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">Next game: <span className="text-emerald-700">${replayBonus.bet}</span></span>
                    <button onClick={() => setReplayBonus(null)} className="text-[10px] text-slate-300 underline hover:text-slate-600">Cancel</button>
                  </div>
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-200">Add a Bonus Bet?</p><BonusPayoutsButton className="text-orange-400 text-xs underline hover:text-orange-400" /></div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BONUS_OPTIONS.filter(b => b === 0 || b <= balance - replayBonus.bet).map(b => (
                      <button key={b}
                        onClick={() => setReplayBonus(prev => prev ? { ...prev, bonus: b } : prev)}
                        className={['py-1.5 rounded-lg text-xs font-semibold border transition',
                          replayBonus.bonus === b
                            ? 'bg-emerald-700 border-emerald-700 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-400'].join(' ')}>
                        {b === 0 ? 'No Thanks' : `$${b}`}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => launchGame(replayBonus.bet, replayBonus.bonus)} disabled={replayBonus.bet > balance}
                    className="w-full bg-emerald-700 text-white rounded-lg py-2 font-bold text-sm hover:bg-emerald-600 disabled:opacity-40 transition">
                    Deal — ${replayBonus.bet + replayBonus.bonus}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => beginReplay(initialBet)} disabled={initialBet > balance}
                    className="flex-1 bg-emerald-700 text-white rounded-lg py-2 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-40 transition">
                    Replay ${initialBet}
                  </button>
                  <button onClick={resetGame} className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm font-semibold hover:bg-slate-50 transition">New Bet</button>
                  <button onClick={onBack} className="border border-slate-200 text-slate-600 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">Home</button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}