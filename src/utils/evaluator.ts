/**
 * evaluator.ts
 *
 * Evaluates 5- and 7-card poker hands with Midnight Baseball wild-card rules:
 *   - 3s and 9s are wild (can represent any card)
 *   - Five-of-a-kind is possible and beats a straight flush / royal flush
 *
 * Public API:
 *   evaluateBestHand(cards: Card[])  → EvaluatedHand
 *   compareHands(a, b)               → number (>0 = a wins, <0 = b wins)
 *   doesBeat(challenger, champion)   → boolean
 */

import type { Card, EvaluatedHand, HandRank } from '../types';
import { RANK_VALUE } from './deck';

// ─── Hand Rank Scores ─────────────────────────────────────────────────────────

const HAND_RANK_SCORE: Record<HandRank, number> = {
  HIGH_CARD:       1,
  ONE_PAIR:        2,
  TWO_PAIR:        3,
  THREE_OF_A_KIND: 4,
  STRAIGHT:        5,
  FLUSH:           6,
  FULL_HOUSE:      7,
  FOUR_OF_A_KIND:  8,
  STRAIGHT_FLUSH:  9,
  ROYAL_FLUSH:     10,
  FIVE_OF_A_KIND:  11, // Only possible with wilds
};

/** Convert a numeric rank value to a display name like 'Aces', 'Kings', 'Tens' */
function rankName(val: number, plural = true): string {
  const names: Record<number, string> = {
    14: plural ? 'Aces'   : 'Ace',
    13: plural ? 'Kings'  : 'King',
    12: plural ? 'Queens' : 'Queen',
    11: plural ? 'Jacks'  : 'Jack',
    10: plural ? 'Tens'   : 'Ten',
    9:  plural ? 'Nines'  : 'Nine',
    8:  plural ? 'Eights' : 'Eight',
    7:  plural ? 'Sevens' : 'Seven',
    6:  plural ? 'Sixes'  : 'Six',
    5:  plural ? 'Fives'  : 'Five',
    4:  plural ? 'Fours'  : 'Four',
    3:  plural ? 'Threes' : 'Three',
    2:  plural ? 'Twos'   : 'Two',
  };
  return names[val] ?? String(val);
}

/** Build a human-readable label from a hand rank and its tiebreaker values */
function buildLabel(rank: HandRank, tiebreakers: number[]): string {
  const [primary, secondary] = tiebreakers;
  switch (rank) {
    case 'HIGH_CARD':
      return primary ? `High Card, ${rankName(primary, false)}` : 'High Card';
    case 'ONE_PAIR':
      return primary ? `One Pair, ${rankName(primary)}` : 'One Pair';
    case 'TWO_PAIR':
      return (primary && secondary)
        ? `Two Pair, ${rankName(primary)} & ${rankName(secondary)}`
        : 'Two Pair';
    case 'THREE_OF_A_KIND':
      return primary ? `Three of a Kind, ${rankName(primary)}` : 'Three of a Kind';
    case 'STRAIGHT':
      return primary ? `Straight, ${rankName(primary, false)} High` : 'Straight';
    case 'FLUSH':
      return primary ? `Flush, ${rankName(primary, false)} High` : 'Flush';
    case 'FULL_HOUSE':
      return (primary && secondary)
        ? `Full House, ${rankName(primary)} over ${rankName(secondary)}`
        : 'Full House';
    case 'FOUR_OF_A_KIND':
      return primary ? `Four of a Kind, ${rankName(primary)}` : 'Four of a Kind';
    case 'STRAIGHT_FLUSH':
      return primary ? `Straight Flush, ${rankName(primary, false)} High` : 'Straight Flush';
    case 'ROYAL_FLUSH':
      return 'Royal Flush';
    case 'FIVE_OF_A_KIND':
      return primary ? `Five of a Kind, ${rankName(primary)}` : 'Five of a Kind';
    default:
      return rank;
  }
}

// ─── Internal Types ───────────────────────────────────────────────────────────

interface FiveCardResult {
  rank: HandRank;
  score: number;
  tiebreakers: number[];
  bestFive: Card[];
}

// ─── Helper Utilities ─────────────────────────────────────────────────────────

/** Generate all combinations of size k from an array (iterative, no spread overhead) */
function combinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  const n = arr.length;
  if (k > n) return result;
  // Use index-based iteration to avoid repeated array spreading
  const indices = Array.from({ length: k }, (_, i) => i);
  while (true) {
    result.push(indices.map((i) => arr[i]));
    let i = k - 1;
    while (i >= 0 && indices[i] === i + n - k) i--;
    if (i < 0) break;
    indices[i]++;
    for (let j = i + 1; j < k; j++) indices[j] = indices[j - 1] + 1;
  }
  return result;
}

/** Sort numeric values descending */
function sortDesc(nums: number[]): number[] {
  return [...nums].sort((a, b) => b - a);
}

// ─── 5-Card Evaluator (with wilds) ───────────────────────────────────────────

/**
 * Evaluate exactly 5 cards (may include wild cards).
 * Returns the best possible hand by trying all wild-card substitutions.
 */
function evaluateFiveCards(five: Card[]): FiveCardResult {
  const wilds = five.filter((c) => c.isWild);
  const naturals = five.filter((c) => !c.isWild);

  if (wilds.length === 5) {
    // Edge case: all wilds → five aces
    return {
      rank: 'FIVE_OF_A_KIND',
      score: HAND_RANK_SCORE['FIVE_OF_A_KIND'],
      tiebreakers: [14],
      bestFive: five,
    };
  }

  // Try every possible substitution for wilds and keep the best result
  const bestResult = tryBestWildSubstitution(naturals, wilds.length, five);
  return bestResult;
}

/**
 * Optimised wild substitution.
 *
 * Key insight: suit only matters for flushes. So we only need to try all 4
 * suits when the natural cards already have 4+ of the same suit (making a
 * flush possible). Otherwise a single representative suit is enough, reducing
 * the search space from 52^n to 13^n — a ~10x speedup with 1 wild, ~100x with 2.
 */
function tryBestWildSubstitution(
  naturals: Card[],
  wildCount: number,
  originalFive: Card[],
): FiveCardResult {
  const ALL_RANK_VALS = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] as const;
  const ALL_SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

  // Determine which suits to try for wilds.
  // A flush is only possible if naturals already share a dominant suit.
  const suitCounts = new Map<string, number>();
  for (const c of naturals) suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  const maxSuitCount = Math.max(0, ...[...suitCounts.values()]);
  // Only bother trying all suits if a flush is within reach
  const totalCards = naturals.length + wildCount;
  const flushPossible = totalCards >= 5 && maxSuitCount + wildCount >= 5;
  const suitsToTry: readonly string[] = flushPossible ? ALL_SUITS : ['spades'];

  // Helper: numeric value → Rank string
  const toRankStr = (v: number): string =>
    v === 14 ? 'A' : v === 13 ? 'K' : v === 12 ? 'Q' : v === 11 ? 'J' : String(v);

  let best: FiveCardResult | null = null;

  function assign(remaining: number, assigned: Card[]): void {
    if (remaining === 0) {
      const candidate = evaluateNaturalFive([...naturals, ...assigned], originalFive);
      if (!best || candidate.score > best.score ||
        (candidate.score === best.score &&
          compareTiebreakers(candidate.tiebreakers, best.tiebreakers) > 0)) {
        best = candidate;
      }
      return;
    }
    for (const rankVal of ALL_RANK_VALS) {
      for (const suit of suitsToTry) {
        const proxy: Card = {
          id: `wp-${rankVal}-${suit}`,
          rank: toRankStr(rankVal) as any,
          suit: suit as any,
          faceUp: true,
          isWild: true,
        };
        assign(remaining - 1, [...assigned, proxy]);
      }
    }
  }

  assign(wildCount, []);
  return best!;
}

/** Compare two tiebreaker arrays lexicographically */
function compareTiebreakers(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Evaluate a fully concrete 5-card hand (no wilds remain unassigned) */
function evaluateNaturalFive(five: Card[], displayFive: Card[]): FiveCardResult {
  const values = sortDesc(five.map((c) => RANK_VALUE[c.rank]));
  const suits = five.map((c) => c.suit);
  const isFlush = five.length === 5 && new Set(suits).size === 1;

  // Check for straight (requires exactly 5 distinct values)
  const uniqueVals = [...new Set(values)];
  let isStraight = false;
  let straightHigh = 0;

  if (five.length === 5 && uniqueVals.length === 5) {
    if (values[0] - values[4] === 4) {
      isStraight = true;
      straightHigh = values[0];
    }
    // Ace-low straight: A-2-3-4-5
    if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
      isStraight = true;
      straightHigh = 5;
    }
  }

  // Count occurrences of each value
  const countMap = new Map<number, number>();
  for (const v of values) {
    countMap.set(v, (countMap.get(v) ?? 0) + 1);
  }
  const counts = sortDesc([...countMap.values()]);
  const countKeys = [...countMap.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const primaryVals = countKeys.map(([v]) => v);

  // Check for five-of-a-kind (only reachable via wilds)
  if (counts[0] === 5) {
    return make('FIVE_OF_A_KIND', [primaryVals[0]], displayFive);
  }
  if (isFlush && isStraight) {
    if (straightHigh === 14) return make('ROYAL_FLUSH', [14], displayFive);
    return make('STRAIGHT_FLUSH', [straightHigh], displayFive);
  }
  if (counts[0] === 4) return make('FOUR_OF_A_KIND', primaryVals, displayFive);
  if (counts[0] === 3 && counts[1] === 2) return make('FULL_HOUSE', primaryVals, displayFive);
  if (isFlush) return make('FLUSH', values, displayFive);
  if (isStraight) return make('STRAIGHT', [straightHigh], displayFive);
  if (counts[0] === 3) return make('THREE_OF_A_KIND', primaryVals, displayFive);
  if (counts[0] === 2 && counts[1] === 2) return make('TWO_PAIR', primaryVals, displayFive);
  if (counts[0] === 2) return make('ONE_PAIR', primaryVals, displayFive);
  return make('HIGH_CARD', values, displayFive);
}

function make(rank: HandRank, tiebreakers: number[], bestFive: Card[]): FiveCardResult {
  return {
    rank,
    score: HAND_RANK_SCORE[rank],
    tiebreakers,
    bestFive,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate the best 5-card hand from 5–7 cards (with wild card support).
 * Tries every combination of 5 from the given cards.
 */
export function evaluateBestHand(cards: Card[]): EvaluatedHand {
  if (cards.length === 0) {
    return { rank: 'HIGH_CARD', score: 0, tiebreakers: [], label: '—', bestFive: [] };
  }

  // For fewer than 5 cards, evaluate what we have directly
  if (cards.length < 5) {
    const result = evaluateFiveCards(cards);
    return {
      rank: result.rank,
      score: result.score,
      tiebreakers: result.tiebreakers,
      label: buildLabel(result.rank, result.tiebreakers),
      bestFive: result.bestFive,
    };
  }

  const fiveCardCombos = cards.length === 5
    ? [cards]
    : combinations(cards, 5);

  let best: FiveCardResult | null = null;

  for (const combo of fiveCardCombos) {
    const result = evaluateFiveCards(combo);
    if (!best ||
      result.score > best.score ||
      (result.score === best.score && compareTiebreakers(result.tiebreakers, best.tiebreakers) > 0)
    ) {
      best = result;
    }
  }

  return {
    rank: best!.rank,
    score: best!.score,
    tiebreakers: best!.tiebreakers,
    label: buildLabel(best!.rank, best!.tiebreakers),
    bestFive: best!.bestFive,
  };
}

/**
 * Compare two evaluated hands.
 * Returns a positive number if `a` wins, negative if `b` wins, 0 for a tie.
 */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  if (a.score !== b.score) return a.score - b.score;
  return compareTiebreakers(a.tiebreakers, b.tiebreakers);
}

/**
 * Returns true if `challenger` beats `champion`.
 */
export function doesBeat(challenger: EvaluatedHand, champion: EvaluatedHand): boolean {
  return compareHands(challenger, champion) > 0;
}