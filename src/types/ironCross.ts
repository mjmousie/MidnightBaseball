import type { Card, EvaluatedHand } from './index';

export type IronCrossPhase =
  | 'SETUP'
  | 'DRAWING'    // player selects up to 2 cards to discard
  | 'CHOOSING'   // board partially revealed, player picks row
  | 'BACKING'    // player places backup bet
  | 'REVEAL'     // dealer + board fully revealed, result shown
  | 'GAME_OVER';

export type RowChoice = 'top' | 'right' | 'mystery' | 'both';

export interface BoardState {
  top:    Card;
  left:   Card;
  center: Card;
  right:  Card;
  bottom: Card;
}

export interface IronCrossGameState {
  phase: IronCrossPhase;
  gameId: number;
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  board: BoardState | null;
  chosenRow: RowChoice | null;
  dealerChosenRow: RowChoice | null;
  initialBet: number;
  backupBet: number;
  totalWagered: number;
  playerBestHand: EvaluatedHand | null;
  dealerBestHand: EvaluatedHand | null;
  winner: 'player' | 'dealer' | 'tie' | null;
  resultMessage: string;
}

export interface IronCrossActions {
  initGame: (bet: number) => void;
  flipTopCard: () => void;
  flipRightCard: () => void;
  drawCards: (indicesToDiscard: number[]) => void;
  standPat: () => void;
  surrenderDraw: () => void;
  chooseRow: (row: RowChoice) => void;
  surrender: () => void;
  placeBackupBet: (amount: number) => void;
  resetGame: () => void;
}
