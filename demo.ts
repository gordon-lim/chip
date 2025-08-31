import { parseChip } from './src/parser';

// Your test input here
const testInput = `25 50 10 6 6
12.5k 25k 10k 25k 25k 15k
f f 150 f c c
2c ad 6c
x 50 f c
4h
x x
3c
x x
ac7c 2d2s
25k - - 0 - -
c c c c x`;

console.log(parseChip(testInput));
