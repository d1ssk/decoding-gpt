// Run with Node 22+: node --experimental-strip-types scripts/check-backpropagation-toy.mjs
import assert from 'node:assert/strict';
import {
  buildTrace,
  forward,
  initialArrays,
} from '../src/lib/backpropagation-toy.ts';

const epsilon = 1e-5;
let checked = 0;
let maxError = 0;
function close(actual, expected, label) {
  const error = Math.abs(actual - expected);
  maxError = Math.max(error, maxError);
  assert.ok(
    Number.isFinite(actual) && error < 1e-8,
    `${label}: ${actual} vs ${expected}`,
  );
  checked++;
}
const dot = (a, b) =>
  a.reduce(
    (total, row, i) => total + row.reduce((s, v, j) => s + v * b[i][j], 0),
    0,
  );
function finiteDifference(values, objective, gradient, label) {
  values.forEach((row, i) =>
    row.forEach((_, j) => {
      const plus = structuredClone(values);
      const minus = structuredClone(values);
      plus[i][j] += epsilon;
      minus[i][j] -= epsilon;
      close(
        gradient[i][j],
        (objective(plus) - objective(minus)) / (2 * epsilon),
        `${label}[${i},${j}]`,
      );
    }),
  );
}
for (const demo of ['linear', 'residual', 'attention']) {
  for (const seed of ['last', 'all']) {
    const inputs = initialArrays(demo, seed);
    const trace = buildTrace(demo, seed);
    const a = trace.arrays;
    for (const name of ['X', ...trace.parameters]) {
      finiteDifference(
        inputs[name],
        (values) => {
          const result = forward(demo, { ...inputs, [name]: values });
          return dot(result[trace.output], inputs.G);
        },
        a[`d${name}`],
        `${demo}/${seed}/${name}`,
      );
    }
    if (demo === 'residual') {
      a.dX.forEach((row, i) =>
        row.forEach((v, j) =>
          close(v, a.G[i][j] + a.dBranch[i][j], 'residual merge'),
        ),
      );
      assert.deepEqual(a.dSkip, a.G);
      assert.deepEqual(a.dF, a.G);
    }
    if (demo === 'attention') {
      // Independently differentiate each internal operation as well as the parameters.
      const weightedValues = (weights, values) =>
        weights.map((row) =>
          [0, 1].map((r) => row.reduce((s, w, u) => s + w * values[u][r], 0)),
        );
      const attention = (q, k) =>
        q.map((row, t) => {
          const scores = k.map((key, u) =>
            u > t
              ? -Infinity
              : row.reduce((s, v, r) => s + v * key[r], 0) / Math.sqrt(2),
          );
          const exps = scores.map((s) => Math.exp(s - Math.max(...scores)));
          return exps.map((v) => v / exps.reduce((s, e) => s + e, 0));
        });
      finiteDifference(
        a.V,
        (v) => dot(weightedValues(a.A, v), a.G),
        a.dV,
        'dV',
      );
      finiteDifference(
        a.A,
        (weights) => dot(weightedValues(weights, a.V), a.G),
        a.dA,
        'dA',
      );
      finiteDifference(
        a.Q,
        (q) => dot(weightedValues(attention(q, a.K), a.V), a.G),
        a.dQ,
        'dQ',
      );
      finiteDifference(
        a.K,
        (k) => dot(weightedValues(attention(a.Q, k), a.V), a.G),
        a.dK,
        'dK',
      );
      const scores = a.S.map((row) =>
        row.map((v) => (Number.isFinite(v) ? v : 0)),
      );
      finiteDifference(
        scores,
        (s) => {
          const weights = s.map((row, t) => {
            const exps = row.map((v, u) => (u > t ? 0 : Math.exp(v)));
            return exps.map((v) => v / exps.reduce((x, y) => x + y, 0));
          });
          return dot(weightedValues(weights, a.V), a.G);
        },
        a.dS,
        'dS',
      );
      for (let t = 0; t < 3; t++) {
        close(
          a.A[t].reduce((x, y) => x + y),
          1,
          'softmax row sum',
        );
        close(
          a.dS[t].reduce((x, y) => x + y),
          0,
          'softmax gradient row sum',
        );
        for (let u = t + 1; u < 3; u++) {
          assert.equal(a.A[t][u], 0);
          assert.equal(a.dS[t][u], 0);
        }
      }
    }
  }
}
console.log(
  `Passed ${checked} numeric checks across all three examples and both seeds; max absolute error ${maxError.toExponential(3)}.`,
);
