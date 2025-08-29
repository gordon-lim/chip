// utils.ts
import { CHIP_SYMBOLS } from './constants/chip';
  
// Match stacks (numbers or '-' placeholders)
export function isStacksLine(line: string) {
    return line
      .trim()
      .split(/\s+/)
      .every(token => new RegExp(`^${CHIP_SYMBOLS.SAME}$`, 'i').test(token) || /^\d+(\.\d+)?[km]?$/i.test(token));
}
  
// Match actions (f, x, c, numbers, etc.)
export function isActionsLine(line: string) {
  const trimmed = line.trim();
  if (trimmed === '') return false;
  
  return trimmed
    .split(/\s+/)
    .every(token => new RegExp(`^(${CHIP_SYMBOLS.FOLD}|${CHIP_SYMBOLS.CHECK}|${CHIP_SYMBOLS.CALL}|\\d+(\\.\\d+)?[km]?)$`, 'i').test(token));
}

// Match cards (flop/turn/river lines)
export function isCardsLine(line: string) {
  const trimmed = line.trim();
  if (trimmed === '') return false;
  
  // Helper function to parse a token that might be concatenated cards
  const parseToken = (token: string): boolean => {
    // First check if it's a single card or no-reveal token
    if (/^[2-9TJQKA][shdc]$/i.test(token) || new RegExp(`^${CHIP_SYMBOLS.NO_REVEAL}$`, 'i').test(token)) {
      return true;
    }
    
    // Try to parse as concatenated cards
    let i = 0;
    while (i < token.length) {
      // Check for no-reveal token first (single character)
      if (token[i].toLowerCase() === 'n') {
        i++;
        continue;
      }
      
      // Check for card (2 characters: rank + suit)
      if (i + 1 < token.length && /^[2-9TJQKA][shdc]$/i.test(token.slice(i, i + 2))) {
        i += 2;
        continue;
      }
      
      // If we get here, the token is invalid
      return false;
    }
    
    return true;
  };
  
  // Split by whitespace and check each token
  const tokens = trimmed.split(/\s+/);
  return tokens.every(parseToken);
}
  
// Match comments
export function isNoiseLine(line: string) {
return /^(#|\/\/|Note:)/.test(line.trim());
}
  