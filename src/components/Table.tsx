import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useGameStore } from '../store/GameStore';
import { PlayerHand } from './PlayerHand';
import { Card } from './Card';

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function SetupScreen() {
  const { initGame } = useGame();
  const [names, setNames] = useState(['Alice', 'Bob', 'Charlie']);

  const addPlayer = () => {
    if (names.length < 7) setNames([...names, `Player ${names.length + 1}`]);
  };
  const removePlayer = (i: number) =>
    setNames(names.filter((_, idx) => idx !== i));
  const updateName = (i: number, val: string) =>
    setNames(names.map((n, idx) => (idx === i ? val : n)));

  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">🌙 Midnight Baseball</h1>
        <p className="text-slate-500 text-xs sm:text-sm mb-5">2–7 players · Wild: 3s & 9s · Bonus: 4s</p>

        <div className="space-y-2 sm:space-y-3 mb-5">
          {names.map((name, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
              />
              {names.length > 2 && (
                <button onClick={() => removePlayer(i)} className="text-slate-400 hover:text-red-500 px-2 text-lg">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 sm:gap-3">
          {names.length < 7 && (
            <button
              onClick={addPlayer}
              className="flex-1 border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:border-green-400 hover:text-green-600 transition"
            >
              + Add Player
            </button>
          )}
          <button
            onClick={() => initGame(names.filter(Boolean))}
            className="flex-1 bg-green-700 text-white rounded-lg py-2 text-sm font-semibold hover:bg-green-600 transition"
          >
            Deal Cards
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Showdown auto-trigger ────────────────────────────────────────────────────

function ShowdownTrigger({ runShowdown }: { runShowdown: () => void }) {
  useEffect(() => { runShowdown(); }, []);
  return null;
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function Table() {
  const {
    phase,
    players,
    currentPlayer,
    currentPlayerIndex,
    handToBeatLabel,
    winner,
    canFlip,
    currentHandLabel,
    startGame,
    flipCard,
    runShowdown,
    resetGame,
  } = useGame();

  const handToBeatCards = useGameStore((s) => s.handToBeatCards);

  if (phase === 'IDLE') return <SetupScreen />;

  return (
    <div className="min-h-screen bg-green-900 p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 items-center">

      {/* ── Header ── */}
      <div className="flex items-center justify-between w-full max-w-4xl">
        <h1 className="text-white font-bold text-base sm:text-xl">🌙 Midnight Baseball</h1>
        <button onClick={resetGame} className="text-white/60 hover:text-white text-sm underline">
          New Game
        </button>
      </div>

      {/* ── Hand to Beat ── */}
      <div className="bg-green-800/60 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 w-full max-w-4xl">
        <div className="min-w-0 flex-1">
          <div className="text-green-300 text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1">
            Hand to Beat
          </div>
          <div className="text-white font-bold text-sm sm:text-lg leading-tight">
            {handToBeatLabel === '—' ? 'None yet — flip to set it' : handToBeatLabel}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {handToBeatCards?.map?.((card: any) => (
            <Card key={card.id} card={card} small />
          ))}
        </div>
      </div>

      {/* ── Players ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-4xl">
        <AnimatePresence>
          {players.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <PlayerHand
                player={player}
                isActive={idx === currentPlayerIndex && phase === 'PLAYER_TURN'}
                onFlip={flipCard}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Showdown trigger ── */}
      {phase === 'SHOWDOWN' && <ShowdownTrigger runShowdown={runShowdown} />}

      {/* ── Action Bar ── */}
      <div className="bg-white rounded-xl p-3 sm:p-4 w-full max-w-4xl">

        {phase === 'DEALING' && (
          <button
            onClick={startGame}
            className="w-full sm:w-auto bg-green-700 text-white rounded-lg px-6 py-3 font-semibold hover:bg-green-600 transition"
          >
            Start Game
          </button>
        )}

        {phase === 'PLAYER_TURN' && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600 min-w-0">
              <span className="font-semibold">{currentPlayer?.name}'s turn</span>
              {currentHandLabel !== '—' && (
                <div className="text-purple-600 text-xs mt-0.5 truncate">{currentHandLabel}</div>
              )}
            </div>
            <button
              onClick={() => {
                const idx = currentPlayer?.hand.findIndex((c) => !c.faceUp) ?? -1;
                if (idx !== -1) flipCard(idx);
              }}
              disabled={!canFlip}
              className="flex-shrink-0 bg-blue-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-blue-500 disabled:cursor-not-allowed transition"
            >
              Flip Card
            </button>
          </div>
        )}

        {phase === 'SHOWDOWN' && (
          <div className="text-slate-600 font-semibold animate-pulse text-center py-1">Calculating results…</div>
        )}

        {phase === 'GAME_OVER' && winner && (
          <div className="flex flex-col gap-3">
            <div className="text-base sm:text-xl font-bold text-slate-800">
              🏆 {winner.name} wins with <span className="text-purple-600">{winner.evaluatedHand?.label}</span>!
            </div>
            <div className="flex flex-col gap-1.5 border-t pt-2">
              {players.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-sm gap-2">
                  <span className={p.id === winner.id ? 'font-bold text-green-700' : 'text-slate-600'}>
                    {p.id === winner.id ? '🏆 ' : ''}{p.name}
                  </span>
                  <span className="text-slate-500 text-xs text-right">{p.evaluatedHand?.label ?? '—'}</span>
                </div>
              ))}
            </div>
            <button
              onClick={resetGame}
              className="w-full sm:w-auto sm:self-end bg-green-700 text-white rounded-lg px-5 py-2.5 font-semibold hover:bg-green-600 transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
