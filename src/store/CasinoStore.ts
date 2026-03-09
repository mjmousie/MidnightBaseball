import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Card } from '../types';
import type { CasinoActions, CasinoGameState, CasinoSide } from '../types/casino';
import { buildDeck, dealCards, shuffle, cardLabel } from '../utils/deck';
import { evaluateBestHand, doesBeat } from '../utils/evaluator';

const INITIAL_HAND_SIZE = 7;
const INITIAL_EXPOSE = 3;
const STARTING_BALANCE = 1000;

const initialState: CasinoGameState = {
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
  balance: STARTING_BALANCE,
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

  // Neither side has cards left — game over handled by checkGameOver
  if (!bettorHasCards && !cpuHasCards) return null;

  // Bettor is out of cards — CPU must flip until they beat bettor or run out
  if (!bettorHasCards) {
    if (!cpuHasCards) return null;
    // If CPU already beats bettor, game is over — return null
    if (bettorEval && cpuEval && doesBeat(cpuEval, bettorEval)) return null;
    return cpu;
  }

  // CPU is out of cards — bettor must flip until they beat CPU or run out
  if (!cpuHasCards) {
    if (bettorEval && cpuEval && doesBeat(bettorEval, cpuEval)) return null;
    return bettor;
  }

  // Both have cards — whoever is losing must flip
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

  // Game ends when:
  // (a) both sides are out of cards, OR
  // (b) one side is out and the other already beats it (no point flipping more)
  const nextActive = determineActive(state);
  const shouldEnd =
    (!bettorHasCards && !cpuHasCards) ||
    nextActive === null;

  if (!shouldEnd) return false;

  // Flip all remaining cards face-up for final evaluation
  for (const side of [bettor, cpu] as CasinoSide[]) {
    const s = getSide(state, side);
    s.hand = s.hand.map(c => ({ ...c, faceUp: true }));
    s.evaluatedHand = evaluateBestHand(s.hand);
  }

  const finalBettor = getSide(state, bettor).evaluatedHand!;
  const finalCpu = getSide(state, cpu).evaluatedHand!;

  if (doesBeat(finalBettor, finalCpu)) {
    state.winner = bettor;
    state.balance += state.totalWagered * 2; // return bet + 1:1 profit
    state.resultMessage = `🏆 Your side wins with ${finalBettor.label}! You win $${state.totalWagered}!`;
  } else {
    state.winner = cpu;
    // balance already deducted as bets were placed — nothing to change
    state.resultMessage = `😞 ${cpu === 'banker' ? 'Banker' : 'Player'} wins with ${finalCpu.label}. You lose $${state.totalWagered}.`;
  }

  state.phase = 'GAME_OVER';
  return true;
}

export const useCasinoStore = create<CasinoGameState & CasinoActions>()(
  immer((set, get) => ({
    ...initialState,

    // ── initCasino ───────────────────────────────────────────────────────────
    initCasino: (bettorSide: CasinoSide, bet: number) => {
      set((state) => {
        Object.assign(state, {
          ...initialState,
          balance: get().balance - bet, // deduct initial bet immediately
          phase: 'PLAYING',
          bettorSide,
          initialBet: bet,
          totalWagered: bet,
          log: [`Game started. You bet $${bet} on the ${bettorSide === 'banker' ? 'Banker' : 'Player'} side.`],
        });

        const deck = shuffle(buildDeck());
        let remaining = deck;

        // Deal 7 cards face-down to each side
        const [bankerCards, rest1] = dealCards(remaining, INITIAL_HAND_SIZE);
        const [playerCards, rest2] = dealCards(rest1, INITIAL_HAND_SIZE);
        remaining = rest2;

        // Expose 3 random cards for each side
        const exposeRandom = (cards: Card[]): Card[] => {
          const indices = shuffle([...Array(INITIAL_HAND_SIZE).keys()]).slice(0, INITIAL_EXPOSE);
          return cards.map((c, i) => indices.includes(i) ? { ...c, faceUp: true } : c);
        };

        state.banker.hand = exposeRandom(bankerCards);
        state.player.hand = exposeRandom(playerCards);
        state.deck = remaining;

        // Evaluate initial hands
        const bankerVisible = state.banker.hand.filter(c => c.faceUp);
        const playerVisible = state.player.hand.filter(c => c.faceUp);
        state.banker.evaluatedHand = bankerVisible.length > 0 ? evaluateBestHand(bankerVisible) : null;
        state.player.evaluatedHand = playerVisible.length > 0 ? evaluateBestHand(playerVisible) : null;

        // Set initial hand to beat
        const bankerEval = state.banker.evaluatedHand;
        const playerEval = state.player.evaluatedHand;
        if (bankerEval && playerEval) {
          if (doesBeat(bankerEval, playerEval)) {
            state.handToBeat = bankerEval;
            state.handToBeatSide = 'banker';
          } else {
            state.handToBeat = playerEval;
            state.handToBeatSide = 'player';
          }
        } else if (bankerEval) {
          state.handToBeat = bankerEval;
          state.handToBeatSide = 'banker';
        } else if (playerEval) {
          state.handToBeat = playerEval;
          state.handToBeatSide = 'player';
        }

        state.activeSide = determineActive(state);
        state.log.push(`Initial cards dealt. ${state.activeSide === bettorSide ? 'Your' : "Dealer's"} turn first.`);
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

        // Flip the card
        side.hand[cardIndex] = { ...card, faceUp: true };
        state.log.push(`You flip: ${cardLabel(side.hand[cardIndex])}`);

        // Check for 4 — bettor must decide to pay for bonus card or pay to skip
        if (side.hand[cardIndex].rank === '4') {
          state.pendingWildCard = side.hand[cardIndex];
          state.phase = 'FOUR_PROMPT';
          return;
        }

        // Check for wild (3 or 9) — bettor must pay half bet to continue
        if (side.hand[cardIndex].isWild) {
          state.pendingWildCard = side.hand[cardIndex];
          state.phase = 'WILD_PROMPT';
          return;
        }

        reEvaluate(state, bettor);
        const bettorEval = getSide(state, bettor).evaluatedHand;

        // Update hand to beat
        if (bettorEval) {
          if (!state.handToBeat || doesBeat(bettorEval, state.handToBeat)) {
            state.handToBeat = bettorEval;
            state.handToBeatSide = bettor;
          }
        }

        if (checkGameOver(state)) return;

        // Determine whose turn is next
        state.activeSide = determineActive(state);
      });
    },

    // ── payWildAndContinue ───────────────────────────────────────────────────
    payWildAndContinue: () => {
      set((state) => {
        if (state.phase !== 'WILD_PROMPT') return;
        const fullBet = state.initialBet;
        state.totalWagered += fullBet;
        state.balance -= fullBet;
        state.log.push(`You pay $${fullBet} to continue with the wild card.`);
        state.pendingWildCard = null;
        state.phase = 'PLAYING';

        const bettor = state.bettorSide!;
        reEvaluate(state, bettor);

        if (checkGameOver(state)) return;
        state.activeSide = determineActive(state);
      });
    },

    // ── foldHand ─────────────────────────────────────────────────────────────
    foldHand: () => {
      set((state) => {
        state.winner = oppositeSide(state.bettorSide!);
        // balance already deducted as bets were placed
        state.resultMessage = `You folded. You lose $${state.totalWagered}.`;
        state.phase = 'GAME_OVER';
        state.log.push('Bettor folded.');
      });
    },

    // ── payFourForCard ───────────────────────────────────────────────────────
    payFourForCard: () => {
      set((state) => {
        if (state.phase !== 'FOUR_PROMPT') return;
        const bettor = state.bettorSide!;
        state.totalWagered += state.initialBet;
        state.balance -= state.initialBet;
        state.log.push(`You pay $${state.initialBet} for a bonus card.`);

        if (state.deck.length > 0) {
          const [bonus, rest] = dealCards(state.deck, 1);
          getSide(state, bettor).hand.push(bonus[0]);
          state.deck = rest;
          state.log.push(`Bonus card dealt face-down.`);
        }

        state.pendingWildCard = null;
        state.phase = 'PLAYING';
        reEvaluate(state, bettor);
        if (checkGameOver(state)) return;
        state.activeSide = determineActive(state);
      });
    },

    // ── payHalfAndContinueWithoutCard ────────────────────────────────────────
    payHalfAndContinueWithoutCard: () => {
      set((state) => {
        if (state.phase !== 'FOUR_PROMPT') return;
        const bettor = state.bettorSide!;
        state.totalWagered += state.initialBet;
        state.balance -= state.initialBet;
        state.log.push(`You pay $${state.initialBet} and continue without a bonus card.`);
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

        // If CPU has no cards left, check game over directly
        if (faceDownIndices.length === 0) {
          checkGameOver(state);
          return;
        }

        // Flip a random face-down card
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
      set((state) => {
        const balance = state.balance;
        Object.assign(state, { ...initialState, balance });
      });
    },
  }))
);
