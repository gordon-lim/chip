/**
 * Table positions used in poker games
 * Defines standard seat position abbreviations for different table configurations
 */
export const enum POS {
    bigBlind = 'BB',
    underTheGun = 'UTG',
    underTheGunPlusOne = 'UTG+1',
    middlePosition = 'MP',
    lojack = 'LJ',
    hijack = 'HJ',
    cutOff = 'CO',
    button = 'BTN',
    smallBlind = 'SB',
    buttonSmallBlind = 'BTN/SB', // heads-up position
}
