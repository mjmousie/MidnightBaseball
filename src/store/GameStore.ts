/**
 * GameStore.ts
 *
 * Zustand store for Midnight Baseball.
 * Manages the full game state machine across all phases.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { Card, GameActions, GameState, Player } from '../types';
import { buildDeck, dealCards, flipCard, isBonusCard, cardLabel, shuffle } from '../utils/deck';
import { evaluateBestHand, doesBeat } from '../utils/evaluator';

// ─── Initial State ────────────────────────────────────────────────────────────

const INITIAL_HAND_SIZE = 7;

const initialState: GameState = {
  phase: 'IDLE',
  deck: [],
  players: [],
  currentPlayerIndex: 0,
  handToBeat: null,
  handToBeatCards: [],
  winner: null,
  turnLog: [],
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState & GameActions>()(
  immer((set, get) => ({
    ...initialState,

    // ── initGame ─────────────────────────────────────────────────────────────
    initGame: (playerNames: string[]) => {
      if (playerNames.length < 2 || playerNames.length > 7) {
        throw new Error('Midnight Baseball requires 2–7 players.');
      }

      set((state) => {
        Object.assign(state, {
          ...initialState,
          phase: 'DEALING',
          turnLog: ['Game initialised. Dealing cards…'],
        });

        // Build and shuffle deck
        const deck = shuffle(buildDeck());

        // Deal 7 face-down cards to each player
        let remaining = deck;
        const players: Player[] = playerNames.map((name, idx) => {
          const [hand, rest] = dealCards(remaining, INITIAL_HAND_SIZE);
          remaining = rest;
          return {
            id: `player-${idx}`,
            name,
            hand,           // All cards (face-down to start)
            visibleCards: [],
            status: 'waiting',
            evaluatedHand: null,
          };
        });

        // Hand to Beat starts empty — Player 1's first flip sets it
        state.deck = remaining;
        state.players = players;
        state.handToBeatCards = [];
        state.handToBeat = null;
        state.currentPlayerIndex = 0;
        state.turnLog.push('Cards dealt. Player 1 flips first to set the hand to beat.');
      });
    },

    // ── startGame ────────────────────────────────────────────────────────────
    startGame: () => {
      set((state) => {
        state.phase = 'PLAYER_TURN';
        state.players[0].status = 'active';
        state.turnLog.push(`${state.players[0].name}'s turn — flip a card!`);
      });
    },

    // ── flipNextCard ─────────────────────────────────────────────────────────
    flipNextCard: () => {
      const { players, currentPlayerIndex, handToBeat, deck } = get();
      const player = players[currentPlayerIndex];

      // Find the first face-down card
      const faceDownIdx = player.hand.findIndex((c) => !c.faceUp);
      if (faceDownIdx === -1) return; // No more cards to flip

      set((state) => {
        const activePlayer = state.players[state.currentPlayerIndex];
        const card = activePlayer.hand[faceDownIdx];
        const flipped = flipCard(card);
        activePlayer.hand[faceDownIdx] = flipped;

        // 4-card rule: deal an extra card immediately
        if (isBonusCard(flipped)) {
          if (state.deck.length > 0) {
            const [bonus, rest] = dealCards(state.deck, 1);
            activePlayer.hand.push(bonus[0]);
            state.deck = rest;
            state.turnLog.push(
              `${activePlayer.name} flipped a ${cardLabel(flipped)} — bonus card dealt!`
            );
          }
        } else {
          state.turnLog.push(
            `${activePlayer.name} flips: ${cardLabel(flipped)}`
          );
        }

        // Recompute visible cards and re-evaluate best hand so far
        activePlayer.visibleCards = activePlayer.hand.filter((c) => c.faceUp);
        const currentEval = evaluateBestHand(activePlayer.visibleCards);
        activePlayer.evaluatedHand = currentEval;

        const hasMoreCards = activePlayer.hand.some((c) => !c.faceUp);
        const nowBeatsHighHand = !state.handToBeat || doesBeat(currentEval, state.handToBeat);

        // Case 1: This player now has the high hand → pass turn immediately
        if (nowBeatsHighHand) {
          state.handToBeat = currentEval;
          state.handToBeatCards = [...activePlayer.visibleCards];
          state.turnLog.push(
            `${activePlayer.name} takes the high hand: ${currentEval.label}!`
          );
          activePlayer.status = 'done';
        }
        // Case 2: Player has no more cards and never took the high hand → done
        else if (!hasMoreCards) {
          state.turnLog.push(
            `${activePlayer.name} is out of cards — best hand: ${currentEval.label}`
          );
          activePlayer.status = 'done';
        }
        // Case 3: Player still has cards and hasn't beaten the high hand yet → keep flipping
        else {
          state.turnLog.push(
            `  ${activePlayer.name}: ${currentEval.label} — keep flipping...`
          );
          return; // Stay on this player's turn
        }

        // ── Advance turn ──────────────────────────────────────────────────────
        // Find the next player who is still 'waiting' (has not yet had a turn this round)
        // OR who lost the high hand and still has cards left to flip
        const advanceTo = (fromIdx: number): number | null => {
          let nextIdx = (fromIdx + 1) % state.players.length;
          let loops = 0;
          while (loops < state.players.length) {
            const p = state.players[nextIdx];
            // A player is still eligible if they are waiting, or active with cards remaining
            if (p.status === 'waiting' || (p.status === 'active' && p.hand.some((c) => !c.faceUp))) {
              return nextIdx;
            }
            // A 'done' player who still has face-down cards needs another chance to beat the new high hand
            if (p.status === 'done' && p.hand.some((c) => !c.faceUp)) {
              return nextIdx;
            }
            nextIdx = (nextIdx + 1) % state.players.length;
            loops++;
          }
          return null;
        };

        const nextIdx = advanceTo(state.currentPlayerIndex);

        if (nextIdx === null) {
          // No eligible players remain — go to showdown
          state.phase = 'SHOWDOWN';
          state.turnLog.push('All players done — Showdown!');
        } else {
          // Check: is the next player already holding the high hand?
          // If so, flip all their remaining cards automatically and end the game.
          const nextPlayer = state.players[nextIdx];
          const nextEval = nextPlayer.evaluatedHand;
          const nextAlreadyWinning = nextEval && state.handToBeat && !doesBeat(state.handToBeat, nextEval);

          if (nextAlreadyWinning) {
            // Flip all remaining face-down cards for this player
            nextPlayer.hand = nextPlayer.hand.map((c) => c.faceUp ? c : { ...c, faceUp: true });
            nextPlayer.visibleCards = nextPlayer.hand;
            nextPlayer.evaluatedHand = evaluateBestHand(nextPlayer.hand);
            nextPlayer.status = 'done';
            state.turnLog.push(
              `${nextPlayer.name} already has the best hand — remaining cards revealed automatically.`
            );
            state.phase = 'SHOWDOWN';
            state.turnLog.push('All players done — Showdown!');
          } else {
            state.currentPlayerIndex = nextIdx;
            state.players[nextIdx].status = 'active';
            state.turnLog.push(`${state.players[nextIdx].name}'s turn — beat ${state.handToBeat?.label ?? 'the high hand'}!`);
          }
        }
      });
    },

    // ── passTurn ─────────────────────────────────────────────────────────────
    passTurn: () => {
      const { players, currentPlayerIndex } = get();

      set((state) => {
        // Mark current player as done
        state.players[state.currentPlayerIndex].status = 'done';

        // Update the hand to beat if the current player's hand is better
        const currentEval = state.players[state.currentPlayerIndex].evaluatedHand;
        if (currentEval && (!state.handToBeat || doesBeat(currentEval, state.handToBeat))) {
          state.handToBeat = currentEval;
          state.handToBeatCards = state.players[state.currentPlayerIndex].visibleCards;
          state.turnLog.push(
            `New hand to beat: ${currentEval.label} (set by ${state.players[state.currentPlayerIndex].name})`
          );
        }

        // Advance to next player who hasn't gone yet
        let nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
        let loops = 0;

        while (state.players[nextIdx].status === 'done' || state.players[nextIdx].status === 'folded') {
          nextIdx = (nextIdx + 1) % state.players.length;
          loops++;
          if (loops >= state.players.length) break;
        }

        const allDone = state.players.every((p) => p.status === 'done' || p.status === 'folded');

        if (allDone) {
          state.phase = 'SHOWDOWN';
          state.turnLog.push('All players done — Showdown!');
        } else {
          state.currentPlayerIndex = nextIdx;
          state.players[nextIdx].status = 'active';
          state.turnLog.push(`${state.players[nextIdx].name}'s turn — flip a card!`);
        }
      });
    },

    // ── evaluateShowdown ─────────────────────────────────────────────────────
    evaluateShowdown: () => {
      set((state) => {
        if (state.phase !== 'SHOWDOWN') return;

        let bestScore = -Infinity;
        let winner: Player | null = null;

        state.turnLog.push('--- Showdown Results ---');

        for (const player of state.players) {
          if (player.status === 'folded') continue;

          const allFaceUp = player.hand.map((c) => ({ ...c, faceUp: true }));
          const evaluated = evaluateBestHand(allFaceUp);
          player.evaluatedHand = evaluated;
          player.hand = allFaceUp;

          state.turnLog.push(`${player.name}: ${evaluated.label}`);

          if (
            evaluated.score > bestScore ||
            (evaluated.score === bestScore && winner &&
              evaluated.tiebreakers[0] > (winner.evaluatedHand?.tiebreakers[0] ?? 0))
          ) {
            bestScore = evaluated.score;
            winner = player;
          }
        }

        state.winner = winner;
        state.phase = 'GAME_OVER';

        if (winner) {
          state.turnLog.push(
            `🏆 ${winner.name} wins with ${winner.evaluatedHand?.label ?? 'a great hand'}!`
          );
        }
      });
    },

    // ── resetGame ────────────────────────────────────────────────────────────
    resetGame: () => {
      set((state) => {
        Object.assign(state, { ...initialState });
      });
    },

    // ── addLogEntry ──────────────────────────────────────────────────────────
    addLogEntry: (entry: string) => {
      set((state) => {
        state.turnLog.push(entry);
      });
    },
  }))
);