# Compressed Hand In-order Protocol (CHIP)

**CHIP** is a compact poker notation designed for efficient real-time hand logging with minimal keystrokes. It also outputs hand histories in a format ready for LLM-based analysis and AI-driven recommendations.  

## 📑 Table of Contents
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [CHIP Notation Reference](#-chip-notation-reference)
- [Examples](#-examples)
  - [Example 1 — In-Progress Hand](#example-1--in-progress-hand)
    - [Using CHIP with LLMs](#-using-chip-with-llms)
  - [Example 2 — Hand to Showdown](#example-2--hand-to-showdown)
  - [Example 3 — Transition to Next Hand](#example-3--transition-to-next-hand)
- [Acknowledgment](#-acknowledgment)
- [License](#-license)

## ✨ Key Features

1. **CHIP Notation** — a concise format for recording poker hands.  
2. **Parser (`parseChip`)** — expands CHIP notation into a complete hand history, ready for analysis or LLM input.  

## 🚀 Quick Start

```bash
npm install chip-parser
```

```ts
import { parseChip } from "chip-parser";

const input = `25 50 10 6 5
12.5k 25k 10k 25k 25k 15k
f f 150 f c c
2c ad 6c
x 50 f
th tc`;

console.log(parseChip(input));
```

If you clone the repository directly, you can also experiment quickly by editing `testInput` in `demo.ts` and run it with:

```bash
npx tsx demo.ts
```

## 📖 CHIP Notation Reference

- **Header:**  
  ```
  <sb> <bb> [<ante>] <nPlayers> <buttonSeat>
  ```
  Examples:  
  - `1 2 6 0`  
  - `1 2 0.25 6 0` (with ante)  

  *Note: `buttonSeat` is 1-indexed.*

- **Stacks:**  
  One line, listed in seat order (arbitrary, but must be consistent).  
  Example: `100 200 150 250 100 180`

- **Numbers:**  
  Supports `k` (thousands) and `m` (millions).  
  Example: `200k`, `1.5m`

- **Actions:** 

  | Symbol | Meaning               |
  |--------|-----------------------|
  | `f`    | Fold                  |
  | `x`    | Check                 |
  | `c`    | Call                  |
  | `N`    | Bet/Raise to amount N |
  | `_`    | No stack change       |

- **Cards:**  
  - Flop: 3 cards → `7h 8s Td`  
  - Turn/River: one card per line  

- **Multi-Hand Support:**  
  Player stacks persist unless explicitly set (e.g., top-ups or players leaving the table).

- **Showdown:**  
  - Provide hole cards if multiple players remain: `ad5h 9h9c`.
  - Winners are auto-determined by underlying game engine.  

## 📝 Examples

Each example builds on the previous one. Only **new parts** are shown to avoid repetition.

### Example 1 — In-Progress Hand

**Input**
```txt
25 50 10 6 6
12.5k 25k 10k 25k 25k 15k
f f 150 f c c
2c ad 6c
x 50 f
th tc
```

**Output**
```txt
25/50 (ante: 10) - 6 seats

Stacks:
Seat 1: 12500
Seat 2: 25000
Seat 3: 10000
Seat 4: 25000
Seat 5: 25000
Seat 6: 15000

Positions:
Seat 1: SB
Seat 2: BB
Seat 3: UTG
Seat 4: HJ
Seat 5: CO
Seat 6: BTN

*** Preflop ***
  All players post ante 10
  SB posts small blind 25
  BB posts big blind 50
  UTG folds
  HJ folds
  CO raises to 150
  BTN folds
  SB calls
  BB calls

*** Flop *** 2c Ad 6c
  SB checks
  BB bets 50
  CO folds

SB is next to act with Th Tc
```

👉 The hand is unfinished, so the last line is interpreted as **hole cards for the next player to act**. This enables querying an LLM for recommendations.

### 🤖 Using CHIP with LLMs

To leverage CHIP with LLMs, prepend a system prompt such as:

```
You are a poker assistant. You will provide a recommended action for the player to act given the hand history up to this point. Do not describe the hand history. Only provide the recommended action and a brief description.
```

Then feeding parsed input into an LLM yields actionable recommendations, for example:

```
Call — You should just call the small bet. Your pocket tens are an overpair to the board...
```

### Example 2 — Hand to Showdown

**Input**
```txt
... (same as Example 1, without "th tc")
x 50 f c
4h
x x
3c
x x
ac7c 2d2s
```

**Output (excerpt)**
```txt
*** Flop *** 2c Ad 6c
  SB checks
  BB bets 50
  CO folds
  SB calls

*** Turn *** 4h
  SB checks
  BB checks

*** River *** 3c
  SB checks
  BB checks

*** Showdown ***
  SB shows Ac 7c
  BB shows 2d 2s
  SB wins 610
```

👉 When the hand runs to showdown, you need to provide the hole cards of the remaining players so that the parser can automatically determine the winner.

### Example 3 — Transition to Next Hand

**Input**
```txt
... (continuing from Example 2)
25k - - 0 - -
c c c c x;
```

**Additional Output**
```txt
Stacks:
Seat 1: 25000
Seat 2: 24790
Seat 3: 9990
Seat 4: empty
Seat 5: 24840
Seat 6: 14990

Positions:
Seat 1: BTN
Seat 2: SB
Seat 3: BB
Seat 4: empty
Seat 5: UTG
Seat 6: CO

*** Preflop ***
  All players post ante 10
  SB posts small blind 25
  BB posts big blind 50
  UTG calls
  CO calls
  BTN calls
  SB calls
  BB checks
```

👉 The parser carries stacks forward, rotates the button, and starts the next hand automatically.

## 🙏 Acknowledgment

CHIP builds on the excellent [Typescript Poker Engine](https://github.com/claudijo/poker-ts) by **Claudijo Borovic**, with modifications to support this software.

## 📜 License

[MIT](LICENSE)
