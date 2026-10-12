import { exampleInputs } from './weighted-vectors';

// Educational linear transformations of the same seeded inputs as the value example.
// Rows are output components; columns are input components. Both biases are zero.
export const queryWeights = [
  [0.8, 0.3],
  [-0.2, 0.9],
];
export const keyWeights = [
  [-0.3, 0.8],
  [0.9, 0.2],
];
const transform = (weights: number[][]) =>
  exampleInputs.map((sample) =>
    sample.map((vector) =>
      weights.map((row) =>
        row.reduce((sum, weight, c) => sum + weight * vector[c], 0),
      ),
    ),
  );
export const queries = transform(queryWeights);
export const keys = transform(keyWeights);
export const dotProducts = queries.map((sample, b) =>
  sample.map((query) =>
    keys[b].map((key) =>
      query.reduce((sum, value, c) => sum + value * key[c], 0),
    ),
  ),
);
export const queryKeyExtent = Math.ceil(
  Math.max(...[queries, keys].flat(3).map(Math.abs)),
);
export const queryColor = '#276b92';
export const keyColor = '#a05a20';
export const formatDot = (value: number) =>
  (Math.abs(value) < 0.0005 ? 0 : value).toFixed(3);

export const queryKeyUi = {
  ja: {
    caption: 'query と key の内積を見る',
    instruction:
      'q と k のどちらの表からも、マスを選んでサンプル b を切り替えられます。',
    queryVectors: '各位置の query',
    keyVectors: '各位置の key',
    select: 'サンプルを選択',
    query: 'query（実線）',
    key: 'key（破線）',
    products: '選択したサンプルの内積',
    sample: 'サンプル',
    pair: '内積',
    components: '成分と数値計算を表示',
    transformation: '線形変換の重み（行は出力成分、列は入力成分、bias は 0）',
    noScript: 'JavaScript が無効な場合は、サンプル 0 の内積を表示します。',
  },
  en: {
    caption: 'Inspect query–key dot products',
    instruction: 'Select a cell in either the q or k table to switch sample b.',
    queryVectors: 'Queries at each position',
    keyVectors: 'Keys at each position',
    select: 'Select sample',
    query: 'Query (solid)',
    key: 'Key (dashed)',
    products: 'Dot products for the selected sample',
    sample: 'Sample',
    pair: 'Dot product',
    components: 'Show components and numeric calculations',
    transformation:
      'Linear transformation weights (output rows, input columns, zero bias)',
    noScript: 'With JavaScript disabled, dot products for sample 0 are shown.',
  },
};
