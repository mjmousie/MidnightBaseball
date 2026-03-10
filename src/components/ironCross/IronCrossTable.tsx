import { useState, useEffect, useRef } from 'react';
import { useIronCrossStore } from '../../store/IronCrossStore';
import { useBalanceStore } from '../../store/balanceStore';
import { Card } from '../Card';
import { RulesButton } from '../RulesModal';
import { cardLabel } from '../../utils/deck';
import type { RowChoice } from '../../types/ironCross';

const BET_OPTIONS = [5, 10, 25, 50, 100, 200, 500, 1000];

const ROW_LABELS: Record<RowChoice, string> = { top: 'Top Row', right: 'Right Row', mystery: 'Mystery', both: 'Both Revealed' };
const ROW_DESC:   Record<RowChoice, string> = { top: 'Top·Ctr·Bot', right: 'L·Ctr·R', mystery: 'L·Ctr·Bot', both: 'Top·Right' };

function boardPositionsForRow(row: RowChoice) {
  if (row === 'top')     return ['top', 'center', 'bottom'];
  if (row === 'right')   return ['left', 'center', 'right'];
  if (row === 'both')    return ['top', 'right'];
  return ['left', 'center', 'bottom'];
}

// Setup -----------------------------------------------------------------------

function IronCrossSetup({ onBack }: { onBack: () => void }) {
  const { balance, reset } = useBalanceStore();
  const { initGame } = useIronCrossStore();
  return (
    <div className="min-h-screen bg-emerald-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
        <button onClick={onBack} className="text-slate-400 text-sm block mb-4 text-left">← Back</button>
        <div className="text-4xl mb-2">⛨</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Iron Cross</h1>
        <p className="text-slate-500 text-sm mb-1">Player vs Dealer · Poker Game</p>
        <div className="mb-4"><RulesButton defaultTab="ironCross" className="text-emerald-700 text-xs underline" /></div>
        <p className="text-slate-700 font-semibold mb-6">Balance: <span className="text-2xl font-bold">${balance.toLocaleString()}</span></p>
        {balance <= 0 ? (
          <div>
            <div className="text-5xl mb-3">💸</div>
            <p className="text-slate-500 text-sm mb-4">You're out of chips!</p>
            <button onClick={reset} className="w-full bg-red-700 text-white rounded-lg py-3 font-semibold">Reset to $1,000</button>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Choose your initial bet</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {BET_OPTIONS.map(b => {
                const ok = b <= balance;
                return (
                  <button key={b} onClick={() => ok && initGame(b)} disabled={!ok}
                    className={['py-2.5 rounded-lg text-sm font-semibold border transition', ok ? 'border-slate-200 text-emerald-700 hover:bg-emerald-700 hover:text-white hover:border-emerald-700' : 'border-slate-100 text-slate-300 cursor-not-allowed'].join(' ')}>
                    ${b >= 1000 ? '1K' : b}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Ghost slot ------------------------------------------------------------------
function Ghost() { return <div className="w-full aspect-[5/7]" />; }

// Board cross -----------------------------------------------------------------
// Every row is 7 flex-1 slots — identical width to the hand rows.
// Vertical bar (top/center/bottom) is at slot index 3 (center of 7).
// Horizontal bar (left/center/right) is at slot indices 2, 3, 4.

function BoardCross({ board, highlightRow, gameId }: {
  board: NonNullable<ReturnType<typeof useIronCrossStore.getState>['board']>;
  highlightRow: RowChoice | null;
  gameId: number;
}) {
  const h = new Set(highlightRow ? boardPositionsForRow(highlightRow) : []);
  const g = <div className="flex-1 min-w-0"><Ghost /></div>;
  const slot = (card: any, pos: string) => (
    <div key={`${gameId}-${pos}`} className={['flex-1 min-w-0', h.has(pos) ? 'ring-2 ring-yellow-400 rounded-md' : ''].join(' ')}>
      <Card card={card} />
    </div>
  );

  return (
    <div className="w-full flex flex-col">
      <div className="flex w-full">{g}{g}{g}{slot(board.top,'top')}{g}{g}{g}</div>
      <div className="flex w-full">{g}{g}{slot(board.left,'left')}{slot(board.center,'center')}{slot(board.right,'right')}{g}{g}</div>
      <div className="flex w-full">{g}{g}{g}{slot(board.bottom,'bottom')}{g}{g}{g}</div>
    </div>
  );
}

// Hand row — defined at module level so it never remounts on parent re-render
function HandRow({ label, slots, gameId }: { label: string; slots: (any|null)[]; gameId: number }) {
  return (
    <div className="w-full">
      <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-0.5">{label}</p>
      <div className="flex w-full">
        {slots.map((c, i) => (
          <div key={`${gameId}-${c?.id ?? `g${i}`}`} className="flex-1 min-w-0">
            {c ? <Card card={c} /> : <Ghost />}
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Table ------------------------------------------------------------------

export function IronCrossTable({ onBack }: { onBack: () => void }) {
  const { balance, reset } = useBalanceStore();
  const {
    phase, gameId, playerHand, dealerHand, board,
    chosenRow, dealerChosenRow,
    initialBet, backupBet, totalWagered,
    playerBestHand, dealerBestHand,
    winner, resultMessage,
    chooseRow, surrender, surrenderDraw, placeBackupBet, resetGame, initGame,
    drawCards, standPat, flipTopCard, flipRightCard,
  } = useIronCrossStore();

  const [pendingBackup, setPendingBackup] = useState(0);
  const [endChoice, setEndChoice]         = useState<null | 'changeBet'>(null);
  const [pendingBet, setPendingBet]       = useState<number | null>(null);
  const [discardSet, setDiscardSet]       = useState<Set<number>>(new Set());
  const [boardReady, setBoardReady]       = useState(false); // true once both top+right flipped

  const boardRevealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // revealStep: drives the REVEAL phase stagger for left/center/bottom + dealer cards
  const TOTAL_REVEAL = 8;
  const [revealStep, setRevealStep] = useState(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When phase becomes DRAWING, flip top then right via store actions
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

  // When phase becomes REVEAL, stagger remaining cards
  useEffect(() => {
    if (phase === 'REVEAL') {
      setRevealStep(0);
      let step = 0;
      const tick = () => {
        step += 1;
        setRevealStep(step);
        if (step < TOTAL_REVEAL) revealTimer.current = setTimeout(tick, 700);
      };
      revealTimer.current = setTimeout(tick, 400);
    }
    return () => { if (revealTimer.current) clearTimeout(revealTimer.current); };
  }, [phase]);

  if (phase === 'SETUP') return <IronCrossSetup onBack={onBack} />;

  const startNew = (bet: number) => {
    setPendingBackup(0); setEndChoice(null); setPendingBet(null);
    setDiscardSet(new Set());
    setRevealStep(0);
    setBoardReady(false);
    initGame(bet);
  };
  const backupOpts = [0, 1, 2, 3, 4].map(m => m * initialBet);

  // visBoard: top/right use store directly (flipped by store actions),
  // left/center/bottom stagger during REVEAL phase only.
  const visBoard = board ? {
    top:    board.top,
    right:  board.right,
    left:   { ...board.left,   faceUp: phase === 'REVEAL' ? revealStep >= 1 : board.left.faceUp   },
    center: { ...board.center, faceUp: phase === 'REVEAL' ? revealStep >= 2 : board.center.faceUp },
    bottom: { ...board.bottom, faceUp: phase === 'REVEAL' ? revealStep >= 3 : board.bottom.faceUp },
  } : null;

  const visDealer = dealerHand.map((c, i) => ({
    ...c,
    faceUp: phase === 'REVEAL' ? revealStep >= i + 4 : c.faceUp,
  }));

  // 7-slot rows: ghost + 5 cards + ghost  (cards centred)
  const dealerSlots: (any|null)[] = [null, ...visDealer, null];
  const playerSlots: (any|null)[] = [null, ...playerHand, null];

  return (
    <div className="min-h-screen bg-emerald-800 p-3 flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col gap-2">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-white/60 hover:text-white text-sm underline">← Home</button>
            <h1 className="text-white font-bold text-sm">⛨ Iron Cross</h1>
          </div>
          <div className="flex items-center gap-2">
            <RulesButton defaultTab="ironCross" />
            <span className="text-emerald-300 text-xs font-semibold">Balance: <span className="text-white">${balance.toLocaleString()}</span></span>
          </div>
        </div>

        {/* Wager info */}
        <div className="flex gap-1.5">
          <div className="flex-1 bg-emerald-900/40 rounded-lg px-2 py-1 text-center">
            <div className="text-emerald-300 text-[10px] uppercase tracking-wider">Initial Bet</div>
            <div className="text-white font-bold text-sm">${initialBet}</div>
          </div>
          {phase !== 'CHOOSING' && phase !== 'BACKING' && backupBet > 0 && (
            <div className="flex-1 bg-emerald-900/40 rounded-lg px-2 py-1 text-center">
              <div className="text-emerald-300 text-[10px] uppercase tracking-wider">Back Up</div>
              <div className="text-white font-bold text-sm">${backupBet}</div>
            </div>
          )}
          <div className="flex-1 bg-emerald-900/40 rounded-lg px-2 py-1 text-center">
            <div className="text-emerald-300 text-[10px] uppercase tracking-wider">Total</div>
            <div className="text-white font-bold text-sm">${totalWagered}</div>
          </div>
        </div>

        {/* Dealer */}
        <HandRow label="🤵 Dealer" slots={dealerSlots} gameId={gameId} />

        {/* Board */}
        <div>
          <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider text-center mb-0.5">The Iron Cross</p>
          {visBoard && <BoardCross board={visBoard} highlightRow={phase === 'BACKING' || phase === 'REVEAL' ? chosenRow : null} gameId={gameId} />}
          {chosenRow && (phase === 'BACKING' || phase === 'REVEAL') && (
            <p className="text-yellow-300 text-[10px] font-semibold text-center mt-0.5">
              {ROW_LABELS[chosenRow]}: {boardPositionsForRow(chosenRow).join(' · ')}
            </p>
          )}
        </div>

        {/* Player */}
        <div className="w-full">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-0.5">🧑 Your Hand</p>
          <div className="flex w-full">
            {playerSlots.map((c, i) => {
              const cardIndex = i - 1; // slots are [null, c0, c1, c2, c3, c4, null]
              const isSelectable = phase === 'DRAWING' && c !== null;
              const isSelected   = discardSet.has(cardIndex);
              return (
                <div key={`${gameId}-${c?.id ?? `g${i}`}`}
                  className={['flex-1 min-w-0 transition', isSelectable ? 'cursor-pointer' : ''].join(' ')}
                  onClick={() => {
                    if (!isSelectable) return;
                    setDiscardSet(prev => {
                      const next = new Set(prev);
                      if (next.has(cardIndex)) { next.delete(cardIndex); }
                      else if (next.size < 2)  { next.add(cardIndex); }
                      return next;
                    });
                  }}
                >
                  {c ? (
                    <div className={['rounded-md transition-all', isSelected ? 'ring-2 ring-red-500 opacity-50 scale-95' : isSelectable ? 'hover:ring-2 hover:ring-red-300' : ''].join(' ')}>
                      <Card card={c} />
                    </div>
                  ) : <Ghost />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action panel */}
        <div className="bg-white rounded-xl p-3 flex flex-col gap-2">

          {phase === 'DRAWING' && (
            <>
              {!boardReady ? (
                <p className="text-slate-400 text-xs text-center animate-pulse">Revealing board…</p>
              ) : (
                <>
                  <p className="text-slate-600 text-xs font-semibold">
                    Tap up to 2 cards to discard and draw replacements.
                  </p>
                  {discardSet.size > 0 && (
                    <p className="text-red-600 text-xs">{discardSet.size} card{discardSet.size > 1 ? 's' : ''} selected for discard</p>
                  )}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { standPat(); setDiscardSet(new Set()); }}
                      className="flex-1 py-2 rounded-lg border-2 border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                    >
                      Stand Pat
                    </button>
                    <button
                      onClick={() => { drawCards([...discardSet]); setDiscardSet(new Set()); }}
                      disabled={discardSet.size === 0}
                      className="flex-1 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      {discardSet.size === 0 ? 'Draw Cards' : `Draw ${discardSet.size} Card${discardSet.size > 1 ? 's' : ''}`}
                    </button>
                    <button
                      onClick={surrenderDraw}
                      className="flex-1 py-2 rounded-lg border bg-red-600 border-red-200 text-white text-xs font-semibold"
                    >
                      Surrender<br/><span className="text-[9px]">lose ${Math.floor(initialBet / 2)}</span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {phase === 'CHOOSING' && board && (
            <>
              <p className="text-slate-600 text-xs font-semibold">Pick your row:</p>
              <div className="flex gap-1.5">
                <button onClick={() => chooseRow('top')}
                  className="flex-1 py-2 px-1 rounded-lg border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 text-center transition">
                  <p className="font-semibold text-slate-800 text-xs">{cardLabel(board.top)} Row</p>
                </button>
                <button onClick={() => chooseRow('right')}
                  className="flex-1 py-2 px-1 rounded-lg border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 text-center transition">
                  <p className="font-semibold text-slate-800 text-xs">{cardLabel(board.right)} Row</p>
                </button>
                <button onClick={() => chooseRow('both')}
                  className="flex-1 py-2 px-1 rounded-lg border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 text-center transition">
                  <p className="font-semibold text-slate-800 text-xs">{cardLabel(board.top)}&amp;{cardLabel(board.right)}</p>
                </button>
                <button onClick={() => chooseRow('mystery')}
                  className="flex-1 py-2 px-1 rounded-lg border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 text-center transition">
                  <p className="font-semibold text-slate-800 text-xs">Mystery</p>
                </button>
              </div>
              <button onClick={surrender}
                className="w-full py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition">
                Surrender — forfeit ${initialBet}
              </button>
            </>
          )}

          {phase === 'BACKING' && (
            <>
              <p className="text-slate-700 text-xs font-semibold">
                <span className="text-emerald-700">{ROW_LABELS[chosenRow!]}</span> selected. Back Up Bet:
              </p>
              <div className="grid grid-cols-5 gap-1">
                {backupOpts.map(amt => {
                  const ok = amt === 0 || amt <= balance;
                  return (
                    <button key={amt} onClick={() => ok && setPendingBackup(amt)} disabled={!ok}
                      className={['py-1.5 rounded-lg text-xs font-semibold border transition', pendingBackup === amt ? 'bg-emerald-500 border-emerald-500 text-white' : ok ? 'border-slate-200 text-slate-700 hover:border-emerald-400' : 'border-slate-100 text-slate-300 cursor-not-allowed'].join(' ')}>
                      {amt === 0 ? 'Skip' : `$${amt >= 1000 ? '1K' : amt}`}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => placeBackupBet(pendingBackup)} className="w-full bg-emerald-600 text-white rounded-lg py-2 font-bold text-s transition">
                Confirm Total Bet: ${initialBet + pendingBackup}
              </button>
            </>
          )}

          {phase === 'REVEAL' && (
            <div className="flex flex-col gap-2">
              {revealStep < TOTAL_REVEAL ? (
                <p className="text-slate-400 text-xs text-center animate-pulse">Revealing cards…</p>
              ) : (
                <>
                  <div className="text-sm font-bold text-slate-800">{resultMessage}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={['rounded-lg p-2 text-center', winner === 'player' ? 'bg-emerald-50 ring-2 ring-emerald-400' : winner === 'tie' ? 'bg-slate-50 ring-2 ring-slate-500' : 'ring-2 ring-slate-50'].join(' ')}>
                      <p className="text-[10px] text-slate-500">Your Hand · {chosenRow ? ROW_LABELS[chosenRow] : ''}</p>
                      <p className="font-bold text-slate-800 text-xs">{playerBestHand?.label ?? '—'}</p>
                    </div>
                    <div className={['rounded-lg p-2 text-center', winner === 'dealer' ? 'bg-red-50 ring-2 ring-red-400' : winner === 'tie' ? 'bg-slate-50 ring-2 ring-slate-50' : 'ring-2 ring-slate-50'].join(' ')}>
                      <p className="text-[10px] text-slate-500">Dealer · {dealerChosenRow ? ROW_LABELS[dealerChosenRow] : ''}</p>
                      <p className="font-bold text-slate-800 text-xs">{dealerBestHand?.label ?? '—'}</p>
                    </div>
                  </div>
                  {balance <= 0 ? (
                    <div className="flex gap-2">
                      <button onClick={reset} className="flex-1 bg-red-700 text-white rounded-lg py-2 text-sm font-semibold">Reset to $1,000</button>
                      <button onClick={onBack} className="border border-slate-200 text-slate-600 rounded-lg px-3 py-2 text-sm font-semibold">Home</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => startNew(initialBet)} disabled={initialBet > balance}
                        className="py-2 px-3 bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-40 transition">
                        Replay ${initialBet}
                      </button>
                      <div className="relative">
                        <button onClick={() => { setEndChoice(endChoice === 'changeBet' ? null : 'changeBet'); setPendingBet(null); }}
                          className={['py-2 px-3 rounded-lg text-sm font-semibold border-2 transition flex items-center gap-1', endChoice === 'changeBet' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-700'].join(' ')}>
                          {pendingBet ? `$${pendingBet >= 1000 ? '1K' : pendingBet}` : 'Change Bet'}
                          <span className="text-xs opacity-70">{endChoice === 'changeBet' ? '▲' : '▼'}</span>
                        </button>
                        {endChoice === 'changeBet' && (
                          <div className="absolute bottom-full mb-1 left-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-2 grid grid-cols-2 gap-1 min-w-[130px]">
                            {BET_OPTIONS.map(b => (
                              <button key={b} onClick={() => { if (b <= balance) { setPendingBet(b); setEndChoice(null); } }} disabled={b > balance}
                                className={['py-1.5 rounded-lg text-sm font-semibold text-center transition', pendingBet === b ? 'bg-blue-100 text-blue-700' : b <= balance ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'].join(' ')}>
                                ${b >= 1000 ? '1K' : b}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {pendingBet && (
                        <button onClick={() => startNew(pendingBet)} disabled={pendingBet > balance}
                          className="py-2 px-3 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-500 disabled:opacity-40 transition">
                          Play Now →
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {phase === 'GAME_OVER' && (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-bold text-slate-800">{resultMessage}</div>
              <div className="flex gap-2">
                <button onClick={() => startNew(initialBet)} disabled={initialBet > balance}
                  className="flex-1 bg-red-700 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-600 disabled:opacity-40 transition">
                  Replay ${initialBet}
                </button>
                <button onClick={resetGame} className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm font-semibold hover:bg-slate-50 transition">New Bet</button>
                <button onClick={onBack}    className="border border-slate-200 text-slate-600 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">Home</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
