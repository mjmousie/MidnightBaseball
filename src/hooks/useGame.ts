/**
 * useGame.ts
 *
 * High-level hook that wraps the GameStore and enforces the state-transition
 * machine for Midnight Baseball. Components should use this hook rather than
 * accessing the store directly, to ensure only valid transitions are exposed.
 */

import { useCallback } from 'react';
import { useGameStore } from '../store/GameStore';
import type { GamePhase, Player } from '../types';
import { doesBeat } from '../utils/evaluator';

// ─── Derived State ────────────────────────────────────────────────────────────

interface UseGameReturn {
  // State
  phase: GamePhase;
  players: Player[];
  currentPlayer: Player | null;
  currentPlayerIndex: number;
  handToBeatLabel: string;
  winner: Player | null;
  turnLog: string[];
  canFlip: boolean;        // Current player has face-down cards
  canPass: boolean;        // Current player's hand beats the hand to beat
  currentHandLabel: string;

  // Actions (phase-guarded)
  initGame: (names: string[]) => void;
  startGame: () => void;
  flipCard: () => void;
  passTurn: () => void;
  runShowdown: () => void;
  resetGame: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGame(): UseGameReturn {
  const {
    phase,
    players,
    currentPlayerIndex,
    handToBeat,
    winner,
    turnLog,
    initGame,
    startGame,
    flipNextCard,
    passTurn: storePassTurn,
    evaluateShowdown,
    resetGame,
  } = useGameStore();

  const currentPlayer = players[currentPlayerIndex] ?? null;

  // Can the current player flip another card?
  const canFlip =
    phase === 'PLAYER_TURN' &&
    !!currentPlayer &&
    currentPlayer.hand.some((c) => !c.faceUp);

  // Can the current player pass their turn?
  const canPass =
    phase === 'PLAYER_TURN' &&
    !!currentPlayer &&
    !!currentPlayer.evaluatedHand &&
    !!handToBeat &&
    doesBeat(currentPlayer.evaluatedHand, handToBeat);

  const currentHandLabel =
    currentPlayer?.evaluatedHand?.label ?? '—';

  const handToBeatLabel = handToBeat?.label ?? '—';

  // ── Phase-guarded actions ─────────────────────────────────────────────────

  const handleInitGame = useCallback(
    (names: string[]) => {
      if (phase === 'IDLE' || phase === 'GAME_OVER') {
        initGame(names);
      }
    },
    [phase, initGame]
  );

  const handleStartGame = useCallback(() => {
    if (phase === 'DEALING') {
      startGame();
    }
  }, [phase, startGame]);

  const handleFlipCard = useCallback(() => {
    if (canFlip) {
      flipNextCard();
    }
  }, [canFlip, flipNextCard]);

  const handlePassTurn = useCallback(() => {
    if (canPass) {
      storePassTurn();
    }
  }, [canPass, storePassTurn]);

  const handleRunShowdown = useCallback(() => {
    if (phase === 'SHOWDOWN') {
      evaluateShowdown();
    }
  }, [phase, evaluateShowdown]);

  const handleResetGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  return {
    phase,
    players,
    currentPlayer,
    currentPlayerIndex,
    handToBeatLabel,
    winner,
    turnLog,
    canFlip,
    canPass,
    currentHandLabel,
    initGame: handleInitGame,
    startGame: handleStartGame,
    flipCard: handleFlipCard,
    passTurn: handlePassTurn,
    runShowdown: handleRunShowdown,
    resetGame: handleResetGame,
  };
}
