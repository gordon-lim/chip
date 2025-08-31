import { describe, it, expect, beforeEach } from 'vitest';
import { Table } from 'chip-poker-ts';
import { updateStacks, takeActions, revealHoleCards, getPlayerPosition } from '../src/table';
import { Card } from '../src/types';

describe('updateStacks', () => {

    let table: InstanceType<typeof Table>;

    beforeEach(() => {
        table = new Table({ smallBlind: 50, bigBlind: 100 }, 6);
        updateStacks(table, [100000, 200000, 100000, 100000, 100000, 100000]);
    });
    
    it('should sit down players ', () => {
        const tablePlayers = table.seats();
        expect(tablePlayers[0]?.stack).toEqual(100000);
        expect(tablePlayers[1]?.stack).toEqual(200000);
        expect(tablePlayers[2]?.stack).toEqual(100000);
        expect(tablePlayers[3]?.stack).toEqual(100000);
        expect(tablePlayers[4]?.stack).toEqual(100000);
        expect(tablePlayers[5]?.stack).toEqual(100000);
    });

    it('should not modify players with -1', () => {
        updateStacks(table, [-1, -1, -1, -1, -1, -1]);
        const tablePlayers = table.seats();
        expect(tablePlayers[0]?.stack).toEqual(100000);
        expect(tablePlayers[1]?.stack).toEqual(200000);
        expect(tablePlayers[2]?.stack).toEqual(100000);
        expect(tablePlayers[3]?.stack).toEqual(100000);
        expect(tablePlayers[4]?.stack).toEqual(100000);
        expect(tablePlayers[5]?.stack).toEqual(100000);
    });

    it('should top up players with smaller stack ', () => {
        updateStacks(table, [-1, -1, -1, -1, -1, 200000]);
        const tablePlayers = table.seats();
        expect(tablePlayers[5]?.stack).toEqual(200000);
    });

    it('should standup players with 0', () => {
        updateStacks(table, [100, 0, 100, 0, 100, 0]);
        const tablePlayers = table.seats();
        expect(tablePlayers[0]).not.toBeNull();
        expect(tablePlayers[1]).toBeNull();
        expect(tablePlayers[2]).not.toBeNull();
        expect(tablePlayers[3]).toBeNull();
        expect(tablePlayers[4]).not.toBeNull();
        expect(tablePlayers[5]).toBeNull();
    });
});

describe('takeActions', () => {
    let table: InstanceType<typeof Table>;

    beforeEach(() => {
        table = new Table({ smallBlind: 1, bigBlind: 2 }, 6);
        table.sitDown(0, 100);
        table.sitDown(1, 200);
        table.sitDown(2, 300);
        table.startHand();
    });

    describe('call/check', () => {
        it('should showdown', () => {
            const results = takeActions(table, ['c', 'c', 'x']);
            expect(table.seats()[0]?.stack).toEqual(98);
            expect(table.seats()[1]?.stack).toEqual(198);
            expect(table.seats()[2]?.stack).toEqual(298);
            expect(results).toHaveLength(3);
            expect(results[0].actionType).toEqual('call');
            expect(results[1].actionType).toEqual('call');
            expect(results[2].actionType).toEqual('check');
        });
    });

    describe('bet/raise', () => {
        it('should raise', () => {
            const results = takeActions(table, [4, 6, 'c']);
            expect(table.seats()[0]?.stack).toEqual(96);
            expect(table.seats()[1]?.stack).toEqual(194);
            expect(table.seats()[2]?.stack).toEqual(294);
            expect(results).toHaveLength(3);
            expect(results[0].actionType).toEqual('raise');
            expect(results[0].amount).toEqual(4);
            expect(results[1].actionType).toEqual('raise');
            expect(results[1].amount).toEqual(6);
            expect(results[2].actionType).toEqual('call');
        });
    });

    describe('fold', () => {
        it('should fold', () => {
            const results = takeActions(table, ['f', 'c', 'x']);
            expect(table.handPlayers()[0]).toBeNull();
            expect(table.handPlayers()[1]).not.toBeNull();
            expect(table.handPlayers()[2]).not.toBeNull();
            expect(results).toHaveLength(3);
            expect(results[0].actionType).toEqual('fold');
            expect(results[1].actionType).toEqual('call');
            expect(results[2].actionType).toEqual('check');
        });
    });
    
});

describe('revealHoleCards', () => {
    let table: InstanceType<typeof Table>;

    beforeEach(() => {
        table = new Table({ smallBlind: 1, bigBlind: 2 }, 6);
        table.sitDown(0, 100);
        table.sitDown(2, 200);
        table.sitDown(4, 300);
        table.startHand();
    });

    it('should distribute hole cards to players in order', () => {
        const cards: Card[] = [
            { rank: 'A', suit: 'spades' },
            { rank: 'K', suit: 'hearts' },
            { rank: 'Q', suit: 'diamonds' },
            { rank: 'J', suit: 'clubs' },
            { rank: 'T', suit: 'spades' },
            { rank: '9', suit: 'hearts' }
        ];
        
        const playerHoleCards = revealHoleCards(table, cards);
        
        // Should distribute 2 cards to each player starting from playerToAct
        const firstPlayer = table.playerToAct();
        expect(playerHoleCards[firstPlayer]).toHaveLength(2);
        expect(playerHoleCards[firstPlayer][0]).toEqual({ rank: 'A', suit: 'spades' });
        expect(playerHoleCards[firstPlayer][1]).toEqual({ rank: 'K', suit: 'hearts' });
    });


});

describe('getPlayerPosition', () => {
    let table: InstanceType<typeof Table>;

    describe('all seats filled', () => {
        beforeEach(() => {
            table = new Table({ smallBlind: 1, bigBlind: 2 }, 6);
            table.sitDown(0, 100);
        });

        describe('2 players', () => {   
            it('should return the correct position', () => {
                table.sitDown(1, 200);
                table.startHand();
                expect(getPlayerPosition(table, 0)).toEqual('BTN/SB');
                expect(getPlayerPosition(table, 1)).toEqual('BB');
            });
        });
        
        describe('3 players', () => {
            it('should return the correct position', () => {
                table.sitDown(1, 200);
                table.sitDown(2, 300);
                table.startHand();
                expect(getPlayerPosition(table, 0)).toEqual('BTN');
                expect(getPlayerPosition(table, 1)).toEqual('SB');
                expect(getPlayerPosition(table, 2)).toEqual('BB');
            });
        });

        describe('empty seats', () => {
            it('should return the correct position', () => {
                table.sitDown(2, 200);
                table.sitDown(3, 300);
                table.startHand();
                expect(getPlayerPosition(table, 0)).toEqual('BTN');
                expect(getPlayerPosition(table, 1)).toEqual('empty');
                expect(getPlayerPosition(table, 2)).toEqual('SB');
                expect(getPlayerPosition(table, 3)).toEqual('BB');
            });
        });
    });

    describe('consistent across betting rounds', () => {

        beforeEach(() => {
            table = new Table({ smallBlind: 1, bigBlind: 2 }, 6);
            table.sitDown(0, 100); // BTN
            table.sitDown(1, 200); // SB
            table.sitDown(2, 300); // BB
            table.sitDown(3, 400); // UTG
            table.sitDown(4, 500); // HJ
            table.sitDown(5, 600); // CO
            table.startHand();
            // Preflop
            table.actionTaken('raise', 8); // UTG bets 8
            table.actionTaken('call'); // HJ calls
            table.actionTaken('call'); // CO calls
            table.actionTaken('call'); // BTN calls
            table.actionTaken('fold'); // SB folds
            table.actionTaken('fold'); // BB folds
        });

        it('should keep order after folds', () => {
            expect(getPlayerPosition(table, 0)).toEqual('BTN');
            expect(getPlayerPosition(table, 1)).toEqual('SB');
            expect(getPlayerPosition(table, 2)).toEqual('BB');
            expect(getPlayerPosition(table, 3)).toEqual('UTG');
            expect(getPlayerPosition(table, 4)).toEqual('HJ');
            expect(getPlayerPosition(table, 5)).toEqual('CO');
        });




    });

    describe('one empty seat between two players', () => {

        beforeEach(() => {
            table = new Table({ smallBlind: 1, bigBlind: 2 }, 6);
            table.sitDown(0, 100);
            table.sitDown(1, 200);
            table.sitDown(3, 300);
            table.startHand();
        });

        it('should return the correct position', () => {
            expect(getPlayerPosition(table, 0)).toEqual('BTN');
            expect(getPlayerPosition(table, 1)).toEqual('SB');
            expect(getPlayerPosition(table, 3)).toEqual('BB');
        });
    });




});