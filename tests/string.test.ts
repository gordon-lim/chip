import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Table } from 'poker-ts';
import {
  formatForcedBet,
  formatPlayerStacks,
  formatPlayerPositions,
  formatPlayerActions,
  formatCard,
  formatCommunityCards,
  formatPlayerHoleCards,
  formatWinners
} from '../src/string';
import { PRINT_LABELS } from '../src/constants/label';
import { ROUNDS } from '../src/constants/rounds';
import { POS } from '../src/constants/pos';
import { Card, ActionResult } from '../src/types';

// Mock the table module
vi.mock('../src/table', () => ({
  getPlayerPosition: vi.fn()
}));

// Import the mocked module
import * as tableModule from '../src/table';

describe('String Formatting Functions', () => {
  let mockTable: any;
  let getPlayerPositionMock: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup getPlayerPosition mock
    getPlayerPositionMock = vi.mocked(tableModule.getPlayerPosition);
    
    // Create a mock table with common methods
    mockTable = {
      forcedBets: vi.fn(),
      numSeats: vi.fn(),
      seats: vi.fn(),
      roundOfBetting: vi.fn(),
      button: vi.fn(),
      winners: vi.fn()
    };
  });

  describe('formatForcedBet', () => {
    it('should format forced bets correctly', () => {
      mockTable.forcedBets.mockReturnValue({ ante: 100, smallBlind: 200, bigBlind: 400 });
      mockTable.numSeats.mockReturnValue(6);

      const result = formatForcedBet(mockTable);

      expect(result).toBe('200/400 (ante: 100) - 6 seats\n\n');
    });

    it('should handle zero ante', () => {
      mockTable.forcedBets.mockReturnValue({ ante: 0, smallBlind: 50, bigBlind: 100 });
      mockTable.numSeats.mockReturnValue(9);

      const result = formatForcedBet(mockTable);

      expect(result).toBe('50/100 (ante: 0) - 9 seats\n\n');
    });

    it('should handle different table sizes', () => {
      mockTable.forcedBets.mockReturnValue({ ante: 25, smallBlind: 100, bigBlind: 200 });
      mockTable.numSeats.mockReturnValue(2);

      const result = formatForcedBet(mockTable);

      expect(result).toBe('100/200 (ante: 25) - 2 seats\n\n');
    });
  });

  describe('formatPlayerStacks', () => {
    it('should format player stacks with mixed seats', () => {
      mockTable.numSeats.mockReturnValue(4);
      mockTable.seats.mockReturnValue([
        { totalChips: 1500 },
        null,
        { totalChips: 2000 },
        { totalChips: 750 }
      ]);

      const result = formatPlayerStacks(mockTable);

      const expected = `${PRINT_LABELS.STACKS}\n` +
        'Seat 1: 1500\n' +
        'Seat 2: empty\n' +
        'Seat 3: 2000\n' +
        'Seat 4: 750\n\n';

      expect(result).toBe(expected);
    });

    it('should handle all empty seats', () => {
      mockTable.numSeats.mockReturnValue(3);
      mockTable.seats.mockReturnValue([null, null, null]);

      const result = formatPlayerStacks(mockTable);

      const expected = `${PRINT_LABELS.STACKS}\n` +
        'Seat 1: empty\n' +
        'Seat 2: empty\n' +
        'Seat 3: empty\n\n';

      expect(result).toBe(expected);
    });

    it('should handle all occupied seats', () => {
      mockTable.numSeats.mockReturnValue(2);
      mockTable.seats.mockReturnValue([
        { totalChips: 1000 },
        { totalChips: 1200 }
      ]);

      const result = formatPlayerStacks(mockTable);

      const expected = `${PRINT_LABELS.STACKS}\n` +
        'Seat 1: 1000\n' +
        'Seat 2: 1200\n\n';

      expect(result).toBe(expected);
    });
  });

  describe('formatPlayerPositions', () => {
    it('should format player positions correctly', () => {
      mockTable.numSeats.mockReturnValue(3);
      mockTable.seats.mockReturnValue([
        { totalChips: 1000 },
        null,
        { totalChips: 1200 }
      ]);

      getPlayerPositionMock
        .mockReturnValueOnce('BTN')
        .mockReturnValueOnce('SB')
        .mockReturnValueOnce('BB');

      const result = formatPlayerPositions(mockTable);

      const expected = `${PRINT_LABELS.POSITIONS}\n` +
        'Seat 1: BTN\n' +
        'Seat 2: SB\n' +
        'Seat 3: BB\n\n';

      expect(result).toBe(expected);
      expect(getPlayerPositionMock).toHaveBeenCalledTimes(3);
      expect(getPlayerPositionMock).toHaveBeenNthCalledWith(1, mockTable, 0);
      expect(getPlayerPositionMock).toHaveBeenNthCalledWith(2, mockTable, 1);
      expect(getPlayerPositionMock).toHaveBeenNthCalledWith(3, mockTable, 2);
    });
  });

  describe('formatPlayerActions', () => {
    it('should format preflop actions with forced bets', () => {
      const actionResults: ActionResult[] = [
        {
          seatIndex: 0,
          playerPos: 'UTG',
          actionType: 'call',
          roundOfBetting: ROUNDS.PREFLOP,
          forcedBets: { ante: 100, smallBlind: 200, bigBlind: 400 }
        },
        {
          seatIndex: 1,
          playerPos: 'CO',
          actionType: 'raise',
          amount: 800
        }
      ];

      const result = formatPlayerActions(mockTable, actionResults);

      const expected = `${PRINT_LABELS.PREFLOP}\n` +
        '  All players post ante 100\n' +
        '  SB posts small blind 200\n' +
        '  BB posts big blind 400\n' +
        '  UTG calls\n' +
        '  CO raises to 800\n';

      expect(result).toBe(expected);
    });

    it('should format actions without preflop header', () => {
      const actionResults: ActionResult[] = [
        {
          seatIndex: 0,
          playerPos: 'UTG',
          actionType: 'bet',
          amount: 500
        },
        {
          seatIndex: 1,
          playerPos: 'CO',
          actionType: 'fold'
        }
      ];

      const result = formatPlayerActions(mockTable, actionResults);

      const expected = '  UTG bets 500\n' +
        '  CO folds\n';

      expect(result).toBe(expected);
    });

    it('should handle all action types', () => {
      const actionResults: ActionResult[] = [
        {
          seatIndex: 0,
          playerPos: 'UTG',
          actionType: 'fold'
        },
        {
          seatIndex: 1,
          playerPos: 'CO',
          actionType: 'check'
        },
        {
          seatIndex: 2,
          playerPos: 'BTN',
          actionType: 'call'
        },
        {
          seatIndex: 3,
          playerPos: 'SB',
          actionType: 'bet',
          amount: 300
        },
        {
          seatIndex: 4,
          playerPos: 'BB',
          actionType: 'raise',
          amount: 600
        }
      ];

      const result = formatPlayerActions(mockTable, actionResults);

      const expected = '  UTG folds\n' +
        '  CO checks\n' +
        '  BTN calls\n' +
        '  SB bets 300\n' +
        '  BB raises to 600\n';

      expect(result).toBe(expected);
    });

    it('should handle empty action results', () => {
      const result = formatPlayerActions(mockTable, []);
      expect(result).toBe('');
    });
  });

  describe('formatCard', () => {
    it('should format cards correctly for all suits', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'J', suit: 'clubs' }
      ];

      expect(formatCard(cards[0])).toBe('As');
      expect(formatCard(cards[1])).toBe('Kh');
      expect(formatCard(cards[2])).toBe('Qd');
      expect(formatCard(cards[3])).toBe('Jc');
    });

    it('should format cards correctly for all ranks', () => {
      const ranks: Card['rank'][] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
      
      ranks.forEach(rank => {
        const card: Card = { rank, suit: 'hearts' };
        expect(formatCard(card)).toBe(rank + 'h');
      });
    });
  });

  describe('formatCommunityCards', () => {
    const sampleCards: Card[] = [
      { rank: 'A', suit: 'spades' },
      { rank: 'K', suit: 'hearts' },
      { rank: 'Q', suit: 'diamonds' }
    ];

    it('should format flop cards', () => {
      mockTable.roundOfBetting.mockReturnValue(ROUNDS.FLOP);

      const result = formatCommunityCards(mockTable, sampleCards);

      expect(result).toBe('*** Flop *** As Kh Qd\n');
    });

    it('should format turn cards', () => {
      mockTable.roundOfBetting.mockReturnValue(ROUNDS.TURN);

      const result = formatCommunityCards(mockTable, sampleCards);

      expect(result).toBe('*** Turn *** As Kh Qd\n');
    });

    it('should format river cards', () => {
      mockTable.roundOfBetting.mockReturnValue(ROUNDS.RIVER);

      const result = formatCommunityCards(mockTable, sampleCards);

      expect(result).toBe('*** River *** As Kh Qd\n');
    });

    it('should return empty string for preflop', () => {
      mockTable.roundOfBetting.mockReturnValue(ROUNDS.PREFLOP);

      const result = formatCommunityCards(mockTable, sampleCards);

      expect(result).toBe('');
    });

    it('should handle single card', () => {
      mockTable.roundOfBetting.mockReturnValue(ROUNDS.FLOP);
      const singleCard = [{ rank: 'A', suit: 'spades' }] as Card[];

      const result = formatCommunityCards(mockTable, singleCard);

      expect(result).toBe('*** Flop *** As\n');
    });
  });

  describe('formatPlayerHoleCards', () => {
    it('should format player hole cards correctly', () => {
      mockTable.numSeats.mockReturnValue(4);
      
      getPlayerPositionMock
        .mockReturnValueOnce('UTG')
        .mockReturnValueOnce('CO')
        .mockReturnValueOnce('BTN');

      const playerHoleCards = {
        0: [{ rank: 'A', suit: 'spades' }, { rank: 'K', suit: 'hearts' }] as Card[],
        2: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }] as Card[],
        3: [{ rank: 'T', suit: 'spades' }, { rank: '9', suit: 'hearts' }] as Card[]
      };

      const result = formatPlayerHoleCards(mockTable, playerHoleCards);

      const expected = `${PRINT_LABELS.SHOWDOWN}\n` +
        '  UTG shows As Kh\n' +
        '  CO shows Qd Jc\n' +
        '  BTN shows Ts 9h\n';

      expect(result).toBe(expected);
    });

    it('should handle empty hole cards', () => {
      mockTable.numSeats.mockReturnValue(2);
      const playerHoleCards = {};

      const result = formatPlayerHoleCards(mockTable, playerHoleCards);

      expect(result).toBe(`${PRINT_LABELS.SHOWDOWN}\n`);
    });

    it('should show "chucked" when player has all null cards (did not reveal)', () => {
      mockTable.numSeats.mockReturnValue(3);
      
      getPlayerPositionMock
        .mockReturnValueOnce('UTG')
        .mockReturnValueOnce('CO')
        .mockReturnValueOnce('BTN');

      const playerHoleCards = {
        0: [{ rank: 'A', suit: 'spades' }, { rank: 'K', suit: 'hearts' }] as (Card | null)[],
        1: [null, null] as (Card | null)[], // Player didn't reveal
        2: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }] as (Card | null)[]
      };

      const result = formatPlayerHoleCards(mockTable, playerHoleCards);

      const expected = `${PRINT_LABELS.SHOWDOWN}\n` +
        '  UTG shows As Kh\n' +
        '  CO chucked\n' +
        '  BTN shows Qd Jc\n';

      expect(result).toBe(expected);
    });
  });

  describe('formatWinners', () => {
    beforeEach(() => {
      mockTable.numSeats.mockReturnValue(6);
      mockTable.button.mockReturnValue(2);
    });

    it('should handle no winners from table, use first eligible player', () => {
      mockTable.winners.mockReturnValue([]);
      getPlayerPositionMock.mockReturnValue('UTG');

      const showdownPots = [
        { size: 1000, eligiblePlayers: [1, 3, 4] }
      ];

      const result = formatWinners(mockTable, showdownPots);

      expect(result).toBe('*** Showdown ***\n  UTG wins 1000\n\n');
      expect(getPlayerPositionMock).toHaveBeenCalledWith(mockTable, 1);
    });

    it('should distribute pot equally among winners', () => {
      mockTable.winners.mockReturnValue([0, 1, 2]);
      
      getPlayerPositionMock
        .mockReturnValueOnce('UTG')
        .mockReturnValueOnce('CO')
        .mockReturnValueOnce('BTN');

      const showdownPots = [
        { size: 900, eligiblePlayers: [0, 1, 2] }
      ];

      const result = formatWinners(mockTable, showdownPots);

      expect(result).toBe('*** Showdown ***\n  UTG wins 300\n  CO wins 300\n  BTN wins 300\n\n');
    });

    it('should handle odd chips distribution', () => {
      mockTable.winners.mockReturnValue([0, 1, 2]);
      
      getPlayerPositionMock
        .mockReturnValueOnce('UTG')
        .mockReturnValueOnce('CO')
        .mockReturnValueOnce('BTN');

      const showdownPots = [
        { size: 1000, eligiblePlayers: [0, 1, 2] }
      ];

      const result = formatWinners(mockTable, showdownPots);

      // 1000 / 3 = 333 remainder 1
      // First player (closest to button) gets extra chip
      expect(result).toBe('*** Showdown ***\n  UTG wins 334\n  CO wins 333\n  BTN wins 333\n\n');
    });

    it('should handle multiple pots', () => {
      mockTable.winners.mockReturnValue([0, 1]);
      
      getPlayerPositionMock
        .mockReturnValueOnce('UTG')
        .mockReturnValueOnce('CO')
        .mockReturnValueOnce('UTG')
        .mockReturnValueOnce('BTN');

      const showdownPots = [
        { size: 600, eligiblePlayers: [0, 1] },
        { size: 400, eligiblePlayers: [0, 3] }
      ];

      const result = formatWinners(mockTable, showdownPots);

      expect(result).toBe('*** Showdown ***\n  UTG wins 300\n  CO wins 300\n  UTG wins 200\n  BTN wins 200\n\n');
    });

    it('should handle empty showdown pots with no winners', () => {
      mockTable.winners.mockReturnValue([]);
      const showdownPots: { size: number, eligiblePlayers: number[] }[] = [];

      const result = formatWinners(mockTable, showdownPots);

      expect(result).toBe('*** Showdown ***\n\n');
    });

    it('should sort winners by position relative to button', () => {
      mockTable.winners.mockReturnValue([5, 0, 3]);
      mockTable.button.mockReturnValue(1); // Button at seat 1
      
      getPlayerPositionMock
        .mockReturnValueOnce('MP') // seat 3 (distance 2)
        .mockReturnValueOnce('CO') // seat 5 (distance 4) 
        .mockReturnValueOnce('BB'); // seat 0 (distance 5)

      const showdownPots = [
        { size: 300, eligiblePlayers: [5, 0, 3] }
      ];

      const result = formatWinners(mockTable, showdownPots);

      // Sorted by distance from button: seat 3 (dist 2), seat 5 (dist 4), seat 0 (dist 5)
      expect(result).toBe('*** Showdown ***\n  MP wins 100\n  CO wins 100\n  BB wins 100\n\n');
    });

  });
});
