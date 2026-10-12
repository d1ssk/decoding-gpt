// Reproducible educational example; these are not trained nanoGPT values.
// Only the singleton head axis is omitted from the fixture arrays.
export const exampleSeed = 29;
let randomState = exampleSeed;
function random() {
  randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
  return randomState / 4294967296;
}
const randomSigned = (extent: number) =>
  Math.round((2 * random() - 1) * extent * 100) / 100;
export const exampleInputs = Array.from({ length: 2 }, () =>
  Array.from({ length: 3 }, () => [randomSigned(2), randomSigned(2)]),
);
// nn.Linear-style [output component, input component], with zero bias.
export const exampleValueWeights = Array.from({ length: 2 }, () => [
  randomSigned(1),
  randomSigned(1),
]);
export const exampleValues = exampleInputs.map((sample) =>
  sample.map((vector) =>
    exampleValueWeights.map((row) =>
      row.reduce((sum, weight, c) => sum + weight * vector[c], 0),
    ),
  ),
);
// Hand-set causal coefficients keep the focus on value aggregation.
export const exampleAttention = [
  [
    [1, 0, 0],
    [0.7, 0.3, 0],
    [0.2, 0.3, 0.5],
  ],
  [
    [1, 0, 0],
    [0.4, 0.6, 0],
    [0.5, 0.2, 0.3],
  ],
];
export const vectorColors = ['#276b92', '#a05a20', '#79509b'];
export const inputColor = '#454943';
export const resultColor = '#1e5b49';
export const subscript = (position: number) => ['₀', '₁', '₂'][position];
export const formatVector = (values: number[]) =>
  `[${values.map((value) => Number(value.toFixed(4))).join(', ')}]`;
export function weightedVectors(weights: number[], vectors: number[][]) {
  const contributions = vectors.map((v, j) => v.map((x) => x * weights[j]));
  const result = contributions.reduce(
    (sum, v) => sum.map((x, c) => x + v[c]),
    [0, 0],
  );
  return { contributions, result };
}
export const exampleOutputs = exampleAttention.map((rows, b) =>
  rows.map((weights) => weightedVectors(weights, exampleValues[b]).result),
);
// One symmetric scale shared by inputs, values, outputs, and equation arrows.
export const vectorExtent = Math.ceil(
  Math.max(
    ...[exampleInputs, exampleValues, exampleOutputs].flat(3).map(Math.abs),
  ),
);
export const vectorPoint = (vector: number[]) => ({
  x: 80 + (60 / vectorExtent) * vector[0],
  y: 80 - (60 / vectorExtent) * vector[1],
});

export const vectorExampleUi = {
  ja: {
    caption: '説明用の配列で y = att @ v を見る',
    instruction: 'x のマスを選び、その位置の計算を上から順にたどります。',
    inputs: 'x：入力の位置を選択',
    values: 'v：各位置から取り込むベクトル',
    outputs: 'y：重み付き和の出力',
    transform: 'v は、各位置の x に同じ線形変換を適用して作ります。',
    input: '入力ベクトル',
    source: '参照先のベクトル',
    result: '出力ベクトル',
    selectInput: '入力の位置を選択',
    attention: '選択したサンプルの att',
    attentionHint:
      '行 t が出力位置、列 j が参照先を表します。強調した行の係数を、下の各ベクトルに掛けます。',
    calculation: '選択した位置の計算',
    equation:
      '選択した att の行の係数と、同じサンプルの各ベクトルから出力を計算する',
    components: '成分と数値計算を表示',
    vector: 'v のベクトル',
    coefficient: '係数',
    contribution: '係数 × ベクトル',
    valueWeights: 'v を作る線形変換の重み（bias は 0）',
    sum: '和',
    noScript:
      'JavaScript が無効な場合は、サンプル 0・位置 2 の計算を表示します。成分の開閉は操作できます。',
  },
  en: {
    caption: 'Inspect y = att @ v with illustrative arrays',
    instruction:
      'Select a position in x and follow its computation from top to bottom.',
    inputs: 'x: select an input position',
    values: 'v: vectors from each position',
    outputs: 'y: weighted-sum outputs',
    transform:
      'v is formed by applying the same linear transformation to x at every position.',
    input: 'Input vector',
    source: 'Source vector',
    result: 'Output vector',
    selectInput: 'Select input position',
    attention: 'att for the selected sample',
    attentionHint:
      'Row t represents the output position, and column j represents the source position. The highlighted row supplies the coefficients applied to the vectors below.',
    calculation: 'Computation for the selected position',
    equation:
      'Compute the output from the selected row of att and the vectors in the same sample',
    components: 'Show components and numeric calculations',
    vector: 'Vector in v',
    coefficient: 'Coefficient',
    contribution: 'Coefficient × vector',
    valueWeights:
      'Weights of the linear transformation producing v (zero bias)',
    sum: 'Sum',
    noScript:
      'With JavaScript disabled, sample 0 at position 2 is shown. You can still expand the components.',
  },
};
