// utils.ts
import { CHIP_SYMBOLS } from './constants/chip';
  
// Match stacks (numbers or '-' placeholders)
export function isStacksLine(line: string) {
    return line
      .trim()
      .split(/\s+/)
      .every(token => new RegExp(`^${CHIP_SYMBOLS.SAME}$`, 'i').test(token) || /^[\d.]+[km]?$/i.test(token));
}
  
// Match actions (f, x, c, numbers, etc.)
export function isActionsLine(line: string) {
return line
    .trim()
    .split(/\s+/)
    .every(token => new RegExp(`^(${CHIP_SYMBOLS.FOLD}|${CHIP_SYMBOLS.CHECK}|${CHIP_SYMBOLS.CALL}|(\\s*\\d+)?|\\d+(\\.\\d+)?[km]?)$`, 'i').test(token));
}

// Match cards (flop/turn/river lines)
export function isCardsLine(line: string) {
return line
    .trim()
    .split(/\s+/)
    .every(token => /^[2-9TJQKA][shdc]$/i.test(token) || new RegExp(`^${CHIP_SYMBOLS.NO_REVEAL}$`, 'i').test(token));
}
  
// Match comments
export function isNoiseLine(line: string) {
return /^(#|\/\/|Note:)/.test(line.trim());
}
  