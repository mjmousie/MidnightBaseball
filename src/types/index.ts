// ─── Card & Deck Types ────────────────────────────────────────────────────────

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;          // e.g. "A-spades"
  rank: Rank;
  suit: Suit;
  faceUp: boolean;
  isWild: boolean;     // true if rank is '3' or '9'
}

// ─── Hand Evaluation ─────────────────────────────────────────────────────────

export type HandRank =
  | 'HIGH_CARD'
  | 'ONE_PAIR'
  | 'TWO_PAIR'
  | 'THREE_OF_A_KIND'
  | 'STRAIGHT'
  | 'FLUSH'
  | 'FULL_HOUSE'
  | 'FOUR_OF_A_KIND'
  | 'STRAIGHT_FLUSH'
  | 'ROYAL_FLUSH'
  | 'FIVE_OF_A_KIND';  // Possible with wild cards

export interface EvaluatedHand {
  rank: HandRank;
  score: number;         // Numeric score for comparison (higher = better)
  tiebreakers: number[]; // Secondary comparison values
  label: string;         // Human-readable label
  bestFive: Card[];      // The 5 cards making the hand
}

// ─── Player ──────────────────────────────────────────────────────────────────

export type PlayerStatus = 'waiting' | 'active' | 'done' | 'folded';

export interface Player {
  id: string;
  name: string;
  hand: Card[];           // All 7+ cards in the player's possession
  visibleCards: Card[];   // Cards that have been flipped face-up
  status: PlayerStatus;
  evaluatedHand: EvaluatedHand | null;
}

// ─── Game Phase ───────────────────────────────────────────────────────────────

export type GamePhase =
  | 'IDLE'          // Before game starts
  | 'DEALING'       // Initial deal animation
  | 'REVEAL_HAND_TO_BEAT'   // Flipping the starter card
  | 'PLAYER_TURN'   // Active player flipping cards
  | 'SHOWDOWN'      // All players done, evaluate hands
  | 'GAME_OVER';    // Winner declared

// ─── Game State ───────────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  deck: Card[];
  players: Player[];
  currentPlayerIndex: number;
  handToBeat: EvaluatedHand | null;
  handToBeatCards: Card[];    // The visible "hand to beat" on the table
  winner: Player | null;
  turnLog: string[];          // Event log for the UI
}

// ─── Store Actions ────────────────────────────────────────────────────────────

export interface GameActions {
  initGame: (playerNames: string[]) => void;
  startGame: () => void;
  flipNextCard: () => void;       // Active player flips their next face-down card
  passTurn: () => void;           // Move to next player (when hand beats the target)
  evaluateShowdown: () => void;
  resetGame: () => void;
  addLogEntry: (entry: string) => void;
}
