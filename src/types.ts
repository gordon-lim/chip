export type Card = {
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
  suit: 'clubs' | 'diamonds' | 'hearts' | 'spades';
};

export type ActionResult = {
  seatIndex: number;
  playerPos: string;
  actionType: 'fold' | 'check' | 'call' | 'bet' | 'raise';
  amount?: number;
  roundOfBetting?: string;
  forcedBets?: { ante: number; smallBlind: number; bigBlind: number };
};

export enum Action {
  FOLD = 1 << 0,
  CHECK = 1 << 1,
  CALL = 1 << 2,
  BET = 1 << 3,
  RAISE = 1 << 4
}
