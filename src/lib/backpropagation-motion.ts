import {
  buildTrace,
  type Array2D,
  type Demo,
  type Ref,
} from './backpropagation-toy.ts';
export const numberText = (n: number) =>
  !Number.isFinite(n)
    ? n < 0
      ? '−∞'
      : '∞'
    : (Math.abs(n) < 0.0005 ? '0' : String(Number(n.toFixed(3)))).replace(
        '-',
        '−',
      );

export type Direction = 'forward' | 'backward';
export type Product = {
  factors: Ref[];
  scale: number;
  operation?: 'exp' | 'divide';
};
export type Calculation = { target: Ref; terms: Product[] };
export type MotionStage = {
  id: string;
  formula: string;
  calculations: Calculation[];
  sources: string[];
  outputs?: string[];
};
export type MotionTrace = {
  arrays: Record<string, Array2D>;
  stages: MotionStage[];
  fixed: boolean;
};
const r = (name: string, row: number, col = 0): Ref => ({ name, row, col });
const p = (...factors: Ref[]): Product => ({ factors, scale: 1 });
const transpose = (a: Array2D) => a[0].map((_, j) => a.map((row) => row[j]));
export const at = (arrays: MotionTrace['arrays'], ref: Ref) =>
  arrays[ref.name][ref.row][ref.col];
export function productValue(
  arrays: MotionTrace['arrays'],
  product: Product,
): number {
  const values = product.factors.map((ref) => at(arrays, ref));
  if (product.operation === 'exp') return Math.exp(values[0]);
  if (product.operation === 'divide') return values[0] / values[1];
  return values.reduce((value, next) => value * next, product.scale);
}
export const sameRef = (a: Ref, b: Ref) =>
  a.name === b.name && a.row === b.row && a.col === b.col;
export function makeMotionTrace(demo: Demo, direction: Direction): MotionTrace {
  const arrays: MotionTrace['arrays'] = {};
  const stages: MotionStage[] = [];
  function stage(
    id: string,
    formula: string,
    rows: number,
    cols: number,
    terms: (i: number, j: number) => Product[],
  ) {
    const calculations = Array.from({ length: rows }, (_, i) =>
      Array.from({ length: cols }, (_, j) => ({
        target: r(id, i, j),
        terms: terms(i, j),
      })),
    ).flat();
    arrays[id] = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (const calculation of calculations)
      arrays[id][calculation.target.row][calculation.target.col] =
        calculation.terms.reduce((v, t) => v + productValue(arrays, t), 0);
    stages.push({
      id,
      formula,
      calculations,
      sources: [
        ...new Set(
          calculations.flatMap((c) =>
            c.terms.flatMap((t) => t.factors.map((f) => f.name)),
          ),
        ),
      ],
    });
  }
  if (demo !== 'attention') {
    const residual = demo === 'residual';
    arrays.W = residual
      ? [
          [1, -2],
          [0.5, 1],
        ]
      : [
          [1, -2, 0.5],
          [3, 1, -1],
        ];
    arrays.x = residual ? [[2], [-1]] : [[2], [-1], [4]];
    arrays.G = [[2], [-1]];
    stage(residual ? 'F' : 'y', residual ? 'F = Wx' : 'y = Wx', 2, 1, (i) =>
      arrays.x.map((_, j) => p(r('W', i, j), r('x', j))),
    );
    if (residual)
      stage('y', 'y = x + F', 2, 1, (i) => [p(r('x', i)), p(r('F', i))]);
    if (direction === 'forward') return { arrays, stages, fixed: !residual };
    stages.length = 0;
    if (residual) {
      stage('dSkip', '∂L/∂x (skip) = ∂L/∂y × 1', 2, 1, (i) => [p(r('G', i))]);
      stage('dF', '∂L/∂F = ∂L/∂y × 1', 2, 1, (i) => [p(r('G', i))]);
      // The addition sends the same gradient to both inputs in one animation.
      stages[0].outputs = ['dSkip', 'dF'];
      stages[0].formula = '∂L/∂x (skip) = ∂L/∂F = ∂L/∂y × 1';
      stages.splice(1, 1);
    }
    const g = residual ? 'dF' : 'G';
    stage(
      'dW',
      '∂L/∂W[i,j] = (∂L/∂y[i]) × x[j]',
      2,
      arrays.x.length,
      (i, j) => [p(r(g, i), r('x', j))],
    );
    stage(
      residual ? 'dBranch' : 'dx',
      residual ? '∂L/∂x (branch) = Wᵀ (∂L/∂F)' : '∂L/∂x = Wᵀ (∂L/∂y)',
      arrays.x.length,
      1,
      (j) => [0, 1].map((i) => p(r('W', i, j), r(g, i))),
    );
    if (residual)
      stage('dx', '∂L/∂x = ∂L/∂x (skip) + ∂L/∂x (branch)', 2, 1, (i) => [
        p(r('dSkip', i)),
        p(r('dBranch', i)),
      ]);
    return { arrays, stages, fixed: !residual };
  }
  const original = buildTrace('attention', 'last');
  const transposed = ['WQ', 'WK', 'WV', 'dWQ', 'dWK', 'dWV'];
  for (const [name, value] of Object.entries(original.arrays))
    arrays[name] = transposed.includes(name) ? transpose(value) : value;
  const convert = (ref: Ref): Ref =>
    transposed.includes(ref.name) ? r(ref.name, ref.col, ref.row) : ref;
  if (direction === 'backward') {
    for (const s of original.stages) {
      const rows = arrays[s.id].length,
        cols = arrays[s.id][0].length;
      let formula = s.formula;
      if (s.id.startsWith('dW'))
        formula = `∂L/∂${s.id.slice(1)} = (∂L/∂${s.id.slice(2)})ᵀ X`;
      if (s.id.startsWith('dX') && s.id.length === 3)
        formula = `${s.id} = d${s.id[2]} W${s.id[2]}`;
      stage(s.id, formula, rows, cols, (i, j) => {
        const originalTerms = transposed.includes(s.id)
          ? s.terms[j][i]
          : s.terms[i][j];
        return originalTerms.map((t) => ({
          ...t,
          factors: t.factors.map(convert),
        }));
      });
    }
  } else {
    for (const name of ['Q', 'K', 'V'])
      stage(name, `${name} = X W${name}ᵀ`, 3, 2, (t, i) =>
        [0, 1].map((j) => p(r('X', t, j), r(`W${name}`, i, j))),
      );
    stage('S', 'S = QKᵀ / √2 (causal mask)', 3, 3, (t, u) =>
      u > t
        ? [{ factors: [], scale: -Infinity }]
        : [0, 1].map((j) => ({
            factors: [r('Q', t, j), r('K', u, j)],
            scale: 1 / Math.sqrt(2),
          })),
    );
    stage('E', 'E[t,u] = exp(S[t,u])', 3, 3, (t, u) => [
      { factors: [r('S', t, u)], scale: 1, operation: 'exp' },
    ]);
    stage('z', 'z[t] = Σᵤ E[t,u]', 3, 1, (t) =>
      [0, 1, 2].map((u) => p(r('E', t, u))),
    );
    stage('A', 'A[t,u] = E[t,u] / z[t]', 3, 3, (t, u) => [
      { factors: [r('E', t, u), r('z', t)], scale: 1, operation: 'divide' },
    ]);
    stage('O', 'O = AV', 3, 2, (t, j) =>
      [0, 1, 2].map((u) => p(r('A', t, u), r('V', u, j))),
    );
  }
  return { arrays, stages, fixed: false };
}

export type Frame = { calculation: number; term: number; phase: number };
/** One complete scalar destination (or both branches of residual addition) per step. */
export function elementFrames(stage: MotionStage): Frame[] {
  return stage.calculations.map((_, calculation) => ({
    calculation,
    term: 0,
    phase: 3,
  }));
}
export const linearBackwardTiming = {
  move: 380,
  store: 820,
  arrive: 1200,
  cycle: 1350,
};
/** Forward uses four phases; backward animates a complete destination per step. */
export function linearFrames(stage: MotionStage): Frame[] {
  if (stage.id === 'dW' || stage.id === 'dx')
    return stage.calculations.map((_, calculation) => ({
      calculation,
      term: 0,
      phase: 3,
    }));
  return stage.calculations.flatMap((_, calculation) =>
    Array.from({ length: 4 }, (_, phase) => ({ calculation, term: 0, phase })),
  );
}
export const displayName = (name: string): string =>
  ({
    G: '∂L/∂y',
    dW: '∂L/∂W',
    dx: '∂L/∂x',
    dSkip: '∂L/∂x (skip)',
    dBranch: '∂L/∂x (branch)',
    dF: '∂L/∂F',
    dXQ: '∂L/∂X (Q)',
    dXK: '∂L/∂X (K)',
    dXV: '∂L/∂X (V)',
  })[name] ?? (name.startsWith('d') ? `∂L/∂${name.slice(1)}` : name);
