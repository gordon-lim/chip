import { parseCHIP } from './src/parser';

// Your test input here
const testInput = `25 50 10 6 5
12.5k 25k 10k 25k 25k 15k
f f 150 f c c
2c ad 6c
x 50 f
th tc`;

console.log(parseCHIP(testInput));
