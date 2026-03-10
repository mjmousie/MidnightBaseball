import { useState, useEffect, useRef } from 'react';
import { useIronCrossStore } from '../../store/IronCrossStore';
import { useBalanceStore } from '../../store/balanceStore';
import { Card } from '../Card';
import { RulesButton, BonusPayoutsButton } from '../RulesModal';
import { cardLabel } from '../../utils/deck';
import type { RowChoice } from '../../types/ironCross';

const BET_OPTIONS = [5, 10, 25, 50];
const BONUS_OPTIONS = [0, 5, 25];

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
  bottom: 'mystery',
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
  const [bonusBet, setBonusBet]  = useState(0);

  const startGame = () => initGame(chosenBet, bonusBet);

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
        <button onClick={onBack} className="text-slate-400 text-sm block mb-4 text-left">← Back</button>
        <div className="text-4xl mb-2">⛨</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Iron Cross</h1>
        <p className="text-slate-500 text-sm mb-1">Player vs Dealer · Poker Game</p>
        <div className="mb-4"><RulesButton defaultTab="ironCross" className="text-emerald-700 text-xs underline" /></div>
        <p className="text-emerald-700 font-semibold mb-6">
          Balance: <span className="text-2xl font-bold">${balance.toLocaleString()}</span>
        </p>

        {balance <= 0 ? (
          <div>
            <div className="text-5xl mb-3">💸</div>
            <p className="text-slate-500 text-sm mb-4">You're out of chips!</p>
            <button onClick={reset} className="w-full bg-emerald-700 text-white rounded-lg py-3 font-semibold">
              Reset to $1,000
            </button>
          </div>
        ) : step === 'bet' ? (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Choose your initial bet</p>
            <div className="grid grid-cols-4 gap-2">
              {BET_OPTIONS.map(b => {
                const ok = b <= balance;
                return (
                  <button key={b} onClick={() => { if (ok) { setChosenBet(b); setBonusBet(0); setStep('bonus'); } }}
                    disabled={!ok}
                    className={['py-2.5 rounded-lg text-sm font-semibold border transition',
                      ok ? 'border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-400'
                         : 'border-slate-100 text-slate-300 cursor-not-allowed'].join(' ')}>
                    ${b >= 1000 ? '1K' : b}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="text-slate-700 font-semibold mb-1">Initial Bet: <span className="text-emerald-700">${chosenBet}</span></p>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add a Bonus Bet?</p>
              <BonusPayoutsButton className="text-emerald-700 text-xs underline hover:text-emerald-900" />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {BONUS_OPTIONS.filter(b => b === 0 || b <= balance - chosenBet).map(b => (
                <button key={b} onClick={() => setBonusBet(b)}
                  className={['py-2 rounded-lg text-sm font-semibold border transition',
                    bonusBet === b ? 'bg-emerald-700 border-emerald-700 text-white'
                                  : 'border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-400'].join(' ')}>
                  {b === 0 ? 'No Thanks' : `$${b}`}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('bet')}
                className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm font-semibold hover:bg-slate-50 transition">
                ← Back
              </button>
              <button onClick={startGame}
                className="flex-1 bg-emerald-700 text-white rounded-lg py-2 text-sm font-bold hover:bg-emerald-600 transition">
                Deal{bonusBet > 0 ? ` — $${chosenBet + bonusBet}` : ` — $${chosenBet}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Ghost slot ────────────────────────────────────────────────────────────────
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
          highlighted ? 'ring-2 ring-yellow-400' : '',
          interactive && !highlighted ? 'hover:ring-2 hover:ring-yellow-200' : '',
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
      <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-0.5">{label}</p>
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
    drawCards, standPat, flipTopCard, flipRightCard, revealDrawnCards,
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
        if (step < TOTAL_REVEAL) revealTimer.current = setTimeout(tick, 700);
      };
      revealTimer.current = setTimeout(tick, 400);
    }
    return () => { if (revealTimer.current) clearTimeout(revealTimer.current); };
  }, [phase]);

  if (phase === 'SETUP') return <IronCrossSetup onBack={onBack} />;

  // beginReplay: show inline bonus picker before starting next game
  const beginReplay = (bet: number) => {
    setEndChoice(null); setPendingBet(null); setPendingRow(null);
    setReplayBonus({ bet, bonus: 0 });
  };

  // launchGame: actually start, resetting all animation state
  const launchGame = (bet: number, bonus: number) => {
    setPendingBackup(0); setEndChoice(null); setPendingBet(null);
    setDiscardSet(new Set()); setPendingRow(null); setReplayBonus(null);
    setRevealStep(0); setBoardReady(false);
    initGame(bet, bonus);
  };

  const backupOpts = [0, 1, 2, 3, 4].map(m => m * initialBet);

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
    <div className="min-h-screen bg-emerald-900 p-3 flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col gap-2">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-white/60 hover:text-white text-sm underline">← Home</button>
            <h1 className="text-white font-bold text-sm">⛨ Iron Cross</h1>
          </div>
          <div className="flex items-center gap-2">
            <RulesButton defaultTab="ironCross" />
            <BonusPayoutsButton />
            <span className="text-emerald-300 text-xs font-semibold">
              Balance: <span className="text-white">${balance.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* Dealer */}
        <HandRow label="🤵 Dealer" slots={dealerSlots} gameId={gameId} />

        {/* Board */}
        <div>
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
            <p className="text-yellow-300/70 text-[10px] text-center mt-0.5">
              Tap a card to select its row
            </p>
          )}
          {phase === 'REVEAL' && chosenRow && (
            <p className="text-yellow-300 text-[10px] font-semibold text-center mt-0.5">
              Your Row: {rowLabel(chosenRow as RowChoice, board)}
            </p>
          )}
        </div>

        {/* Player hand */}
        <div className="w-full">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-0.5">🟢 Your Hand</p>
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
        <div className="flex gap-1.5">
          <div className="flex-1 bg-emerald-950/40 rounded-lg px-2 py-1 text-center">
            <div className="text-emerald-300 text-[10px] uppercase tracking-wider">Initial Bet</div>
            <div className="text-white font-bold text-sm">${initialBet}</div>
          </div>
          <div className="flex-1 bg-emerald-950/40 rounded-lg px-2 py-1 text-center">
            <div className="text-emerald-300 text-[10px] uppercase tracking-wider">Bonus Bet</div>
            <div className="text-white font-bold text-sm">{bonusBet > 0 ? `$${bonusBet}` : '—'}</div>
          </div>
          <div className="flex-1 bg-emerald-950/40 rounded-lg px-2 py-1 text-center">
            <div className="text-emerald-300 text-[10px] uppercase tracking-wider">Back Up Bet</div>
            <div className="text-white font-bold text-sm">{backupBet > 0 ? `$${backupBet}` : '—'}</div>
          </div>
        </div>

        {/* Action panel */}
        <div className="bg-white rounded-xl p-3 flex flex-col gap-2">

          {/* ── DRAWING ── */}
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
                    <button onClick={() => { standPat(); setDiscardSet(new Set()); }}
                      className="flex-1 py-2 rounded-lg border-2 border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition">
                      Stand Pat
                    </button>
                    <button
                      onClick={() => {
                        drawCards([...discardSet]);
                        setDiscardSet(new Set());
                        setTimeout(() => revealDrawnCards(), 150);
                      }}
                      disabled={discardSet.size === 0}
                      className="flex-1 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition">
                      {discardSet.size === 0 ? 'Draw Cards' : `Draw ${discardSet.size} Card${discardSet.size > 1 ? 's' : ''}`}
                    </button>
                    <button onClick={surrenderDraw}
                      className="flex-1 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition">
                      Surrender<br/><span className="text-[9px]">lose ${Math.floor(initialBet / 2)}</span>
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
                    <span className="text-xs font-semibold text-slate-700">
                      Row: <span className="text-emerald-700">{rowLabel(pendingRow as RowChoice, board)}</span>
                    </span>
                    <button onClick={() => setPendingRow(null)}
                      className="text-[10px] text-slate-400 underline hover:text-slate-600">
                      Change
                    </button>
                  </div>

                  {/* Row description */}
                  <p className="text-[10px] text-slate-400">
                    {pendingRow === 'top'     && `${cardLabel(board.top)} · Center · Bottom`}
                    {pendingRow === 'right'   && `Left · Center · ${cardLabel(board.right)}`}
                    {pendingRow === 'mystery' && 'Left · Center · Bottom (face-down cards)'}
                    {pendingRow === 'both'    && `${cardLabel(board.top)} · ${cardLabel(board.right)} (face-up only)`}
                  </p>

                  <p className="text-xs font-semibold text-slate-600">Back Up Bet:</p>
                  <div className="grid grid-cols-5 gap-1">
                    {backupOpts.map(amt => {
                      const ok = amt === 0 || amt <= balance;
                      return (
                        <button key={amt} onClick={() => ok && setPendingBackup(amt)} disabled={!ok}
                          className={['py-1.5 rounded-lg text-xs font-semibold border transition',
                            pendingBackup === amt
                              ? 'bg-emerald-700 border-emerald-700 text-white'
                              : ok ? 'border-slate-200 text-slate-700 hover:border-emerald-400'
                                   : 'border-slate-100 text-slate-300 cursor-not-allowed'].join(' ')}>
                          {amt === 0 ? 'Skip' : `$${amt >= 1000 ? '1K' : amt}`}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => { confirmRowAndBet(pendingRow!, pendingBackup); }}
                    className="w-full bg-emerald-700 text-white rounded-lg py-2 font-bold text-xs hover:bg-emerald-600 transition">
                    Confirm — Total: ${initialBet + pendingBackup}
                  </button>
                </>
              )}
              <button onClick={surrender}
                className="w-full py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition">
                Surrender — forfeit ${initialBet}
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
                  <div className="text-sm font-bold text-slate-800">{resultMessage}</div>

                  {/* Bonus win callout */}
                  {bonusBet > 0 && (
                    <div className={['rounded-lg px-3 py-2 text-center text-xs font-semibold',
                      bonusWin > 0 ? 'bg-yellow-50 ring-2 ring-yellow-400 text-yellow-800'
                                   : 'bg-slate-50 text-slate-400'].join(' ')}>
                      {bonusWin > 0
                        ? `🎰 Bonus Bet wins $${bonusWin}! (${playerBestHand?.label})`
                        : `Bonus Bet — no win (${playerBestHand?.label})`}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className={['rounded-lg p-2 text-center',
                      winner === 'player' ? 'bg-emerald-50 ring-2 ring-emerald-400'
                      : winner === 'tie'  ? 'bg-yellow-50 ring-2 ring-yellow-300'
                      : 'bg-slate-50'].join(' ')}>
                      <p className="text-[10px] text-slate-500">Your Hand · {chosenRow ? rowLabel(chosenRow as RowChoice, board) : ''}</p>
                      <p className="font-bold text-slate-800 text-xs">{playerBestHand?.label ?? '—'}</p>
                    </div>
                    <div className={['rounded-lg p-2 text-center',
                      winner === 'dealer' ? 'bg-red-50 ring-2 ring-red-400'
                      : winner === 'tie'  ? 'bg-yellow-50 ring-2 ring-yellow-300'
                      : 'bg-slate-50'].join(' ')}>
                      <p className="text-[10px] text-slate-500">Dealer · {dealerChosenRow ? rowLabel(dealerChosenRow as RowChoice, board) : ''}</p>
                      <p className="font-bold text-slate-800 text-xs">{dealerBestHand?.label ?? '—'}</p>
                    </div>
                  </div>

                  {replayBonus ? (
                    /* ── Inline bonus picker for next game ── */
                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          Next game: <span className="text-emerald-700">${replayBonus.bet}</span>
                        </span>
                        <button onClick={() => setReplayBonus(null)} className="text-[10px] text-slate-400 underline hover:text-slate-600">Cancel</button>
                      </div>
                      <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-600">Add a Bonus Bet?</p><BonusPayoutsButton className="text-emerald-700 text-xs underline hover:text-emerald-900" /></div>
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
                      <button
                        onClick={() => launchGame(replayBonus.bet, replayBonus.bonus)}
                        disabled={replayBonus.bet > balance}
                        className="w-full bg-emerald-700 text-white rounded-lg py-2 font-bold text-sm hover:bg-emerald-600 disabled:opacity-40 transition">
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
                        className="py-2 px-3 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 disabled:opacity-40 transition">
                        Replay ${initialBet}
                      </button>
                      <div className="relative">
                        <button onClick={() => { setEndChoice(endChoice === 'changeBet' ? null : 'changeBet'); setPendingBet(null); }}
                          className={['py-2 px-3 rounded-lg text-sm font-semibold border-2 transition flex items-center gap-1',
                            endChoice === 'changeBet' ? 'bg-blue-600 border-blue-600 text-white'
                                                      : 'border-slate-300 text-slate-700'].join(' ')}>
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
                          className="py-2 px-3 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-500 disabled:opacity-40 transition">
                          Pick Bonus →
                        </button>
                      )}
                    </div>
                  )}
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
                    <span className="text-xs font-semibold text-slate-700">Next game: <span className="text-emerald-700">${replayBonus.bet}</span></span>
                    <button onClick={() => setReplayBonus(null)} className="text-[10px] text-slate-400 underline hover:text-slate-600">Cancel</button>
                  </div>
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-600">Add a Bonus Bet?</p><BonusPayoutsButton className="text-emerald-700 text-xs underline hover:text-emerald-900" /></div>
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
