import type { Card, Rank, Suit } from '../types';

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',
];

/** Ranks that are wild in Midnight Baseball */
export const WILD_RANKS = new Set<Rank>(['3', '9']);

/** Rank that grants an extra card when flipped */
export const BONUS_CARD_RANK: Rank = '4';

/**
 * Numeric value of a rank for straight/comparison purposes.
 * Wild cards (3, 9) can take any value, so they are handled separately.
 */
export const RANK_VALUE: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  J: 11, Q: 12, K: 13, A: 14,
};

/** Build a fresh, ordered 52-card deck */
export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}-${suit}`,
        rank,
        suit,
        faceUp: false,
        isWild: WILD_RANKS.has(rank),
      });
    }
  }
  return deck;
}

/** Fisher-Yates shuffle (in-place, returns mutated array) */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Deal `count` cards from the top of the deck. Returns [dealt, remaining]. */
export function dealCards(deck: Card[], count: number): [Card[], Card[]] {
  if (deck.length < count) {
    throw new Error(`Not enough cards in deck (need ${count}, have ${deck.length})`);
  }
  return [deck.slice(0, count), deck.slice(count)];
}

/** Flip a card face-up (immutable) */
export function flipCard(card: Card): Card {
  return { ...card, faceUp: true };
}

/** Display label for a card, e.g. "A♠" */
export function cardLabel(card: Card): string {
  const suitSymbols: Record<Suit, string> = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
  };
  return `${card.rank}${suitSymbols[card.suit]}`;
}

/** Whether a card triggers the bonus-card rule */
export function isBonusCard(card: Card): boolean {
  return card.rank === BONUS_CARD_RANK;
}
