import { parseCards } from '../src/parser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Table } from 'poker-ts';
import { revealHoleCards } from '../src/table';
import assert from 'assert';
import { formatWinners } from '../src/string';

describe("hole cards parsing & showdown", () => {
    it("reveals hole cards and runs manual showdown", () => {
      const table = new Table({ ante: 10, smallBlind: 25, bigBlind: 50 }, 6);
      table.sitDown(0, 12500);
      table.sitDown(1, 25000);
      table.sitDown(2, 10000);
      table.sitDown(3, 25000);
      table.sitDown(4, 25000);
      table.sitDown(5, 25000);
      
      table.startHand(5);
      table.actionTaken('fold', 0);
      table.actionTaken('fold', 0);
      table.actionTaken('raise', 150);
      table.actionTaken('fold', 0);
      table.actionTaken('call', 0);
      table.actionTaken('call', 0);
      table.endBettingRound();
      table.actionTaken('check', 0);
      table.actionTaken('bet', 50);
      table.actionTaken('fold', 0);
      table.actionTaken('call', 0);
      table.endBettingRound();
      table.actionTaken('check', 0);
      table.actionTaken('check', 0);
      table.endBettingRound();
      table.actionTaken('check', 0);
      table.actionTaken('check', 0);
      table.endBettingRound();
      const community = ["2c", "Ad", "6c", "4h", "3c"].map(c => parseCards(c)[0]);
      assert(community.every(card => card !== null), 'Community cards cannot be null');
  
      // test input
      const line = "ac7c 2d2s";
      const cards = parseCards(line);
  
      const playerHoleCards = revealHoleCards(table, cards);
      expect(Object.keys(playerHoleCards).length).toBeGreaterThan(0);
  
      const showdownPots = table.pots();
      table.manualShowdown(community, playerHoleCards); 
      const output = formatWinners(table, showdownPots); 
  
      expect(output).toContain('*** Showdown ***\n  SB wins 610');
    });
  });