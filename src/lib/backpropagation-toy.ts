/** Small, deterministic teaching examples. W uses [input, output] order. */
export type Array2D = number[][];
export type Demo = 'linear' | 'residual' | 'attention';
export type Seed = 'last' | 'all';
export type Ref = { name: string; row: number; col: number };
export type Term = { factors: Ref[]; scale: number };
export type Stage = {
  id: string;
  formula: string;
  code: string;
  terms: Term[][][];
  sources: string[];
};
export type Trace = {
  arrays: Record<string, Array2D>;
  stages: Stage[];
  forward: string[];
  parameters: string[];
  output: string;
};
export const formatValue = (n: number): string =>
  Math.abs(n) < 0.00005 ? '0' : Number(n.toFixed(4)).toString();
export const ref = (name: string, row: number, col: number): Ref => ({
  name,
  row,
  col,
});
const term = (factors: Ref[], scale = 1): Term => ({ factors, scale });
export const valueAt = (arrays: Trace['arrays'], r: Ref) =>
  arrays[r.name][r.row][r.col];
export const termValue = (arrays: Trace['arrays'], t: Term) =>
  t.factors.reduce((v, r) => v * valueAt(arrays, r), t.scale);
const grid = <T>(
  rows: number,
  cols: number,
  fn: (i: number, j: number) => T,
): T[][] =>
  Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => fn(i, j)),
  );
const sum = (n: number, fn: (i: number) => number) =>
  Array.from({ length: n }, (_, i) => fn(i)).reduce((a, b) => a + b, 0);
const multiply = (a: Array2D, b: Array2D) =>
  grid(a.length, b[0].length, (i, j) =>
    sum(b.length, (k) => a[i][k] * b[k][j]),
  );

export function initialArrays(demo: Demo, seed: Seed): Record<string, Array2D> {
  const rows = demo === 'attention' ? 3 : 2;
  const common = {
    X: [
      [1, 0.5],
      [-0.5, 1],
      [0.5, -1],
    ].slice(0, rows),
    G: grid(rows, 2, (i, j) =>
      seed === 'last' && i !== rows - 1 ? 0 : [1, -0.5][j],
    ),
  };
  return demo === 'attention'
    ? {
        ...common,
        WQ: [
          [0.5, -0.5],
          [1, 0.5],
        ],
        WK: [
          [1, 0.5],
          [-0.5, 1],
        ],
        WV: [
          [0.5, 1],
          [-1, 0.5],
        ],
      }
    : {
        ...common,
        W: [
          [0.5, -1],
          [1.5, 0.5],
        ],
        b: [[0.1, -0.2]],
      };
}

/** Forward is separate from backward, including for finite-difference checks. */
export function forward(
  demo: Demo,
  inputs: Record<string, Array2D>,
): Record<string, Array2D> {
  const a = structuredClone(inputs);
  if (demo !== 'attention') {
    const z = multiply(a.X, a.W);
    a.F = z.map((row) => row.map((v, j) => v + a.b[0][j]));
    a.Y = a.F.map((row, i) =>
      row.map((v, j) => v + (demo === 'residual' ? a.X[i][j] : 0)),
    );
  } else {
    a.Q = multiply(a.X, a.WQ);
    a.K = multiply(a.X, a.WK);
    a.V = multiply(a.X, a.WV);
    a.S = grid(3, 3, (i, j) =>
      j > i ? -Infinity : sum(2, (k) => a.Q[i][k] * a.K[j][k]) / Math.sqrt(2),
    );
    a.A = a.S.map((row) => {
      const max = Math.max(...row);
      const exps = row.map((v) => Math.exp(v - max));
      const total = exps.reduce((x, y) => x + y, 0);
      return exps.map((v) => v / total);
    });
    a.O = multiply(a.A, a.V);
  }
  return a;
}

export function buildTrace(demo: Demo, seed: Seed): Trace {
  const arrays = forward(demo, initialArrays(demo, seed));
  const stages: Stage[] = [];
  function stage(
    id: string,
    formula: string,
    code: string,
    rows: number,
    cols: number,
    fn: (i: number, j: number) => Term[],
  ) {
    const terms = grid(rows, cols, fn);
    arrays[id] = terms.map((row) =>
      row.map((cell) => cell.reduce((v, t) => v + termValue(arrays, t), 0)),
    );
    stages.push({
      id,
      formula,
      code,
      terms,
      sources: [
        ...new Set(terms.flat(2).flatMap((t) => t.factors.map((r) => r.name))),
      ],
    });
  }
  function weightGradient(id: string, g: string) {
    stage(id, `${id} = Xᵀ ${g}`, `${id} = X.T @ ${g}`, 2, 2, (i, j) =>
      arrays.X.map((_, t) => term([ref('X', t, i), ref(g, t, j)])),
    );
  }
  function inputGradient(id: string, g: string, w: string) {
    stage(
      id,
      `${id} = ${g} ${w}ᵀ`,
      `${id} = ${g} @ ${w}.T`,
      arrays.X.length,
      2,
      (t, i) => [0, 1].map((j) => term([ref(g, t, j), ref(w, i, j)])),
    );
  }
  if (demo !== 'attention') {
    if (demo === 'residual') {
      stage('dSkip', 'dSkip = G × 1', 'dSkip = G.copy()', 2, 2, (i, j) => [
        term([ref('G', i, j)]),
      ]);
      stage('dF', 'dF = G × 1', 'dF = G.copy()', 2, 2, (i, j) => [
        term([ref('G', i, j)]),
      ]);
    }
    const g = demo === 'residual' ? 'dF' : 'G';
    weightGradient('dW', g);
    stage(
      'db',
      `db = Σₜ ${g}[t, :]`,
      `db = ${g}.sum(axis=0, keepdims=True)`,
      1,
      2,
      (_, j) => [0, 1].map((t) => term([ref(g, t, j)])),
    );
    inputGradient(demo === 'residual' ? 'dBranch' : 'dX', g, 'W');
    if (demo === 'residual') {
      stage(
        'dX',
        'dX = dSkip + dBranch',
        'dX = dSkip + dBranch',
        2,
        2,
        (i, j) => ['dSkip', 'dBranch'].map((name) => term([ref(name, i, j)])),
      );
    }
  } else {
    stage('dV', 'dV = Aᵀ G', 'dV = A.T @ G', 3, 2, (u, r) =>
      [0, 1, 2].map((t) => term([ref('A', t, u), ref('G', t, r)])),
    );
    stage('dA', 'dA = G Vᵀ', 'dA = G @ V.T', 3, 3, (t, u) =>
      [0, 1].map((r) => term([ref('G', t, r), ref('V', u, r)])),
    );
    stage(
      'm',
      'm[t] = Σⱼ A[t,j] dA[t,j]',
      'm = (A * dA).sum(axis=1, keepdims=True)',
      3,
      1,
      (t) => [0, 1, 2].map((j) => term([ref('A', t, j), ref('dA', t, j)])),
    );
    stage(
      'dS',
      'dS[t,u] = A[t,u] (dA[t,u] − m[t])',
      'dS = A * (dA - m)\ndS[causal_mask == 0] = 0',
      3,
      3,
      (t, u) =>
        u > t
          ? []
          : [
              term([ref('A', t, u), ref('dA', t, u)]),
              term([ref('A', t, u), ref('m', t, 0)], -1),
            ],
    );
    stage('dQ', 'dQ = dS K / √2', 'dQ = (dS @ K) / sqrt(2)', 3, 2, (t, r) =>
      [0, 1, 2].map((u) =>
        term([ref('dS', t, u), ref('K', u, r)], 1 / Math.sqrt(2)),
      ),
    );
    stage('dK', 'dK = dSᵀ Q / √2', 'dK = (dS.T @ Q) / sqrt(2)', 3, 2, (u, r) =>
      [0, 1, 2].map((t) =>
        term([ref('dS', t, u), ref('Q', t, r)], 1 / Math.sqrt(2)),
      ),
    );
    for (const p of ['Q', 'K', 'V']) weightGradient(`dW${p}`, `d${p}`);
    for (const p of ['Q', 'K', 'V']) inputGradient(`dX${p}`, `d${p}`, `W${p}`);
    stage('dX', 'dX = dXQ + dXK + dXV', 'dX = dXQ + dXK + dXV', 3, 2, (i, j) =>
      ['dXQ', 'dXK', 'dXV'].map((name) => term([ref(name, i, j)])),
    );
  }
  return {
    arrays,
    stages,
    forward:
      demo === 'attention'
        ? ['X', 'WQ', 'WK', 'WV', 'Q', 'K', 'V', 'S', 'A', 'O']
        : ['X', 'W', 'b', ...(demo === 'residual' ? ['F'] : []), 'Y'],
    parameters: demo === 'attention' ? ['WQ', 'WK', 'WV'] : ['W', 'b'],
    output: demo === 'attention' ? 'O' : 'Y',
  };
}
