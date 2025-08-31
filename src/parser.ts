import { isCardsLine, isStacksLine } from './lines';
import { isActionsLine } from './lines';
import { Table } from 'chip-poker-ts';
import { updateStacks, takeActions, revealHoleCards } from './table';
import { Card } from './types';
import { formatForcedBet, formatPlayerStacks, formatPlayerPositions, formatPlayerActions, formatCommunityCards, formatPlayerHoleCards, formatWinners, formatPlayerToAct } from './string';
import { CHIP_SYMBOLS } from './constants/chip';
import assert from 'assert';


function parseChip(input: string) {

    let output = '';

    const lines = input.split(/\r?\n/).filter(line => line.length > 0);

    const firstLine = lines[0];

    const [smallBlind, bigBlind, ante, numSeats, buttonSeat] = parseTableSettings(firstLine);
    let table = new Table({ ante, smallBlind, bigBlind }, numSeats)
    output += formatForcedBet(table);

    const secondLine = lines[1];
    const playerStacks = parsePlayerStacks(secondLine);
    updateStacks(table, playerStacks);
    output += formatPlayerStacks(table);

    table.startHand(buttonSeat);
    output += formatPlayerPositions(table);

    let communityCards: Card[] = [];
    let playerHoleCards: { [seatIndex: number]: Card[] } = {};

    for (const line of lines.slice(2)) {

      if(!table.isHandInProgress()) {
        if(isStacksLine(line)) {
          const stacks = parsePlayerStacks(line);
          updateStacks(table, stacks);
        }
        output += formatPlayerStacks(table);
        table.startHand();
        output += formatPlayerPositions(table);
      }

      if(isActionsLine(line)) {
        const actions = parsePlayerActions(line);
        const actionResults = takeActions(table, actions);
        output += formatPlayerActions(table, actionResults);
        if(!table.isBettingRoundInProgress()) {
          table.endBettingRound();
          const pots = table.pots();
          if(table.areBettingRoundsCompleted() && pots[0].eligiblePlayers.length === 1) {
            table.showdown();
            output += formatWinners(table, pots); // FIXME: getPlayerPosition calls table.button() after showdown
          }
        }
      }
      else if(isCardsLine(line)) {
        const cards = parseCards(line);
        if(table.areBettingRoundsCompleted()) {
          playerHoleCards = revealHoleCards(table, cards);
          output += formatPlayerHoleCards(table, playerHoleCards);
          const showdownPots = table.pots();
          table.manualShowdown(communityCards, playerHoleCards); 
          output += formatWinners(table, showdownPots); 
        }else if(table.isInMiddleOfBettingRound()) {
          output += formatPlayerToAct(table, cards);
        }else if(table.isAtStartOfBettingRound()){
          assert(cards.every(card => card !== null), 'Cards cannot be null');
          communityCards.push(...cards.filter(card => card !== null));
          output += formatCommunityCards(table, cards);
        }
      }
    }

    return output;
}

/**
 * Parses poker table settings from a formatted input string.
 *
 * The input string is expected to contain:
 * blinds, ante, and number of seats (e.g., `"200 400 100 6"`)
 *
 * Example input:
 * ```)
 * 200 400 100 6
 * ```
 *
 * Example output:
 * ```typescript
 * {
      smallBlind: 200,
      bigBlind: 400,
      ante: 100,
      numSeats: 6,
      buttonSeat: 4
    }
 * ```
 *
 * @param input - A single-line string containing blinds, ante, number of players, and button seat.
 * @returns smallBlind, bigBlind, ante, numSeats, buttonSeat
 */
function parseTableSettings(input: string): [number, number, number, number, number] {
  let smallBlind = 1, bigBlind = 2, ante = 0, numSeats = 6, buttonSeat = 4;
  
  let firstLine = input.split(/\s+/);
  const isAllNumeric = firstLine.every(tok => /^[\d.]+[km]?$/i.test(tok));
  if(isAllNumeric && (firstLine.length === 4 || firstLine.length === 5)) {
    smallBlind = parseNumber(firstLine[0]) || 1;
    bigBlind = parseNumber(firstLine[1]) || 2;
    
    if(firstLine.length === 4) {
      numSeats = parseNumber(firstLine[2]) || 6;
      buttonSeat = parseNumber(firstLine[3]) - 1 || 4;
    } else if(firstLine.length === 5) {
      ante = parseNumber(firstLine[2]) || 0;
      numSeats = parseNumber(firstLine[3]) || 6;
      buttonSeat = parseNumber(firstLine[4]) - 1 || 4;
    }
  }
  
  return [smallBlind, bigBlind, ante, numSeats, buttonSeat];
}

/**
 * Parses poker player stacks from a formatted input string.
 *
 * The input string is expected to contain:
 * - player stacks (e.g., `"100k 200k 100k 100k 100k 100k"`)
 * - or `"-"` for seats with no stack (these are converted to `-1`).
 *
 * Example input:
 * ```
 * 100k 200k - 100k -
 * ```
 *
 * Example output:
 * ```typescript
 * [100000, 200000, -1, 100000, -1]
 * ```
 *
 * @param input - A single-line string containing player stacks, possibly with `"-"`.
 * @returns player stacks indexed by seat number, with `"-"` converted to `-1`
 */
function parsePlayerStacks(input: string): number[] {
  const stacks = input.split(/\s+/).map(token =>
    token === "-" ? -1 : parseNumber(token)
  );
  return stacks;
}


function parsePlayerActions(input: string) {
  return input.split(/\s+/).map(token => {
    // Check if token is a numeric value (potentially with k/m suffix)
    if (/^[\d.]+[km]?$/i.test(token)) {
      return parseNumber(token);
    }
    // Return single character actions (f, x, c, ai) as-is
    return token;
  });
}

function parseCards(input: string): (Card | null)[] {
  const nospaces = input.replace(/\s+/g, '');
  const cards: (Card | null)[] = [];
  
  // Map single-letter suits to full suit names
  const suitMap: Record<string, Card['suit']> = {
    'd': 'diamonds',
    'c': 'clubs', 
    'h': 'hearts',
    's': 'spades'
  };
  
  let i = 0;
  while (i < nospaces.length) {
    // Check if current character is NO_REVEAL symbol (null card)
    if (nospaces[i].toLowerCase() === CHIP_SYMBOLS.NO_REVEAL.toLowerCase()) {
      cards.push(null);
      i += 1; // Skip just the NO_REVEAL character
    } else if (i + 1 < nospaces.length) {
      // Process normal card (rank + suit)
      const rank = nospaces[i].toUpperCase() as Card['rank'];
      const suitLetter = nospaces[i + 1].toLowerCase();
      const suit = suitMap[suitLetter];
      
      if (suit) {
        cards.push({ rank, suit });
      }
      i += 2; // Skip both rank and suit characters
    } else {
      i += 1; // Skip invalid single character
    }
  }
  
  return cards;
}

/**
 * Parses a string representation of a number, supporting common abbreviations used in poker contexts.
 *
 * This function handles numeric strings with optional 'k' (thousand) and 'm' (million) suffixes,
 * commonly used for representing chip stacks, blinds, and bet amounts in poker notation.
 *
 * @param str - The string to parse into a number. Can include 'k' or 'm' suffixes.
 * 
 * @returns The parsed numeric value, or `NaN` if the input cannot be parsed.
 *
 * @example
 * ```typescript
 * parseNumber("100");     // returns 100
 * parseNumber("50k");     // returns 50000
 * parseNumber("2.5m");    // returns 2500000
 * parseNumber("1.5K");    // returns 1500 (case insensitive)
 * parseNumber("");        // returns NaN
 * parseNumber("abc");     // returns NaN
 * parseNumber(42);        // returns 42 (handles numeric input)
 * ```
 *
 * @remarks
 * - The function is case-insensitive for suffixes ('k', 'K', 'm', 'M' all work)
 * - Leading/trailing whitespace is automatically trimmed
 * - If a numeric value is passed instead of a string, it's returned as-is
 * - Invalid or empty strings return `NaN`
 * - Supports decimal values with suffixes (e.g., "1.5k" = 1500)
 */
function parseNumber(str: string) {
  if (typeof str === 'number') return str;
  if (!str || typeof str !== 'string') return NaN;
  
  const trimmed = str.trim().toLowerCase();
  
  // Handle k/m abbreviations
  if (trimmed.endsWith('k')) {
    const num = parseFloat(trimmed.slice(0, -1));
    return isNaN(num) ? NaN : num * 1000;
  }
  
  if (trimmed.endsWith('m')) {
    const num = parseFloat(trimmed.slice(0, -1));
    return isNaN(num) ? NaN : num * 1000000;
  }
  
  // Regular number parsing
  return parseFloat(trimmed);
}

export { parseChip, parseTableSettings, parsePlayerStacks, parsePlayerActions, parseCards };