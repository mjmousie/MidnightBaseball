import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Card, HandRank } from '../types';
import type {
  IronCrossActions, IronCrossGameState, BoardState, RowChoice,
} from '../types/ironCross';
import { buildDeck, shuffle } from '../utils/deck';
import { evaluateBestHand, doesBeat } from '../utils/evaluator';
import { useBalanceStore } from './balanceStore';
import type { EvaluatedHand } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const BONUS_PAYOUTS: Partial<Record<HandRank, number>> = {
  STRAIGHT:       1,
  FLUSH:          2,
  FULL_HOUSE:     5,
  FOUR_OF_A_KIND: 25,
  STRAIGHT_FLUSH: 100,
  ROYAL_FLUSH:    400,
};

function buildStandardDeck(): Card[] {
  return buildDeck().map(c => ({ ...c, isWild: false }));
}

function dealN(deck: Card[], n: number): [Card[], Card[]] {
  return [deck.slice(0, n), deck.slice(n)];
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

function bestFiveFromN(cards: Card[]): EvaluatedHand {
  if (cards.length <= 5) return evaluateBestHand(cards);
  let best: EvaluatedHand | null = null;
  for (const combo of combinations(cards, 5)) {
    const hand = evaluateBestHand(combo);
    if (!best || doesBeat(hand, best)) best = hand;
  }
  return best!;
}

function getBoardCards(board: BoardState, row: RowChoice): Card[] {
  if (row === 'top')   return [board.top, board.center, board.bottom];
  if (row === 'right') return [board.left, board.center, board.right];
  if (row === 'both')  return [board.top, board.right];
  return [board.left, board.center, board.bottom];
}

function dealerBestOption(dealerHand: Card[], board: BoardState): { row: RowChoice; hand: EvaluatedHand } {
  const rows: RowChoice[] = ['top', 'right', 'mystery', 'both'];
  let best: { row: RowChoice; hand: EvaluatedHand } | null = null;
  for (const row of rows) {
    const hand = bestFiveFromN([...dealerHand, ...getBoardCards(board, row)]);
    if (!best || doesBeat(hand, best.hand)) best = { row, hand };
  }
  return best!;
}

function evaluateAndPay(state: IronCrossGameState, row: RowChoice, backupBet: number) {
  const b = state.board!;
  state.board = {
    top:    { ...b.top,    faceUp: true },
    left:   { ...b.left,   faceUp: true },
    center: { ...b.center, faceUp: true },
    right:  { ...b.right,  faceUp: true },
    bottom: { ...b.bottom, faceUp: true },
  };
  state.dealerHand = state.dealerHand.map(c => ({ ...c, faceUp: true }));

  state.chosenRow    = row;
  state.backupBet    = backupBet;
  state.totalWagered = state.initialBet + backupBet;

  const boardCards = getBoardCards(state.board, row);
  state.playerBestHand = bestFiveFromN([...state.playerHand, ...boardCards]);

  const dealerResult = dealerBestOption(state.dealerHand as Card[], state.board);
  state.dealerBestHand  = dealerResult.hand;
  state.dealerChosenRow = dealerResult.row;

  // Bonus bet payout
  const mult = BONUS_PAYOUTS[state.playerBestHand!.rank] ?? 0;
  if (state.bonusBet > 0 && mult > 0) {
    state.bonusWin = state.bonusBet * mult;
    useBalanceStore.getState().add(state.bonusBet * (mult + 1));
  }

  const p = state.playerBestHand!;
  const d = state.dealerBestHand!;
  if (doesBeat(p, d)) {
    state.winner = 'player';
    useBalanceStore.getState().add(state.totalWagered * 2);
    state.resultMessage = `You win $${state.totalWagered} with ${p.label}!`;
  } else if (doesBeat(d, p)) {
    state.winner = 'dealer';
    state.resultMessage = `You lose $${state.totalWagered}, Dealer has ${d.label}.`;
  } else {
    state.winner = 'tie';
    useBalanceStore.getState().add(state.totalWagered);
    state.resultMessage = `Tie! Both have ${p.label}. Bet returned.`;
  }

  state.phase = 'REVEAL';
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
  bonusBet: 0,
  bonusWin: 0,
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

    initGame: (bet: number, bonusBet: number) => {
      useBalanceStore.getState().deduct(bet + bonusBet);
      set((state) => {
        const deck = shuffle(buildStandardDeck());
        const [playerCards, d1] = dealN(deck, 5);
        const [dealerCards, d2] = dealN(d1, 5);
        const [boardCards, remaining] = dealN(d2, 5);

        Object.assign(state, {
          ...initialState,
          gameId:       state.gameId + 1,
          phase:        'DRAWING',
          deck:         remaining,
          initialBet:   bet,
          bonusBet,
          totalWagered: bet,
          playerHand:   playerCards.map(c => ({ ...c, faceUp: true })),
          dealerHand:   dealerCards.map(c => ({ ...c, faceUp: false })),
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

    flipTopCard: () => {
      set((state) => { if (state.board) state.board.top = { ...state.board.top, faceUp: true }; });
    },

    flipRightCard: () => {
      set((state) => { if (state.board) state.board.right = { ...state.board.right, faceUp: true }; });
    },

    drawCards: (indicesToDiscard: number[]) => {
      set((state) => {
        if (state.phase !== 'DRAWING') return;
        if (indicesToDiscard.length === 0) { state.phase = 'CHOOSING'; return; }
        const remaining = [...state.deck];
        state.playerHand = state.playerHand.map((card, i) =>
          indicesToDiscard.includes(i) && remaining.length > 0
            ? { ...remaining.shift()!, faceUp: false }
            : card
        );
        state.phase = 'CHOOSING';
      });
    },

    revealDrawnCards: () => {
      set((state) => { state.playerHand = state.playerHand.map(c => ({ ...c, faceUp: true })); });
    },

    standPat: () => {
      set((state) => { if (state.phase === 'DRAWING') state.phase = 'CHOOSING'; });
    },

    surrenderDraw: () => {
      set((state) => {
        const refund = Math.floor(state.initialBet / 2);
        if (refund > 0) useBalanceStore.getState().add(refund);
        state.winner = 'dealer';
        state.resultMessage = `You surrendered. You lose $${state.initialBet - refund}.`;
        state.phase = 'GAME_OVER';
      });
    },

    confirmRowAndBet: (row: RowChoice, backupBet: number) => {
      if (backupBet > 0) useBalanceStore.getState().deduct(backupBet);
      set((state) => { evaluateAndPay(state, row, backupBet); });
    },

    chooseRow: (row: RowChoice) => {
      set((state) => { state.chosenRow = row; state.phase = 'BACKING'; });
    },

    surrender: () => {
      set((state) => {
        state.winner = 'dealer';
        state.resultMessage = `You surrendered. You lose $${state.initialBet}.`;
        state.phase = 'GAME_OVER';
      });
    },

    placeBackupBet: (amount: number) => {
      if (amount > 0) useBalanceStore.getState().deduct(amount);
      set((state) => { evaluateAndPay(state, state.chosenRow!, amount); });
    },

    resetGame: () => {
      set((state) => { Object.assign(state, { ...initialState }); });
    },
  }))
);
