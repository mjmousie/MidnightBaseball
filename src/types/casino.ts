import type { Card, EvaluatedHand } from './index';

export type CasinoSide = 'banker' | 'player';

export type CasinoPhase =
  | 'SETUP'         // Pick side and place initial bet
  | 'PLAYING'       // Main game loop
  | 'WILD_PROMPT'   // Wild card appeared on bettor's side — pay half bet or fold
  | 'FOUR_PROMPT'   // 4 appeared on bettor's side — pay full bet for card, or half bet to skip
  | 'CPU_FLIP'      // CPU is auto-flipping (brief pause phase)
  | 'GAME_OVER';    // Winner declared

export interface CasinoSideState {
  hand: Card[];
  evaluatedHand: EvaluatedHand | null;
}

export interface CasinoGameState {
  phase: CasinoPhase;
  deck: Card[];
  banker: CasinoSideState;
  player: CasinoSideState;

  bettorSide: CasinoSide | null;   // Which side the bettor chose
  activeSide: CasinoSide | null;   // Whose turn it is right now
  handToBeat: EvaluatedHand | null;
  handToBeatSide: CasinoSide | null;

  initialBet: number;              // The opening wager
  totalWagered: number;            // Sum of all wagers placed this hand
  balance: number;                 // Bettor's current chip balance
  pendingWildCard: Card | null;    // The wild/4 that triggered the prompt
  winner: CasinoSide | null;
  resultMessage: string;
  log: string[];
  flipCount: number;  // increments on every CPU flip to trigger useEffect re-run
}

export interface CasinoActions {
  initCasino: (bettorSide: CasinoSide, bet: number) => void;
  flipBettorCard: (cardIndex: number) => void;
  payWildAndContinue: () => void;       // Pay half bet, keep hand
  foldHand: () => void;                 // Forfeit — bettor loses all wagered
  payFourForCard: () => void;           // Pay full bet, receive bonus card
  payHalfAndContinueWithoutCard: () => void; // Pay half bet, no bonus card
  triggerCpuFlip: () => void;           // Advance CPU flip
  resetCasino: () => void;
}
