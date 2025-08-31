import { Table } from 'poker-ts';
import { Card, ActionResult } from './types';
import { POS } from './constants/pos';
import { Action } from './types';

function updateStacks(table: InstanceType<typeof Table>, stacks: number[]) {
    const tablePlayers = table.seats();
    tablePlayers.forEach((player, index) => {
        if(stacks[index] == -1) {
            return;
        }
        if(player !== null) {
            table.standUp(index);
        }
        if(stacks[index] > 0) {
            table.sitDown(index, stacks[index]);
        }
    });
}

function takeActions(table: InstanceType<typeof Table>, actions: (string | number)[]): ActionResult[] {
    const results: ActionResult[] = [];
    
    // Capture round information before taking any actions
    const initialRoundOfBetting = table.roundOfBetting();
    const initialForcedBets = table.forcedBets();
    
    actions.forEach((action) => {
        const seatIndex = table.playerToAct();
        const playerPos = getPlayerPosition(table, seatIndex);
        const player = table.seats()[seatIndex];
        
        let actionType: ActionResult['actionType'];
        let amount: number | undefined;
        
        if (typeof action === 'number') {
            if (table.legalActions().actions.includes('raise')) {
                table.actionTaken('raise', action);
                actionType = 'raise';
                amount = action;
            } else {
                table.actionTaken('bet', action);
                actionType = 'bet';
                amount = action;
            }
        } else if (action === 'f') {
            table.actionTaken('fold');
            actionType = 'fold';
        } else if (action === 'x') {
            table.actionTaken('check');
            actionType = 'check';
        } else if (action === 'c') {
            table.actionTaken('call');
            actionType = 'call';
        } else {
            throw new Error(`Unknown action: ${action}`);
        }
        
        results.push({ 
            seatIndex, 
            playerPos, 
            actionType, 
            amount,
            roundOfBetting: initialRoundOfBetting,
            forcedBets: initialForcedBets
        });
    });
    
    
    return results;
}


/**
 * Distributes hole cards to players at the table.
 * 
 * For every 2 cards in the array, assigns them to the next player to act.
 * This function assumes betting rounds are completed and we're dealing hole cards.
 * 
 * @param table - The poker table instance
 * @param cards - Array of cards to distribute (should be in pairs)
 * @param playerHoleCards - Existing hole cards mapping to update
 * @returns Updated playerHoleCards mapping
 */
function revealHoleCards(
    table: InstanceType<typeof Table>, 
    cards: (Card | null)[], 
): { [seatIndex: number]: Card[] } {
    const playerHoleCards: { [seatIndex: number]: Card[] } = {};
    
    const handPlayers = table.handPlayers();
    for(let i = 0; i < handPlayers.length; i++) {
        if(handPlayers[i] !== null) {
            const card1 = cards[i*2];
            const card2 = cards[i*2 + 1];
            if (card1 && card2) {
                playerHoleCards[i] = [...(playerHoleCards[i] || []), card1, card2];
            }
        }
    }
    
    return playerHoleCards;
}

function getPlayerPosition(table: InstanceType<typeof Table>, seatIndex: number) {
    const positionMap = {
        9: [POS.button, POS.smallBlind, POS.bigBlind, POS.underTheGun, POS.underTheGunPlusOne, POS.middlePosition, POS.lojack, POS.hijack, POS.cutOff],
        6: [POS.button, POS.smallBlind, POS.bigBlind, POS.underTheGun, POS.hijack, POS.cutOff],
        5: [POS.button, POS.smallBlind, POS.bigBlind, POS.underTheGun, POS.cutOff], // 5-max
        4: [POS.button, POS.smallBlind, POS.bigBlind, POS.underTheGun], // 4-max
        3: [POS.button, POS.smallBlind, POS.bigBlind], // short-handed
        2: [POS.buttonSmallBlind, POS.bigBlind],   // heads-up (BTN is also SB)
        };

    const buttonSeat = table.button();
    const initialHandPlayers = table.initialHandPlayers();
    const numInitialHandPlayers = initialHandPlayers.filter((player: any) => player !== null).length;
    
    // If seat is empty return "empty"
    if(initialHandPlayers[seatIndex] === null) {
        return "empty";
    }

    // Calculate handPlayerIndex by counting non-null players before seatIndex
    let handPlayerIndex = 0;
    for (let i = 0; i < seatIndex + 1; i++) {
        if (initialHandPlayers[i] !== null) {
            handPlayerIndex++;
        }
    }

    let buttonPlayerIndex = 0;
    for (let i = 0; i < buttonSeat + 1; i++) {
        if (initialHandPlayers[i] !== null) {
            buttonPlayerIndex++;
        }
    }
    
    const order = positionMap[numInitialHandPlayers as keyof typeof positionMap];
    
    // Handle case where numInitialHandPlayers doesn't match any predefined map
    if (!order) {
        throw new Error(`Unsupported number of hand players: ${numInitialHandPlayers}. Supported: ${Object.keys(positionMap).join(', ')}`);
    }
  
    // Find relative position of seat to button
    const offset = (handPlayerIndex - buttonPlayerIndex + numInitialHandPlayers) % numInitialHandPlayers;
  
    return order[offset];
}

export { updateStacks, takeActions, revealHoleCards, getPlayerPosition };