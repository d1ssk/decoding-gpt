// Abramowitz–Stegun 7.1.26 (absolute error < 1.5e-7), enough for drawing GELU.
export const erf = (x: number) => {
  const sign = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const poly =
    t *
    (0.254829592 +
      t *
        (-0.284496736 +
          t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-a * a));
};

// nn.GELU() with its default approximate='none'.
export const gelu = (x: number) => 0.5 * x * (1 + erf(x / Math.SQRT2));

// F.layer_norm without bias, as in nanoGPT's LayerNorm(bias=False).
export const layerNorm = (values: number[], weight: number[], eps = 1e-5) => {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const normalized = values.map((v) => (v - mean) / Math.sqrt(variance + eps));
  return {
    mean,
    std: Math.sqrt(variance),
    normalized,
    output: normalized.map((v, i) => v * weight[i]),
  };
};

export const sublayerName = (name: string) =>
  name === 'embedding'
    ? 'emb'
    : name.replace(/^attn(\d)$/, 'attn $1').replace(/^mlp(\d)$/, 'mlp $1');

export const residualUi = {
  ja: {
    layerNormCaption: 'LayerNorm は成分の平均と散らばりをそろえる',
    layerNormNote:
      '学習済みモデルの位置 52（2 つ目の Good の G）で、層 0 の ln_1 に入るベクトル（128 成分）です。スライダーで入力全体に定数を足したり、定数倍したりできます。',
    shift: '全成分に足す値',
    scale: '全成分に掛ける値',
    input: '入力 x',
    normalized: '正規化 (x − 平均) / 標準偏差',
    output: 'weight を掛けた出力',
    mean: '平均',
    std: '標準偏差',
    mlpCaption: 'GELU と、学習済みモデルの MLP 中間層の値の分布',
    layer: '層',
    curve: 'GELU(u)',
    histogram: 'c_fc の出力 u の分布（200 本 × 64 位置 × 512 成分）',
    positive: 'u > 0 の割合',
    mlpNote: '横軸は c_fc の出力 u です。範囲外の値は端の区間に含めています。',
    streamCaption: '各位置の残差ストリームに足されるベクトルの大きさ',
    instruction:
      '文字を選ぶと、その位置で各サブレイヤーが書き込んだベクトルのノルムを表示します。',
    write: '書き込んだベクトルのノルム',
    stream: '足した後のストリームのノルム',
    cos: '最終的なストリームとのコサイン類似度',
    sublayer: 'サブレイヤー',
    position: '位置',
    noScript: 'JavaScript が無効な場合は、位置 52 の値を表示します。',
  },
  en: {
    layerNormCaption:
      'LayerNorm standardizes the mean and spread of components',
    layerNormNote:
      'This is the 128-component vector entering layer 0’s ln_1 at position 52 (the G of the second Good) in the trained model. The sliders add a constant to every input component or multiply them all by a constant.',
    shift: 'Value added to every component',
    scale: 'Value multiplying every component',
    input: 'Input x',
    normalized: 'Normalized (x − mean) / standard deviation',
    output: 'Output after multiplying by weight',
    mean: 'Mean',
    std: 'Standard deviation',
    mlpCaption:
      'GELU and the distribution of MLP hidden values in the trained model',
    layer: 'Layer',
    curve: 'GELU(u)',
    histogram:
      'Distribution of c_fc outputs u (200 windows × 64 positions × 512 components)',
    positive: 'Fraction with u > 0',
    mlpNote:
      'The horizontal axis is the c_fc output u. Values outside the range are counted in the end bins.',
    streamCaption:
      'Sizes of the vectors added to each position’s residual stream',
    instruction:
      'Select a character to show the norms of the vectors each sublayer writes at that position.',
    write: 'Norm of the written vector',
    stream: 'Norm of the stream after the addition',
    cos: 'Cosine similarity to the final stream',
    sublayer: 'Sublayer',
    position: 'Position',
    noScript: 'With JavaScript disabled, values for position 52 are shown.',
  },
} as const;

// One SVG path for a bar chart centered on zeroY; unitsPerValue maps values to pixels.
export const barsPath = (
  values: number[],
  width: number,
  zeroY: number,
  unitsPerValue: number,
  limit: number,
) => {
  const step = width / values.length;
  return values
    .map((value, i) => {
      const h = Math.max(-limit, Math.min(limit, value * unitsPerValue));
      const x = i * step;
      return `M${x.toFixed(2)} ${zeroY}h${(step * 0.8).toFixed(2)}v${(-h).toFixed(2)}h${(-step * 0.8).toFixed(2)}Z`;
    })
    .join('');
};
