// Node 22+: node --experimental-strip-types scripts/check-backpropagation-layout.mjs
import assert from 'node:assert/strict';
import {
  makeMotionTrace,
  elementFrames,
  at,
} from '../src/lib/backpropagation-motion.ts';
import {
  operationBoards,
  operationPlan,
  pointOnBoard,
} from '../src/lib/backpropagation-layout.ts';
let count = 0;
for (const demo of ['residual', 'attention']) {
  for (const direction of ['forward', 'backward']) {
    const trace = makeMotionTrace(demo, direction);
    for (const stage of trace.stages) {
      const boards = operationBoards(stage, demo);
      assert.equal(elementFrames(stage).length, stage.calculations.length);
      for (const calculation of stage.calculations) {
        const plan = operationPlan(stage, calculation, boards, demo);
        for (const ref of plan.refs) {
          assert.ok(!Number.isNaN(at(trace.arrays, ref)));
          assert.ok(pointOnBoard(boards, ref));
        }
        for (const result of plan.results) {
          assert.ok(boards.some((b) => b.name === result.ref.name && b.target));
          assert.equal(
            at(trace.arrays, result.ref),
            at(trace.arrays, calculation.target),
          );
        }
        for (const point of [
          ...plan.copies.map((c) => c.to),
          ...plan.results.map((r) => r.from),
        ]) {
          assert.ok(
            point.x >= 39 && point.x <= 1001 && point.y >= 22 && point.y <= 728,
          );
        }
        if (stage.id === 'dSkip')
          assert.deepEqual(
            plan.results.map((r) => r.ref.name),
            ['dSkip', 'dF'],
          );
        if (stage.id === 'S' || stage.id === 'dS') {
          assert.equal(
            plan.masked,
            calculation.target.col > calculation.target.row,
          );
          if (plan.masked) assert.equal(plan.copies.length, 0);
        }
        if (stage.id === 'A')
          assert.ok(plan.symbols.some((s) => s.text === '÷'));
        count++;
      }
    }
  }
}
console.log(
  `Passed ${count} spatial calculation checks: source references, destinations, simultaneous residual branches, causal masks, and one-step frames.`,
);
