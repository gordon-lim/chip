import { describe, it, expect } from 'vitest';
import { isStacksLine, isActionsLine, isCardsLine, isNoiseLine } from '../src/lines';

describe('lines utilities', () => {
  describe('isStacksLine', () => {
    it('should return true for valid stack amounts', () => {
      expect(isStacksLine('1000 2000 1500')).toBe(true);
      expect(isStacksLine('100.5 200.25 300.75')).toBe(true);
      expect(isStacksLine('1k 2k 1.5k')).toBe(true);
      expect(isStacksLine('1K 2K 1.5K')).toBe(true);
      expect(isStacksLine('1m 2m 1.5m')).toBe(true);
      expect(isStacksLine('1M 2M 1.5M')).toBe(true);
    });

    it('should return true for lines with dash placeholders', () => {
      expect(isStacksLine('1000 - 1500')).toBe(true);
      expect(isStacksLine('- - -')).toBe(true);
      expect(isStacksLine('1k - 2k')).toBe(true);
    });

    it('should return true for mixed valid tokens', () => {
      expect(isStacksLine('1000 - 1.5k 2M')).toBe(true);
      expect(isStacksLine('100.5 - 200k 1m')).toBe(true);
    });

    it('should handle extra whitespace', () => {
      expect(isStacksLine('  1000   2000   1500  ')).toBe(true);
      expect(isStacksLine('\t1000\t-\t1500\t')).toBe(true);
    });

    it('should return false for invalid stack formats', () => {
      expect(isStacksLine('abc def ghi')).toBe(false);
      expect(isStacksLine('1000 abc 1500')).toBe(false);
      expect(isStacksLine('1000x 2000y')).toBe(false);
      expect(isStacksLine('1000km 2000')).toBe(false);
      expect(isStacksLine('1..5 2000')).toBe(false);
    });

    it('should return false for empty or whitespace-only lines', () => {
      expect(isStacksLine('')).toBe(false);
      expect(isStacksLine('   ')).toBe(false);
      expect(isStacksLine('\t\n')).toBe(false);
    });

    it('should return true for single valid token', () => {
      expect(isStacksLine('1000')).toBe(true);
      expect(isStacksLine('-')).toBe(true);
      expect(isStacksLine('1.5k')).toBe(true);
    });
  });

  describe('isActionsLine', () => {
    it('should return true for fold actions', () => {
      expect(isActionsLine('f f f')).toBe(true);
      expect(isActionsLine('F F F')).toBe(true);
    });

    it('should return true for check actions', () => {
      expect(isActionsLine('x x x')).toBe(true);
      expect(isActionsLine('X X X')).toBe(true);
    });

    it('should return true for call actions', () => {
      expect(isActionsLine('c c c')).toBe(true);
      expect(isActionsLine('C C C')).toBe(true);
    });

    it('should return true for bet/raise amounts', () => {
      expect(isActionsLine('100 200 300')).toBe(true);
      expect(isActionsLine('100.5 200.25')).toBe(true);
      expect(isActionsLine('1k 2k 1.5k')).toBe(true);
      expect(isActionsLine('1K 2K 1.5K')).toBe(true);
      expect(isActionsLine('1m 2m 1.5m')).toBe(true);
      expect(isActionsLine('1M 2M 1.5M')).toBe(true);
    });

    it('should return true for mixed valid actions', () => {
      expect(isActionsLine('f x c')).toBe(true);
      expect(isActionsLine('F X C')).toBe(true);
      expect(isActionsLine('f 100 x')).toBe(true);
      expect(isActionsLine('c 200 f')).toBe(true);
      expect(isActionsLine('f x 1k')).toBe(true);
      expect(isActionsLine('100 c f')).toBe(true);
    });

    it('should handle extra whitespace', () => {
      expect(isActionsLine('  f   x   c  ')).toBe(true);
      expect(isActionsLine('\tf\tx\tc\t')).toBe(true);
      expect(isActionsLine('  100   200   300  ')).toBe(true);
    });

    it('should return false for invalid action formats', () => {
      expect(isActionsLine('a b c')).toBe(false);
      expect(isActionsLine('fold check call')).toBe(false);
      expect(isActionsLine('f x y')).toBe(false);
      expect(isActionsLine('100x 200y')).toBe(false);
      expect(isActionsLine('1..5 200')).toBe(false);
    });

    it('should return false for empty or whitespace-only lines', () => {
      expect(isActionsLine('')).toBe(false);
      expect(isActionsLine('   ')).toBe(false);
      expect(isActionsLine('\t\n')).toBe(false);
    });

    it('should return true for single valid action', () => {
      expect(isActionsLine('f')).toBe(true);
      expect(isActionsLine('x')).toBe(true);
      expect(isActionsLine('c')).toBe(true);
      expect(isActionsLine('100')).toBe(true);
      expect(isActionsLine('1.5k')).toBe(true);
    });
  });

  describe('isCardsLine', () => {
    it('should return true for valid card formats', () => {
      expect(isCardsLine('2h 3s 4d')).toBe(true);
      expect(isCardsLine('2H 3S 4D')).toBe(true);
      expect(isCardsLine('Ah Kd Qc')).toBe(true);
      expect(isCardsLine('AH KD QC')).toBe(true);
      expect(isCardsLine('Ts Jh Qd')).toBe(true);
      expect(isCardsLine('TS JH QD')).toBe(true);
    });

    it('should return true for all ranks', () => {
      expect(isCardsLine('2h 3s 4d 5c 6h 7s 8d 9c Th Jh Qd Kc Ah')).toBe(true);
    });

    it('should return true for all suits', () => {
      expect(isCardsLine('As Ah Ad Ac')).toBe(true);
      expect(isCardsLine('AS AH AD AC')).toBe(true);
    });

    it('should return true for no-reveal tokens', () => {
      expect(isCardsLine('n n n')).toBe(true);
      expect(isCardsLine('N N N')).toBe(true);
      expect(isCardsLine('Ah n Kd')).toBe(true);
      expect(isCardsLine('AH N KD')).toBe(true);
    });

    it('should handle no whitespace between cards', () => {
      expect(isCardsLine('2h3s4c5h')).toBe(true);
      expect(isCardsLine('2H3S4D5H')).toBe(true);
      expect(isCardsLine('ahkd Qc5h')).toBe(true);
      expect(isCardsLine('ahkd qc5h')).toBe(true);
    });

    it('should handle extra whitespace', () => {
      expect(isCardsLine('  Ah   Kd   Qc  ')).toBe(true);
      expect(isCardsLine('\tAh\tKd\tQc\t')).toBe(true);
    });

    it('should return false for invalid card formats', () => {
      expect(isCardsLine('1h 2s 3d')).toBe(false); // Invalid rank
      expect(isCardsLine('Ah Kx Qc')).toBe(false); // Invalid suit
      expect(isCardsLine('A K Q')).toBe(false); // Missing suit
      expect(isCardsLine('Ahh Kdd')).toBe(false); // Too many characters
      expect(isCardsLine('abc def')).toBe(false); // Invalid format
      expect(isCardsLine('Ah Kd m')).toBe(false); // Invalid token (not n)
    });

    it('should return false for empty or whitespace-only lines', () => {
      expect(isCardsLine('')).toBe(false);
      expect(isCardsLine('   ')).toBe(false);
      expect(isCardsLine('\t\n')).toBe(false);
    });

    it('should return true for single valid card or no-reveal', () => {
      expect(isCardsLine('Ah')).toBe(true);
      expect(isCardsLine('n')).toBe(true);
      expect(isCardsLine('N')).toBe(true);
    });

    it('should return true for typical poker scenarios', () => {
      // Flop
      expect(isCardsLine('Ah Kd Qc')).toBe(true);
      // Turn
      expect(isCardsLine('Ah Kd Qc Js')).toBe(true);
      // River
      expect(isCardsLine('Ah Kd Qc Js Th')).toBe(true);
      // With some hidden cards
      expect(isCardsLine('Ah n n')).toBe(true);
      expect(isCardsLine('n n n n n')).toBe(true);
    });
  });

  describe('isNoiseLine', () => {
    it('should return true for hash comments', () => {
      expect(isNoiseLine('# This is a comment')).toBe(true);
      expect(isNoiseLine('#This is a comment')).toBe(true);
      expect(isNoiseLine('  # This is a comment  ')).toBe(true);
    });

    it('should return true for double slash comments', () => {
      expect(isNoiseLine('// This is a comment')).toBe(true);
      expect(isNoiseLine('//This is a comment')).toBe(true);
      expect(isNoiseLine('  // This is a comment  ')).toBe(true);
    });

    it('should return true for Note comments', () => {
      expect(isNoiseLine('Note: This is a note')).toBe(true);
      expect(isNoiseLine('Note:This is a note')).toBe(true);
      expect(isNoiseLine('  Note: This is a note  ')).toBe(true);
    });

    it('should return true for empty comments', () => {
      expect(isNoiseLine('#')).toBe(true);
      expect(isNoiseLine('//')).toBe(true);
      expect(isNoiseLine('Note:')).toBe(true);
    });

    it('should handle whitespace at beginning of line', () => {
      expect(isNoiseLine('   # Comment')).toBe(true);
      expect(isNoiseLine('\t// Comment')).toBe(true);
      expect(isNoiseLine('  Note: Comment')).toBe(true);
    });

    it('should return false for non-comment lines', () => {
      expect(isNoiseLine('This is not a comment')).toBe(false);
      expect(isNoiseLine('1000 2000 1500')).toBe(false);
      expect(isNoiseLine('f x c')).toBe(false);
      expect(isNoiseLine('Ah Kd Qc')).toBe(false);
      expect(isNoiseLine('Some text # with hash in middle')).toBe(false);
      expect(isNoiseLine('Some text // with slashes in middle')).toBe(false);
      expect(isNoiseLine('Some Note: in middle')).toBe(false);
    });

    it('should return false for empty or whitespace-only lines', () => {
      expect(isNoiseLine('')).toBe(false);
      expect(isNoiseLine('   ')).toBe(false);
      expect(isNoiseLine('\t\n')).toBe(false);
    });

    it('should be case sensitive for hash and slashes but work with Note', () => {
      expect(isNoiseLine('# comment')).toBe(true);
      expect(isNoiseLine('// comment')).toBe(true);
      expect(isNoiseLine('Note: comment')).toBe(true);
      // These should still work as they match the regex pattern
      expect(isNoiseLine('note: comment')).toBe(false); // lowercase 'note' won't match
    });
  });

  describe('edge cases and integration', () => {
    it('should handle lines that could match multiple patterns', () => {
      // A line like 'f' could be an action but not a stack or card
      expect(isStacksLine('f')).toBe(false);
      expect(isActionsLine('f')).toBe(true);
      expect(isCardsLine('f')).toBe(false);
      expect(isNoiseLine('f')).toBe(false);
    });

    it('should handle numeric strings consistently', () => {
      const numericLine = '100 200 300';
      expect(isStacksLine(numericLine)).toBe(true);
      expect(isActionsLine(numericLine)).toBe(true);
      expect(isCardsLine(numericLine)).toBe(false);
      expect(isNoiseLine(numericLine)).toBe(false);
    });

    it('should handle dash character consistently', () => {
      const dashLine = '- - -';
      expect(isStacksLine(dashLine)).toBe(true);
      expect(isActionsLine(dashLine)).toBe(false);
      expect(isCardsLine(dashLine)).toBe(false);
      expect(isNoiseLine(dashLine)).toBe(false);
    });

    it('should handle n character consistently', () => {
      const nLine = 'n n n';
      expect(isStacksLine(nLine)).toBe(false);
      expect(isActionsLine(nLine)).toBe(false);
      expect(isCardsLine(nLine)).toBe(true);
      expect(isNoiseLine(nLine)).toBe(false);
    });
  });
});
