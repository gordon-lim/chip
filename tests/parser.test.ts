import { parseChip, parseTableSettings, parsePlayerStacks, parsePlayerActions, parseCards } from '../src/parser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as tableModule from '../src/table';
import * as stringModule from '../src/string';
import * as linesModule from '../src/lines';
import { Table } from 'poker-ts';
import { revealHoleCards } from '../src/table';

// Mock external dependencies
vi.mock('poker-ts', () => ({
  Table: vi.fn().mockImplementation(() => ({
    forcedBets: vi.fn().mockReturnValue({ ante: 100, smallBlind: 200, bigBlind: 400 }),
    numSeats: vi.fn().mockReturnValue(6),
    seats: vi.fn().mockReturnValue([null, null, null, null, null, null]),
    startHand: vi.fn(),
    button: vi.fn().mockReturnValue(3),
    endBettingRound: vi.fn(),
    isBettingRoundInProgress: vi.fn().mockReturnValue(false),
    areBettingRoundsCompleted: vi.fn().mockReturnValue(false),
    pots: vi.fn().mockReturnValue([]),
    manualShowdown: vi.fn(),
    isHandInProgress: vi.fn().mockReturnValue(true),
    roundOfBetting: vi.fn().mockReturnValue(0),
    initialHandPlayers: vi.fn().mockReturnValue([null, null, null, null, null, null]),
    handPlayers: vi.fn().mockReturnValue([null, null, null, null, null, null]),
    playerToAct: vi.fn().mockReturnValue(0),
    legalActions: vi.fn().mockReturnValue({ actions: ['fold', 'call', 'raise'] }),
    actionTaken: vi.fn(),
    winners: vi.fn().mockReturnValue([]),
    isInMiddleOfBettingRound: vi.fn().mockReturnValue(false),
    isAtStartOfBettingRound: vi.fn().mockReturnValue(true)
  }))
}));

vi.mock('../src/table', () => ({
  updateStacks: vi.fn(),
  takeActions: vi.fn().mockReturnValue([]),
  revealHoleCards: vi.fn().mockReturnValue({}),
  getPlayerPosition: vi.fn().mockReturnValue('UTG'),
}));

vi.mock('../src/string', () => ({
  formatForcedBet: vi.fn().mockReturnValue('200/400 (ante: 100) - 6 seats\n\n'),
  formatPlayerStacks: vi.fn().mockReturnValue(''),
  formatPlayerPositions: vi.fn().mockReturnValue(''),
  formatPlayerActions: vi.fn().mockReturnValue(''),
  formatCommunityCards: vi.fn().mockReturnValue(''),
  formatPlayerHoleCards: vi.fn().mockReturnValue(''),
  formatWinners: vi.fn().mockReturnValue(''),
  formatPlayerToAct: vi.fn().mockReturnValue('')
}));

vi.mock('../src/lines', () => ({
  isCardsLine: vi.fn(),
  isStacksLine: vi.fn(),
  isActionsLine: vi.fn()
}));

const TABLE_SETTINGS = `200 400 100 6 4`;

// ===== UNIT TESTS =====
// These test individual functions in isolation

describe('parseTableSettings - Unit Tests', () => {
  it('parses complete 5-parameter input', () => {
    const input = '200 400 100 6 6';
    const result = parseTableSettings(input);
    expect(result).toEqual([200, 400, 100, 6, 5]);
  });

  it('parses 4-parameter input (no ante)', () => {
    const input = '100 200 9 6';
    const result = parseTableSettings(input);
    expect(result).toEqual([100, 200, 0, 9, 5]);
  });

  it('handles k/m suffixes', () => {
    const input = '1k 2k 500 6 6';
    const result = parseTableSettings(input);
    expect(result).toEqual([1000, 2000, 500, 6, 5]);
  });

  it('returns defaults for invalid input', () => {
    const input = 'invalid input';
    const result = parseTableSettings(input);
    expect(result).toEqual([1, 2, 0, 6, 4]);
  });

  it('returns defaults for empty input', () => {
    const input = '';
    const result = parseTableSettings(input);
    expect(result).toEqual([1, 2, 0, 6, 4]);
  });
});

describe('parsePlayerStacks - Unit Tests', () => {
  it('parses numeric stacks', () => {
    const input = '100 200 300';
    const result = parsePlayerStacks(input);
    expect(result).toEqual([100, 200, 300]);
  });

  it('parses stacks with k/m suffixes', () => {
    const input = '100k 2.5m 500k';
    const result = parsePlayerStacks(input);
    expect(result).toEqual([100000, 2500000, 500000]);
  });

  it('handles no change in stacks with "-"', () => {
    const input = '100k - 200k - 300k';
    const result = parsePlayerStacks(input);
    expect(result).toEqual([100000, -1, 200000, -1, 300000]);
  });

  it('handles empty seats with no stack', () => {
    const input = '100k 200k 0 100k 0 100k';
    const result = parsePlayerStacks(input);
    expect(result).toEqual([100000, 200000, 0, 100000, 0, 100000]);
  });
});

describe('parsePlayerActions - Unit Tests', () => {
  it('parses single character actions', () => {
    const input = 'f x c ai';
    const result = parsePlayerActions(input);
    expect(result).toEqual(['f', 'x', 'c', 'ai']);
  });

  it('parses numeric actions', () => {
    const input = '100 200 300';
    const result = parsePlayerActions(input);
    expect(result).toEqual([100, 200, 300]);
  });

  it('parses numeric actions with suffixes', () => {
    const input = '50k 2.5m 100';
    const result = parsePlayerActions(input);
    expect(result).toEqual([50000, 2500000, 100]);
  });

  it('parses mixed actions', () => {
    const input = 'f x c 50k ai 2.5m 100';
    const result = parsePlayerActions(input);
    expect(result).toEqual(['f', 'x', 'c', 50000, 'ai', 2500000, 100]);
  });
});

describe('parseCards - Unit Tests', () => {
  it('parses cards with spaces', () => {
    const input = 'As Ks Qs Js Ts';
    const result = parseCards(input);
    expect(result).toEqual([
      { rank: 'A', suit: 'spades' },
      { rank: 'K', suit: 'spades' },
      { rank: 'Q', suit: 'spades' },
      { rank: 'J', suit: 'spades' },
      { rank: 'T', suit: 'spades' }
    ]);
  });

  it('parses cards without spaces', () => {
    const input = '6d6c7hAs';
    const result = parseCards(input);
    expect(result).toEqual([
      { rank: '6', suit: 'diamonds' },
      { rank: '6', suit: 'clubs' },
      { rank: '7', suit: 'hearts' },
      { rank: 'A', suit: 'spades' }
    ]);
  });

  it('parses cards with and without spaces', () => {
    const input = '6d6c 7hAs';
    const result = parseCards(input);
    expect(result).toEqual([
      { rank: '6', suit: 'diamonds' },
      { rank: '6', suit: 'clubs' },
      { rank: '7', suit: 'hearts' },
      { rank: 'A', suit: 'spades' }
    ]);
  });

  it('parses mixed suits', () => {
    const input = '6d 6c 7h As';
    const result = parseCards(input);
    expect(result).toEqual([
      { rank: '6', suit: 'diamonds' },
      { rank: '6', suit: 'clubs' },
      { rank: '7', suit: 'hearts' },
      { rank: 'A', suit: 'spades' }
    ]);
  });

  it('handles case insensitivity', () => {
    const input = 'ks qs js ac';
    const result = parseCards(input);
    expect(result).toEqual([
      { rank: 'K', suit: 'spades' },
      { rank: 'Q', suit: 'spades' },
      { rank: 'J', suit: 'spades' },
      { rank: 'A', suit: 'clubs' }
    ]);
  });

  it('handles no reveal', () => {
    const input = 'n qs n';
    const result = parseCards(input);
    expect(result).toEqual([
      null,
      { rank: 'Q', suit: 'spades' },
      null
    ]);
  });

  it('handles empty input', () => {
    const input = '';
    const result = parseCards(input);
    expect(result).toEqual([]);
  });
});

// ===== INTEGRATION TESTS =====
// These test the full parseChip function with mocked dependencies

describe('parseChip - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls parseTableSettings and formatForcedBet for first line', () => {
    const input = '200 400 100 6 4\n100k 200k 100k 100k 100k 100k\n';
    
    parseChip(input);
    
    // Should call formatting functions
    expect(stringModule.formatForcedBet).toHaveBeenCalledTimes(1);
  });

  it('calls parsePlayerStacks and updateStacks for second line', () => {
    const input = '200 400 100 6 4\n100k 200k 100k 100k 100k 100k\n';
    
    parseChip(input);
    
    expect(tableModule.updateStacks).toHaveBeenCalledWith(expect.any(Object), [100000, 200000, 100000, 100000, 100000, 100000]);
    expect(stringModule.formatPlayerStacks).toHaveBeenCalledTimes(1);
  });

  it('processes actions lines correctly', () => {
    // Mock line detection
    vi.mocked(linesModule.isActionsLine).mockReturnValue(true);
    vi.mocked(linesModule.isCardsLine).mockReturnValue(false);
    vi.mocked(linesModule.isStacksLine).mockReturnValue(false);
    
    const input = '200 400 100 6 4\n100k 200k 100k 100k 100k 100k\nc f f c c x\n';
    
    parseChip(input);
    
    expect(tableModule.takeActions).toHaveBeenCalledWith(expect.any(Object), ['c', 'f', 'f', 'c', 'c', 'x']);
    expect(stringModule.formatPlayerActions).toHaveBeenCalledTimes(1);
  });

  it('processes community cards lines correctly', async () => {
    // Mock line detection
    vi.mocked(linesModule.isCardsLine).mockReturnValue(true);
    vi.mocked(linesModule.isActionsLine).mockReturnValue(false);
    vi.mocked(linesModule.isStacksLine).mockReturnValue(false);
    
    // Reset modules and create new mock with specific values for this test
    vi.resetModules();
    vi.doMock('poker-ts', () => ({
      Table: vi.fn().mockImplementation(() => ({
        forcedBets: vi.fn().mockReturnValue({ ante: 100, smallBlind: 200, bigBlind: 400 }),
        numSeats: vi.fn().mockReturnValue(6),
        seats: vi.fn().mockReturnValue([null, null, null, null, null, null]),
        startHand: vi.fn(),
        button: vi.fn().mockReturnValue(3),
        endBettingRound: vi.fn(),
        isBettingRoundInProgress: vi.fn().mockReturnValue(false),
        areBettingRoundsCompleted: vi.fn().mockReturnValue(false),
        pots: vi.fn().mockReturnValue([]),
        manualShowdown: vi.fn(),
        isHandInProgress: vi.fn().mockReturnValue(true),
        roundOfBetting: vi.fn().mockReturnValue(0),
        initialHandPlayers: vi.fn().mockReturnValue([null, null, null, null, null, null]),
        handPlayers: vi.fn().mockReturnValue([null, null, null, null, null, null]),
        playerToAct: vi.fn().mockReturnValue(0),
        legalActions: vi.fn().mockReturnValue({ actions: ['fold', 'call', 'raise'] }),
        actionTaken: vi.fn(),
        winners: vi.fn().mockReturnValue([]),
        isInMiddleOfBettingRound: vi.fn().mockReturnValue(false),
        isAtStartOfBettingRound: vi.fn().mockReturnValue(true)
      }))
    }));
    const { parseChip } = await import('../src/parser');
    
    const input = '200 400 100 6 4\n100k 200k 100k 100k 100k 100k\nah kh qh\njh\nks';
    
    parseChip(input);
    
    expect(stringModule.formatCommunityCards).toHaveBeenCalledTimes(3);
    
    // Check flop call (ah kh qh)
    expect(stringModule.formatCommunityCards).toHaveBeenNthCalledWith(1,
      expect.any(Object),
      [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'hearts' }
      ]
    );
    
    // Check turn call (jh)
    expect(stringModule.formatCommunityCards).toHaveBeenNthCalledWith(2,
      expect.any(Object),
      [
        { rank: 'J', suit: 'hearts' }
      ]
    );
    
    // Check river call (ks)
    expect(stringModule.formatCommunityCards).toHaveBeenNthCalledWith(3,
      expect.any(Object),
      [
        { rank: 'K', suit: 'spades' }
      ]
    );
  });

  it('processes hole cards lines correctly', async () => {
    // Mock line detection
    vi.mocked(linesModule.isCardsLine).mockReturnValue(true);
    vi.mocked(linesModule.isActionsLine).mockReturnValue(false);
    vi.mocked(linesModule.isStacksLine).mockReturnValue(false);

    vi.resetModules();
    vi.doMock('poker-ts', () => ({
      Table: vi.fn().mockImplementation(() => ({
        forcedBets: vi.fn().mockReturnValue({ ante: 100, smallBlind: 200, bigBlind: 400 }),
        numSeats: vi.fn().mockReturnValue(6),
        seats: vi.fn().mockReturnValue([null, null, null, null, null, null]),
        startHand: vi.fn(),
        button: vi.fn().mockReturnValue(3),
        endBettingRound: vi.fn(),
        isBettingRoundInProgress: vi.fn().mockReturnValue(false),
        areBettingRoundsCompleted: vi.fn().mockReturnValue(true),
        pots: vi.fn().mockReturnValue([]),
        manualShowdown: vi.fn(),
        isHandInProgress: vi.fn().mockReturnValue(true),
        roundOfBetting: vi.fn().mockReturnValue(0),
        initialHandPlayers: vi.fn().mockReturnValue([null, null, null, null, null, null]),
        handPlayers: vi.fn().mockReturnValue([null, null, null, null, null, null]),
        playerToAct: vi.fn().mockReturnValue(0),
        legalActions: vi.fn().mockReturnValue({ actions: ['fold', 'call', 'raise'] }),
        actionTaken: vi.fn(),
        winners: vi.fn().mockReturnValue([])
      }))
    }));
    const { parseChip } = await import('../src/parser');

    // Mock revealHoleCards to return expected playerHoleCards
    vi.mocked(tableModule.revealHoleCards).mockReturnValue({
      0: [{ rank: 'A', suit: 'spades' }, { rank: 'K', suit: 'spades' }],
      2: [{ rank: '2', suit: 'clubs' }, { rank: '3', suit: 'clubs' }],
      4: [{ rank: 'T', suit: 'hearts' }, { rank: '8', suit: 'hearts' }]
    });
    
    const input = '200 400 100 6 4\n100k 200k 100k 100k 100k 100k\nasks 2c3c th8h';
    
    parseChip(input);
    
    // Verify revealHoleCards was called with correct parameters
    expect(tableModule.revealHoleCards).toHaveBeenCalledWith(
      expect.any(Object),
      [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'spades' },
        { rank: '2', suit: 'clubs' },
        { rank: '3', suit: 'clubs' },
        { rank: 'T', suit: 'hearts' },
        { rank: '8', suit: 'hearts' }
      ]
    );
    
    // Verify formatPlayerHoleCards was called with table and hole cards
    expect(stringModule.formatPlayerHoleCards).toHaveBeenCalledWith(
      expect.any(Object),
      {
        0: [{ rank: 'A', suit: 'spades' }, { rank: 'K', suit: 'spades' }],
        2: [{ rank: '2', suit: 'clubs' }, { rank: '3', suit: 'clubs' }],
        4: [{ rank: 'T', suit: 'hearts' }, { rank: '8', suit: 'hearts' }]
      }
    );
    
    // Verify formatWinners was called with table and showdown pots
    expect(stringModule.formatWinners).toHaveBeenCalledWith(
      expect.any(Object),
      []
    );
  });

  it('calls formatWinners when only one eligible player remains before showdown', async () => {
    // Mock line detection for actions and then cards
    vi.mocked(linesModule.isActionsLine)
      .mockReturnValueOnce(true) // first action line
      .mockReturnValueOnce(false); // cards line
    vi.mocked(linesModule.isCardsLine)
      .mockReturnValueOnce(false) // first action line
      .mockReturnValueOnce(true); // cards line
    vi.mocked(linesModule.isStacksLine).mockReturnValue(false);

    vi.resetModules();
    vi.doMock('poker-ts', () => ({
      Table: vi.fn().mockImplementation(() => ({
        forcedBets: vi.fn().mockReturnValue({ ante: 100, smallBlind: 200, bigBlind: 400 }),
        numSeats: vi.fn().mockReturnValue(6),
        seats: vi.fn().mockReturnValue([null, null, null, null, null, null]),
        startHand: vi.fn(),
        button: vi.fn().mockReturnValue(4),
        endBettingRound: vi.fn(),
        isBettingRoundInProgress: vi.fn().mockReturnValue(false),
        areBettingRoundsCompleted: vi.fn().mockReturnValue(true), // Betting rounds completed, only one player left
        pots: vi.fn().mockReturnValue([
          { size: 1200, eligiblePlayers: [1] } // Only one eligible player
        ]),
        manualShowdown: vi.fn(),
        showdown: vi.fn(),
        isHandInProgress: vi.fn().mockReturnValue(true),
        roundOfBetting: vi.fn().mockReturnValue(0),
        initialHandPlayers: vi.fn().mockReturnValue([null, null, null, null, null, null]),
        handPlayers: vi.fn().mockReturnValue([null, null, null, null, null, null]),
        playerToAct: vi.fn().mockReturnValue(0),
        legalActions: vi.fn().mockReturnValue({ actions: ['fold', 'call', 'raise'] }),
        actionTaken: vi.fn(),
        winners: vi.fn().mockReturnValue([]) // No winners determined by table yet
      }))
    }));
    const { parseChip } = await import('../src/parser');
    
    // everyone folds except one player, hole cards not revealed
    const input = '200 400 100 6 4\n100k 200k 100k 100k 100k 100k\nf c f f f f';
    
    parseChip(input);
    
    expect(tableModule.takeActions).toHaveBeenCalledWith(expect.any(Object), ['f', 'c', 'f', 'f', 'f', 'f']);
    
    expect(stringModule.formatWinners).toHaveBeenCalledWith(
      expect.any(Object),
      [
        { size: 1200, eligiblePlayers: [1] }
      ]
    );
  });

});