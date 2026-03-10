import type { Card, EvaluatedHand } from './index';

export type CasinoSide = 'banker' | 'player';

export type CasinoPhase =
  | 'SETUP'
  | 'PLAYING'
  | 'WILD_PROMPT'
  | 'FOUR_PROMPT'
  | 'GAME_OVER';

export interface CasinoSideState {
  hand: Card[];
  evaluatedHand: EvaluatedHand | null;
}

export interface CasinoGameState {
  phase: CasinoPhase;
  deck: Card[];
  banker: CasinoSideState;
  player: CasinoSideState;
  bettorSide: CasinoSide | null;
  activeSide: CasinoSide | null;
  handToBeat: EvaluatedHand | null;
  handToBeatSide: CasinoSide | null;
  initialBet: number;
  totalWagered: number;
  // balance lives in shared balanceStore
  pendingWildCard: Card | null;
  winner: CasinoSide | null;
  resultMessage: string;
  log: string[];
  flipCount: number;
}

export interface CasinoActions {
  initCasino: (bettorSide: CasinoSide, bet: number) => void;
  flipBettorCard: (cardIndex: number) => void;
  payWildAndContinue: () => void;
  foldHand: () => void;
  payFourForCard: () => void;
  triggerCpuFlip: () => void;
  resetCasino: () => void;
}
