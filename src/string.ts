import { Table } from 'poker-ts';
import { getPlayerPosition } from './table';
import { PRINT_LABELS } from './constants/label';
import { ROUNDS } from './constants/rounds';
import { POS } from './constants/pos';
import { Card, ActionResult } from './types';
import { CHIP_SYMBOLS } from './constants/chip';

function formatForcedBet(table: InstanceType<typeof Table>) : string {
    const { ante, smallBlind, bigBlind } = table.forcedBets();
    const numSeats = table.numSeats();
    return `${smallBlind}/${bigBlind} (ante: ${ante}) - ${numSeats} seats\n\n`
}

function formatPlayerStacks(table: InstanceType<typeof Table>) : string {

    let output = `${PRINT_LABELS.STACKS}\n`;
    for (let i = 0; i < table.numSeats(); i++) {
        const seat = table.seats()[i];
        if (seat === null) {
            output += `Seat ${i+1}: empty\n`;
        } else {
            output += `Seat ${i+1}: ${seat.totalChips}\n`;
        }
    }
    output += '\n';
    return output;
}

function formatPlayerPositions(table: InstanceType<typeof Table>) : string {
    let output = `${PRINT_LABELS.POSITIONS}\n`;
    for (let i = 0; i < table.numSeats(); i++) {
        const seat = table.seats()[i];
        output += `${PRINT_LABELS.SEAT} ${i+1}: ${getPlayerPosition(table, i)}\n`;
    }
    return output + '\n';
}

function formatPlayerActions(table: InstanceType<typeof Table>, actionResults: ActionResult[]) : string {
    let output = '';
    
    // Use round information from the first action result (captured before actions were taken)
    if(actionResults.length > 0 && actionResults[0].roundOfBetting === ROUNDS.PREFLOP) {
        const { ante, smallBlind, bigBlind } = actionResults[0].forcedBets || table.forcedBets();
        output += `${PRINT_LABELS.PREFLOP}\n`;
        output += `  All players post ante ${ante}\n`;
        output += `  ${POS.smallBlind} posts small blind ${smallBlind}\n`;
        output += `  ${POS.bigBlind} posts big blind ${bigBlind}\n`;
    }

    actionResults.forEach((result) => {
        const { playerPos, actionType, amount } = result;
        
        if (actionType === 'raise') {
            output += `  ${playerPos} raises to ${amount}\n`;
        } else if (actionType === 'bet') {
            output += `  ${playerPos} bets ${amount}\n`;
        } else if (actionType === 'fold') {
            output += `  ${playerPos} folds\n`;
        } else if (actionType === 'check') {
            output += `  ${playerPos} checks\n`;
        } else if (actionType === 'call') {
            output += `  ${playerPos} calls\n`;
        }
    });

    return output;
}

function formatCard(card: Card | null): string {
    if (card === null) {
        return CHIP_SYMBOLS.NO_REVEAL;
    }
    const suitMap: Record<Card['suit'], string> = {
        'spades': 's',
        'hearts': 'h', 
        'diamonds': 'd',
        'clubs': 'c'
    };
    return card.rank + suitMap[card.suit];
}

function formatCommunityCards(table: InstanceType<typeof Table>, cards: (Card | null)[]) : string {
    if(table.roundOfBetting() === ROUNDS.FLOP) {
        return `${PRINT_LABELS.FLOP} ${cards.map(formatCard).join(' ')}\n`;
    }
    if(table.roundOfBetting() === ROUNDS.TURN) {
        return `${PRINT_LABELS.TURN} ${cards.map(formatCard).join(' ')}\n`;
    }
    if(table.roundOfBetting() === ROUNDS.RIVER) {
        return `${PRINT_LABELS.RIVER} ${cards.map(formatCard).join(' ')}\n`;
    }
    return '';
}

function formatPlayerToAct(table: InstanceType<typeof Table>, cards: (Card | null)[]) : string {
    const playerPos = getPlayerPosition(table, table.playerToAct());
    return `\n${playerPos} is next to act with ${cards.map(formatCard).join(' ')}\n`;
}

function formatPlayerHoleCards(table: InstanceType<typeof Table>, playerHoleCards: { [seatIndex: number]: (Card | null)[] }) : string {
    
    let output = '';
    
    // Print showdown header
    output += `${PRINT_LABELS.SHOWDOWN}\n`;
    
    // Show each player's hole cards
    for (let seatIndex = 0; seatIndex < table.numSeats(); seatIndex++) {
        if (playerHoleCards[seatIndex]) {
            const playerPos = getPlayerPosition(table, seatIndex);
            const holeCards = playerHoleCards[seatIndex];
            // Check if all cards are null (player didn't reveal)
            if (holeCards.every(card => card === null)) {
                output += `  ${playerPos} chucked\n`;
            } else {
                output += `  ${playerPos} shows ${holeCards.map(formatCard).join(' ')}\n`;
            }
        }
    }
    
    return output;
}

function formatWinners(table: InstanceType<typeof Table>, showdownPots: { size: number, eligiblePlayers: number[] }[]) : string {
    let output = `${PRINT_LABELS.SHOWDOWN}\n`;
    
    const winners = table.winners();
    
    if (!winners || winners.length === 0) {
        // No winners determined by table, use first eligible player from first pot
        if (showdownPots.length > 0 && showdownPots[0].eligiblePlayers.length > 0) {
            const winnerPlayerIndex = showdownPots[0].eligiblePlayers[0];
            const winnerPlayer = getPlayerPosition(table, winnerPlayerIndex);
            output += `  ${winnerPlayer} wins ${showdownPots[0].size}\n`;
        }
    } else {
        // Distribute pots to winners
        for (let i = 0; i < showdownPots.length; i++) {
            const showdownPotAmount = showdownPots[i].size;
            const potWinners = showdownPots[i].eligiblePlayers;
            
            // Calculate base distribution per winner
            const baseAmount = Math.floor(showdownPotAmount / potWinners.length);
            const oddChips = showdownPotAmount % potWinners.length;
            
            // Sort winners by position relative to dealer button for odd chip distribution
            const buttonSeat = table.button();
            const sortedWinners = [...potWinners].sort((a, b) => {
                const aDistance = (a - buttonSeat + table.numSeats()) % table.numSeats();
                const bDistance = (b - buttonSeat + table.numSeats()) % table.numSeats();
                return aDistance - bDistance;
            });
            
            // Distribute chips
            for (let j = 0; j < sortedWinners.length; j++) {
                const winnerSeatIndex = sortedWinners[j];
                const winnerPlayer = getPlayerPosition(table, winnerSeatIndex);
                
                // First 'oddChips' players get an extra chip
                const distribution = baseAmount + (j < oddChips ? 1 : 0);
                
                if (distribution > 0) {
                    output += `  ${winnerPlayer} wins ${distribution}\n`;
                }
            }
        }
    }
    
    return output += '\n';
}

export { formatForcedBet, formatPlayerStacks, formatPlayerPositions, formatPlayerActions, formatCard, formatCommunityCards, formatPlayerHoleCards, formatWinners, formatPlayerToAct };