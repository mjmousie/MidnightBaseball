import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Card } from '../types';
import type { CasinoActions, CasinoGameState, CasinoSide } from '../types/casino';
import { useBalanceStore } from './balanceStore';
import { buildDeck, dealCards, shuffle, cardLabel } from '../utils/deck';
import { evaluateBestHand, doesBeat } from '../utils/evaluator';

const INITIAL_HAND_SIZE = 7;
const INITIAL_EXPOSE = 3;
const initialState: Omit<CasinoGameState, 'balance'> = {
  phase: 'SETUP',
  deck: [],
  banker: { hand: [], evaluatedHand: null },
  player: { hand: [], evaluatedHand: null },
  bettorSide: null,
  activeSide: null,
  handToBeat: null,
  handToBeatSide: null,
  initialBet: 0,
  totalWagered: 0,
  pendingWildCard: null,
  winner: null,
  resultMessage: '',
  log: [],
  flipCount: 0,
};

function getSide(state: CasinoGameState, side: CasinoSide) {
  return side === 'banker' ? state.banker : state.player;
}

function oppositeSide(side: CasinoSide): CasinoSide {
  return side === 'banker' ? 'player' : 'banker';
}

function reEvaluate(state: CasinoGameState, side: CasinoSide) {
  const s = getSide(state, side);
  const visible = s.hand.filter(c => c.faceUp);
  s.evaluatedHand = visible.length > 0 ? evaluateBestHand(visible) : null;
}

function hasCardsLeft(state: CasinoGameState, side: CasinoSide): boolean {
  return getSide(state, side).hand.some(c => !c.faceUp);
}

function determineActive(state: CasinoGameState): CasinoSide | null {
  const bettor = state.bettorSide!;
  const cpu = oppositeSide(bettor);
  const bettorEval = getSide(state, bettor).evaluatedHand;
  const cpuEval = getSide(state, cpu).evaluatedHand;
  const bettorHasCards = hasCardsLeft(state, bettor);
  const cpuHasCards = hasCardsLeft(state, cpu);

  if (!bettorHasCards && !cpuHasCards) return null;

  if (!bettorHasCards) {
    if (!cpuHasCards) return null;
    if (bettorEval && cpuEval && doesBeat(cpuEval, bettorEval)) return null;
    return cpu;
  }

  if (!cpuHasCards) {
    if (bettorEval && cpuEval && doesBeat(bettorEval, cpuEval)) return null;
    return bettor;
  }

  if (!bettorEval && !cpuEval) return cpu;
  if (!cpuEval) return cpu;
  if (!bettorEval) return bettor;
  if (doesBeat(bettorEval, cpuEval)) return cpu;
  return bettor;
}

function checkGameOver(state: CasinoGameState): boolean {
  const bettor = state.bettorSide!;
  const cpu = oppositeSide(bettor);
  const bettorHasCards = hasCardsLeft(state, bettor);
  const cpuHasCards = hasCardsLeft(state, cpu);

  const nextActive = determineActive(state);
  const shouldEnd = (!bettorHasCards && !cpuHasCards) || nextActive === null;
  if (!shouldEnd) return false;

  for (const side of [bettor, cpu] as CasinoSide[]) {
    const s = getSide(state, side);
    s.hand = s.hand.map(c => ({ ...c, faceUp: true }));
    s.evaluatedHand = evaluateBestHand(s.hand);
  }

  const finalBettor = getSide(state, bettor).evaluatedHand!;
  const finalCpu = getSide(state, cpu).evaluatedHand!;

  if (doesBeat(finalBettor, finalCpu)) {
    state.winner = bettor;
    useBalanceStore.getState().add(state.totalWagered * 2);
    state.resultMessage = `${bettor === 'banker' ? 'Widow' : 'Player'} wins with ${finalBettor.label}!`;
  } else {
    state.winner = cpu;
    state.resultMessage = `${cpu === 'banker' ? 'Widow' : 'Player'} wins with ${finalCpu.label}.`;
  }

  state.phase = 'GAME_OVER';
  return true;
}

export const useCasinoStore = create<CasinoGameState & CasinoActions>()(
  immer((set) => ({
    ...initialState,

    // ── initCasino ───────────────────────────────────────────────────────────
    initCasino: (bettorSide: CasinoSide, bet: number) => {
      useBalanceStore.getState().deduct(bet);
      set((state) => {
        Object.assign(state, {
          ...initialState,
          banker: { hand: [], evaluatedHand: null },
          player: { hand: [], evaluatedHand: null },
          phase: 'PLAYING',
          bettorSide,
          initialBet: bet,
          totalWagered: bet,
          log: [`Game started. You bet $${bet} on the ${bettorSide === 'banker' ? 'Widow' : 'Player'} side.`],
        });

        const deck = shuffle(buildDeck());
        let remaining = deck;
        const [bankerCards, rest1] = dealCards(remaining, INITIAL_HAND_SIZE);
        const [playerCards, rest2] = dealCards(rest1, INITIAL_HAND_SIZE);
        remaining = rest2;

        const exposeRandom = (cards: Card[]): Card[] => {
          const indices = shuffle([...Array(cards.length).keys()]).slice(0, INITIAL_EXPOSE);
          return cards.map((c, i) => indices.includes(i) ? { ...c, faceUp: true } : c);
        };

        state.banker.hand = exposeRandom(bankerCards);
        state.player.hand = exposeRandom(playerCards);
        state.deck = remaining;

        const bankerVisible = state.banker.hand.filter(c => c.faceUp);
        const playerVisible = state.player.hand.filter(c => c.faceUp);
        state.banker.evaluatedHand = bankerVisible.length > 0 ? evaluateBestHand(bankerVisible) : null;
        state.player.evaluatedHand = playerVisible.length > 0 ? evaluateBestHand(playerVisible) : null;

        const bankerEval = state.banker.evaluatedHand;
        const playerEval = state.player.evaluatedHand;
        if (bankerEval && playerEval) {
          if (doesBeat(bankerEval, playerEval)) {
            state.handToBeat = bankerEval; state.handToBeatSide = 'banker';
          } else {
            state.handToBeat = playerEval; state.handToBeatSide = 'player';
          }
        } else if (bankerEval) {
          state.handToBeat = bankerEval; state.handToBeatSide = 'banker';
        } else if (playerEval) {
          state.handToBeat = playerEval; state.handToBeatSide = 'player';
        }

        state.activeSide = determineActive(state);
        state.log.push(`Cards dealt. ${state.activeSide === bettorSide ? 'Your' : "Dealer's"} turn first.`);
      });
    },

    // ── flipBettorCard ───────────────────────────────────────────────────────
    flipBettorCard: (cardIndex: number) => {
      set((state) => {
        if (state.phase !== 'PLAYING') return;
        const bettor = state.bettorSide!;
        if (state.activeSide !== bettor) return;

        const side = getSide(state, bettor);
        const card = side.hand[cardIndex];
        if (!card || card.faceUp) return;

        side.hand[cardIndex] = { ...card, faceUp: true };
        state.log.push(`You flip: ${cardLabel(side.hand[cardIndex])}`);

        if (side.hand[cardIndex].rank === '4') {
          state.pendingWildCard = side.hand[cardIndex];
          state.phase = 'FOUR_PROMPT';
          return;
        }

        if (side.hand[cardIndex].isWild) {
          state.pendingWildCard = side.hand[cardIndex];
          state.phase = 'WILD_PROMPT';
          return;
        }

        reEvaluate(state, bettor);
        const bettorEval = getSide(state, bettor).evaluatedHand;

        if (bettorEval) {
          if (!state.handToBeat || doesBeat(bettorEval, state.handToBeat)) {
            state.handToBeat = bettorEval;
            state.handToBeatSide = bettor;
          }
        }

        if (checkGameOver(state)) return;
        state.activeSide = determineActive(state);
      });
    },

    // ── payWildAndContinue ───────────────────────────────────────────────────
    payWildAndContinue: () => {
      set((state) => {
        if (state.phase !== 'WILD_PROMPT') return;
        const fullBet = state.initialBet;
        state.totalWagered += fullBet;
        useBalanceStore.getState().deduct(fullBet);
        state.log.push(`You pay $${fullBet} to continue with the wild card.`);
        state.pendingWildCard = null;
        state.phase = 'PLAYING';
        reEvaluate(state, state.bettorSide!);
        if (checkGameOver(state)) return;
        state.activeSide = determineActive(state);
      });
    },

    // ── foldHand ─────────────────────────────────────────────────────────────
    foldHand: () => {
      set((state) => {
        state.winner = oppositeSide(state.bettorSide!);
        state.resultMessage = `You surrendered. You lose $${state.totalWagered}.`;
        state.phase = 'GAME_OVER';
        state.log.push('Bettor surrendered.');
      });
    },

    // ── payFourForCard ───────────────────────────────────────────────────────
    payFourForCard: () => {
      set((state) => {
        if (state.phase !== 'FOUR_PROMPT') return;
        const bettor = state.bettorSide!;
        state.totalWagered += state.initialBet;
        useBalanceStore.getState().deduct(state.initialBet);
        state.log.push(`You pay $${state.initialBet} for a bonus card.`);

        if (state.deck.length > 0) {
          const [bonus, rest] = dealCards(state.deck, 1);
          getSide(state, bettor).hand.push(bonus[0]);
          state.deck = rest;
        }

        state.pendingWildCard = null;
        state.phase = 'PLAYING';
        reEvaluate(state, bettor);
        if (checkGameOver(state)) return;
        state.activeSide = determineActive(state);
      });
    },

    // ── triggerCpuFlip ───────────────────────────────────────────────────────
    triggerCpuFlip: () => {
      set((state) => {
        if (state.phase !== 'PLAYING') return;
        const bettor = state.bettorSide!;
        const cpu = oppositeSide(bettor);
        const cpuSide = getSide(state, cpu);

        const faceDownIndices = cpuSide.hand
          .map((c, i) => (!c.faceUp ? i : -1))
          .filter(i => i !== -1);

        if (faceDownIndices.length === 0) {
          checkGameOver(state);
          return;
        }

        const randIdx = faceDownIndices[Math.floor(Math.random() * faceDownIndices.length)];
        cpuSide.hand[randIdx] = { ...cpuSide.hand[randIdx], faceUp: true };
        state.log.push(`Dealer flips: ${cardLabel(cpuSide.hand[randIdx])}`);
        state.flipCount += 1;

        reEvaluate(state, cpu);
        const cpuEval = getSide(state, cpu).evaluatedHand;

        if (cpuEval && (!state.handToBeat || doesBeat(cpuEval, state.handToBeat))) {
          state.handToBeat = cpuEval;
          state.handToBeatSide = cpu;
        }

        if (checkGameOver(state)) return;
        state.activeSide = determineActive(state);
      });
    },

    // ── resetCasino ──────────────────────────────────────────────────────────
    resetCasino: () => {
      const { balance, reset } = useBalanceStore.getState();
      if (balance <= 0) reset();
      set((state) => {
        Object.assign(state, {
          ...initialState,
          banker: { hand: [], evaluatedHand: null },
          player: { hand: [], evaluatedHand: null },
        });
      });
    },
  }))
);
