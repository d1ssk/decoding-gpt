// Node 22+: node --experimental-strip-types scripts/check-backpropagation-motion.mjs
import assert from 'node:assert/strict';
import { makeMotionTrace } from '../src/lib/backpropagation-motion.ts';
import { buildTrace } from '../src/lib/backpropagation-toy.ts';
let checks = 0;
function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
  checks++;
}
for (const demo of ['linear', 'residual']) {
  const { arrays: a } = makeMotionTrace(demo, 'backward');
  const loss = (W, x) =>
    W.reduce(
      (total, row, i) =>
        total +
        a.G[i][0] *
          (row.reduce((v, w, j) => v + w * x[j][0], 0) +
            (demo === 'residual' ? x[i][0] : 0)),
      0,
    );
  for (const name of ['W', 'x']) {
    a[name].forEach((row, i) =>
      row.forEach((_, j) => {
        const plus = structuredClone(a[name]),
          minus = structuredClone(a[name]);
        plus[i][j] += 1e-5;
        minus[i][j] -= 1e-5;
        const lp = name === 'W' ? loss(plus, a.x) : loss(a.W, plus);
        const lm = name === 'W' ? loss(minus, a.x) : loss(a.W, minus);
        close(a[`d${name}`][i][j], (lp - lm) / 2e-5);
      }),
    );
  }
  const f = makeMotionTrace(demo, 'forward').arrays;
  f.y.forEach((row, i) =>
    close(
      row[0],
      a.W[i].reduce(
        (v, w, j) => v + w * a.x[j][0],
        demo === 'residual' ? a.x[i][0] : 0,
      ),
    ),
  );
}
assert.deepEqual(makeMotionTrace('linear', 'forward').arrays.y, [[6], [1]]);
assert.deepEqual(makeMotionTrace('linear', 'backward').arrays.dW, [
  [4, -2, 8],
  [-2, 1, -4],
]);
assert.deepEqual(makeMotionTrace('linear', 'backward').arrays.dx, [
  [-1],
  [-5],
  [2],
]);
const original = buildTrace('attention', 'last');
for (const direction of ['forward', 'backward']) {
  const trace = makeMotionTrace('attention', direction);
  for (const { id } of trace.stages) {
    if (['E', 'z'].includes(id)) continue;
    trace.arrays[id].forEach((row, i) =>
      row.forEach((v, j) => {
        const expected = id.startsWith('dW')
          ? original.arrays[id][j][i]
          : original.arrays[id][i][j];
        if (v === -Infinity) assert.equal(v, expected);
        else close(v, expected);
      }),
    );
  }
}
console.log(
  `Passed ${checks} motion-model checks: numerical derivatives, exact linear outputs, attention forward intermediates, and displayed weight orientation.`,
);
