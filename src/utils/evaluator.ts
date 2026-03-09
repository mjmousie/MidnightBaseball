/**
 * evaluator.ts
 *
 * Evaluates poker hands with Midnight Baseball wild-card rules:
 *   - 3s and 9s are wild (can represent any card)
 *   - Five-of-a-kind is possible with wilds
 *
 * Strategy: try every 5-card combo from the player's visible cards,
 * and for each combo try all meaningful wild substitutions.
 * Optimised to avoid redundant work via early exit and suit pruning.
 */

import type { Card, EvaluatedHand, HandRank } from '../types';
import { RANK_VALUE } from './deck';

// ─── Constants ────────────────────────────────────────────────────────────────

const HAND_RANK_SCORE: Record<HandRank, number> = {
  HIGH_CARD: 1, ONE_PAIR: 2, TWO_PAIR: 3, THREE_OF_A_KIND: 4,
  STRAIGHT: 5, FLUSH: 6, FULL_HOUSE: 7, FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9, ROYAL_FLUSH: 10, FIVE_OF_A_KIND: 11,
};

const MAX_SCORE = HAND_RANK_SCORE['FIVE_OF_A_KIND'];
const ALL_RANK_VALS = [14, 13, 12, 11, 10, 8, 7, 6, 5, 4, 2] as const; // skip wild ranks 3 & 9
const ALL_SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

// ─── Label Builder ────────────────────────────────────────────────────────────

function rankName(val: number, plural = true): string {
  const names: Record<number, string> = {
    14: plural ? 'Aces' : 'Ace', 13: plural ? 'Kings' : 'King',
    12: plural ? 'Queens' : 'Queen', 11: plural ? 'Jacks' : 'Jack',
    10: plural ? 'Tens' : 'Ten', 9: plural ? 'Nines' : 'Nine',
    8: plural ? 'Eights' : 'Eight', 7: plural ? 'Sevens' : 'Seven',
    6: plural ? 'Sixes' : 'Six', 5: plural ? 'Fives' : 'Five',
    4: plural ? 'Fours' : 'Four', 3: plural ? 'Threes' : 'Three',
    2: plural ? 'Twos' : 'Two',
  };
  return names[val] ?? String(val);
}

function buildLabel(rank: HandRank, tiebreakers: number[]): string {
  const [p, s] = tiebreakers;
  switch (rank) {
    case 'HIGH_CARD':       return p ? `High Card, ${rankName(p, false)}` : 'High Card';
    case 'ONE_PAIR':        return p ? `One Pair, ${rankName(p)}` : 'One Pair';
    case 'TWO_PAIR':        return (p && s) ? `Two Pair, ${rankName(p)} & ${rankName(s)}` : 'Two Pair';
    case 'THREE_OF_A_KIND': return p ? `Three of a Kind, ${rankName(p)}` : 'Three of a Kind';
    case 'STRAIGHT':        return p ? `Straight, ${rankName(p, false)} High` : 'Straight';
    case 'FLUSH':           return p ? `Flush, ${rankName(p, false)} High` : 'Flush';
    case 'FULL_HOUSE':      return (p && s) ? `Full House, ${rankName(p)} over ${rankName(s)}` : 'Full House';
    case 'FOUR_OF_A_KIND':  return p ? `Four of a Kind, ${rankName(p)}` : 'Four of a Kind';
    case 'STRAIGHT_FLUSH':  return p ? `Straight Flush, ${rankName(p, false)} High` : 'Straight Flush';
    case 'ROYAL_FLUSH':     return 'Royal Flush';
    case 'FIVE_OF_A_KIND':  return p ? `Five of a Kind, ${rankName(p)}` : 'Five of a Kind';
    default:                return rank;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sortDesc(nums: number[]): number[] {
  return [...nums].sort((a, b) => b - a);
}

function compareTiebreakers(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function combinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  const n = arr.length;
  if (k > n) return result;
  const indices = Array.from({ length: k }, (_, i) => i);
  while (true) {
    result.push(indices.map(i => arr[i]));
    let i = k - 1;
    while (i >= 0 && indices[i] === i + n - k) i--;
    if (i < 0) break;
    indices[i]++;
    for (let j = i + 1; j < k; j++) indices[j] = indices[j - 1] + 1;
  }
  return result;
}

// ─── 5-Card Evaluator (no wilds) ─────────────────────────────────────────────

interface FiveResult { score: number; rank: HandRank; tiebreakers: number[]; }

function evalConcrete(five: Card[]): FiveResult {
  const vals = sortDesc(five.map(c => RANK_VALUE[c.rank]));
  const suits = five.map(c => c.suit);
  const isFlush = five.length === 5 && new Set(suits).size === 1;

  const uniqueVals = [...new Set(vals)];
  let isStraight = false, straightHigh = 0;
  if (five.length === 5 && uniqueVals.length === 5) {
    if (vals[0] - vals[4] === 4) { isStraight = true; straightHigh = vals[0]; }
    if (vals[0] === 14 && vals[1] === 5 && vals[2] === 4 && vals[3] === 3 && vals[4] === 2) {
      isStraight = true; straightHigh = 5;
    }
  }

  const rankMap = new Map<number, number>();
  for (const v of vals) rankMap.set(v, (rankMap.get(v) ?? 0) + 1);
  const byCount = [...rankMap.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const counts = byCount.map(([, c]) => c);
  const pv = byCount.map(([v]) => v);

  const r = (rank: HandRank, tb: number[]): FiveResult =>
    ({ score: HAND_RANK_SCORE[rank], rank, tiebreakers: tb });

  if (counts[0] === 5)              return r('FIVE_OF_A_KIND', [pv[0]]);
  if (isFlush && isStraight)        return straightHigh === 14 ? r('ROYAL_FLUSH', [14]) : r('STRAIGHT_FLUSH', [straightHigh]);
  if (counts[0] === 4)              return r('FOUR_OF_A_KIND', pv);
  if (counts[0] === 3 && counts[1] === 2) return r('FULL_HOUSE', pv);
  if (isFlush)                      return r('FLUSH', vals);
  if (isStraight)                   return r('STRAIGHT', [straightHigh]);
  if (counts[0] === 3)              return r('THREE_OF_A_KIND', pv);
  if (counts[0] === 2 && counts[1] === 2) return r('TWO_PAIR', pv);
  if (counts[0] === 2)              return r('ONE_PAIR', pv);
  return r('HIGH_CARD', vals);
}

// ─── Wild Substitution (optimised) ───────────────────────────────────────────

function bestForFive(five: Card[]): FiveResult {
  const wilds = five.filter(c => c.isWild);
  const naturals = five.filter(c => !c.isWild);

  // No wilds — evaluate directly
  if (wilds.length === 0) return evalConcrete(five);

  // All wilds — five aces
  if (wilds.length === 5) return { score: HAND_RANK_SCORE['FIVE_OF_A_KIND'], rank: 'FIVE_OF_A_KIND', tiebreakers: [14] };

  // Determine suits to try — only try all 4 if flush is reachable
  const suitCounts = new Map<string, number>();
  for (const c of naturals) suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  const maxSuit = Math.max(0, ...[...suitCounts.values()]);
  const flushPossible = maxSuit + wilds.length >= 5;
  const suitsToTry = flushPossible ? ALL_SUITS : (['spades'] as const);

  let best: FiveResult | null = null;

  function assign(remaining: number, assigned: Card[]): boolean {
    if (remaining === 0) {
      const candidate = evalConcrete([...naturals, ...assigned]);
      if (!best || candidate.score > best.score ||
        (candidate.score === best.score && compareTiebreakers(candidate.tiebreakers, best.tiebreakers) > 0)) {
        best = candidate;
      }
      // Early exit if we've found the best possible hand
      return best.score === MAX_SCORE;
    }
    for (const rankVal of ALL_RANK_VALS) {
      for (const suit of suitsToTry) {
        const proxy: Card = {
          id: `wp-${rankVal}-${suit}`, rank: (rankVal === 14 ? 'A' : rankVal === 13 ? 'K' :
            rankVal === 12 ? 'Q' : rankVal === 11 ? 'J' : String(rankVal)) as any,
          suit: suit as any, faceUp: true, isWild: true,
        };
        if (assign(remaining - 1, [...assigned, proxy])) return true; // propagate early exit
      }
    }
    return false;
  }

  assign(wilds.length, []);
  return best!;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function evaluateBestHand(cards: Card[]): EvaluatedHand {
  if (cards.length === 0) {
    return { rank: 'HIGH_CARD', score: 0, tiebreakers: [], label: '—', bestFive: [] };
  }

  const combos = cards.length <= 5 ? [cards] : combinations(cards, 5);

  let best: FiveResult | null = null;
  let bestFive: Card[] = combos[0];

  for (const combo of combos) {
    const result = bestForFive(combo);
    if (!best || result.score > best.score ||
      (result.score === best.score && compareTiebreakers(result.tiebreakers, best.tiebreakers) > 0)) {
      best = result;
      bestFive = combo;
    }
    if (best.score === MAX_SCORE) break; // can't do better
  }

  return {
    rank: best!.rank,
    score: best!.score,
    tiebreakers: best!.tiebreakers,
    label: buildLabel(best!.rank, best!.tiebreakers),
    bestFive,
  };
}

export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  if (a.score !== b.score) return a.score - b.score;
  return compareTiebreakers(a.tiebreakers, b.tiebreakers);
}

export function doesBeat(challenger: EvaluatedHand, champion: EvaluatedHand): boolean {
  return compareHands(challenger, champion) > 0;
}