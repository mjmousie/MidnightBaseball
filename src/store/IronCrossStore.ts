import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Card } from '../types';
import type {
  IronCrossActions, IronCrossGameState, BoardState, RowChoice,
} from '../types/ironCross';
import { buildDeck, shuffle } from '../utils/deck';
import { evaluateBestHand, doesBeat } from '../utils/evaluator';
import { useBalanceStore } from './balanceStore';
import type { EvaluatedHand } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildStandardDeck(): Card[] {
  return buildDeck().map(c => ({ ...c, isWild: false }));
}

function dealN(deck: Card[], n: number): [Card[], Card[]] {
  return [deck.slice(0, n), deck.slice(n)];
}

/** Generate all k-combinations from arr */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

/** Best 5-card hand from n cards (n >= 5) */
function bestFiveFromN(cards: Card[]): EvaluatedHand {
  if (cards.length <= 5) return evaluateBestHand(cards);
  let best: EvaluatedHand | null = null;
  for (const combo of combinations(cards, 5)) {
    const hand = evaluateBestHand(combo);
    if (!best || doesBeat(hand, best)) best = hand;
  }
  return best!;
}

/** Cards on the board for a given row */
function getBoardCards(board: BoardState, row: RowChoice): Card[] {
  if (row === 'top')     return [board.top, board.center, board.bottom];
  if (row === 'right')   return [board.left, board.center, board.right];
  if (row === 'both')    return [board.top, board.right];
  /* mystery */          return [board.left, board.center, board.bottom];
}

/** Dealer auto-picks the row that gives the best hand */
function dealerBestOption(dealerHand: Card[], board: BoardState): { row: RowChoice; hand: EvaluatedHand } {
  const rows: RowChoice[] = ['top', 'right', 'mystery', 'both'];
  let best: { row: RowChoice; hand: EvaluatedHand } | null = null;
  for (const row of rows) {
    const hand = bestFiveFromN([...dealerHand, ...getBoardCards(board, row)]);
    if (!best || doesBeat(hand, best.hand)) best = { row, hand };
  }
  return best!;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const initialState: IronCrossGameState = {
  phase: 'SETUP',
  gameId: 0,
  deck: [],
  playerHand: [],
  dealerHand: [],
  board: null,
  chosenRow: null,
  dealerChosenRow: null,
  initialBet: 0,
  backupBet: 0,
  totalWagered: 0,
  playerBestHand: null,
  dealerBestHand: null,
  winner: null,
  resultMessage: '',
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useIronCrossStore = create<IronCrossGameState & IronCrossActions>()(
  immer((set) => ({
    ...initialState,

    initGame: (bet: number) => {
      useBalanceStore.getState().deduct(bet);
      set((state) => {
        const deck = shuffle(buildStandardDeck());
        const [playerCards, d1] = dealN(deck, 5);
        const [dealerCards, d2] = dealN(d1, 5);
        const [boardCards, remaining] = dealN(d2, 5);

        Object.assign(state, {
          ...initialState,
          gameId: state.gameId + 1,
          phase: 'DRAWING',
          deck: remaining,
          initialBet: bet,
          totalWagered: bet,
          playerHand: playerCards.map(c => ({ ...c, faceUp: true })),
          dealerHand: dealerCards.map(c => ({ ...c, faceUp: false })),
          board: {
            top:    { ...boardCards[0], faceUp: false },
            left:   { ...boardCards[1], faceUp: false },
            center: { ...boardCards[2], faceUp: false },
            right:  { ...boardCards[3], faceUp: false },
            bottom: { ...boardCards[4], faceUp: false },
          } as BoardState,
        });
      });
    },

    surrenderDraw: () => {
      set((state) => {
        const refund = Math.floor(state.initialBet / 2);
        if (refund > 0) useBalanceStore.getState().add(refund);
        state.winner = 'dealer';
        state.resultMessage = `You surrendered.`;
        state.phase = 'GAME_OVER';
      });
    },

    flipTopCard: () => {
      set((state) => {
        if (state.board) state.board.top = { ...state.board.top, faceUp: true };
      });
    },

    flipRightCard: () => {
      set((state) => {
        if (state.board) state.board.right = { ...state.board.right, faceUp: true };
      });
    },

    drawCards: (indicesToDiscard: number[]) => {
      set((state) => {
        if (state.phase !== 'DRAWING') return;
        if (indicesToDiscard.length === 0) { state.phase = 'CHOOSING'; return; }
        // Remove discarded cards and deal replacements from remaining deck
        const remaining = [...state.deck];
        const newHand = state.playerHand.map((card, i) => {
          if (indicesToDiscard.includes(i) && remaining.length > 0) {
            return { ...remaining.shift()!, faceUp: false };
          }
          return card;
        });
        state.playerHand = newHand;
        state.phase = 'CHOOSING';
      });
    },

    revealDrawnCards: () => {
      set((state) => {
        state.playerHand = state.playerHand.map(c => ({ ...c, faceUp: true }));
      });
    },

    standPat: () => {
      set((state) => {
        if (state.phase !== 'DRAWING') return;
        state.phase = 'CHOOSING';
      });
    },

    chooseRow: (row: RowChoice) => {
      set((state) => {
        state.chosenRow = row;
        state.phase = 'BACKING';
      });
    },

    surrender: () => {
      set((state) => {
        state.winner = 'dealer';
        state.resultMessage = `You surrendered.`;
        state.phase = 'GAME_OVER';
      });
    },

    placeBackupBet: (amount: number) => {
      set((state) => {
        if (amount > 0) useBalanceStore.getState().deduct(amount);
        state.backupBet = amount;
        state.totalWagered = state.initialBet + amount;

        // Flip all remaining board + dealer cards
        const b = state.board!;
        state.board = {
          top:    { ...b.top,    faceUp: true },
          left:   { ...b.left,   faceUp: true },
          center: { ...b.center, faceUp: true },
          right:  { ...b.right,  faceUp: true },
          bottom: { ...b.bottom, faceUp: true },
        };
        state.dealerHand = state.dealerHand.map(c => ({ ...c, faceUp: true }));

        // Evaluate player hand
        const boardCards = getBoardCards(state.board, state.chosenRow!);
        state.playerBestHand = bestFiveFromN([...state.playerHand, ...boardCards]);

        // Evaluate dealer hand (auto-pick best row)
        const dealerResult = dealerBestOption(state.dealerHand as Card[], state.board);
        state.dealerBestHand = dealerResult.hand;
        state.dealerChosenRow = dealerResult.row;

        // Determine winner
        const p = state.playerBestHand!;
        const d = state.dealerBestHand!;
        if (doesBeat(p, d)) {
          state.winner = 'player';
          useBalanceStore.getState().add(state.totalWagered * 2);
          state.resultMessage = `🏆 You win with ${p.label}!`;
        } else if (doesBeat(d, p)) {
          state.winner = 'dealer';
          state.resultMessage = `😞 Dealer wins with ${d.label}.`;
        } else {
          state.winner = 'tie';
          useBalanceStore.getState().add(state.totalWagered);
          state.resultMessage = `🤝 Tie! Both have ${p.label}.`;
        }

        state.phase = 'REVEAL';
      });
    },

    resetGame: () => {
      set((state) => {
        Object.assign(state, { ...initialState });
      });
    },
  }))
);
