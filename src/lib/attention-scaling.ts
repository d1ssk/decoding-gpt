// Causal softmax and UI strings for chapter 04's score-to-weight figures.

export const causalSoftmax = (scores: number[][], factor = 1) =>
  scores.map((row, t) => {
    const kept = row.map((value, j) => (j > t ? -Infinity : value * factor));
    const max = Math.max(...kept);
    const exps = kept.map((value) => Math.exp(value - max));
    const total = exps.reduce((a, b) => a + b, 0);
    return exps.map((value) => value / total);
  });

export const scoreFactors = [0.25, 0.5, 1, 2, 4, 8];

export const scoresToWeightsUi = {
  ja: {
    caption: 'スコアから参照の重みへ：scale、mask、softmax',
    sample: 'サンプル b',
    factor: 'スコアに掛ける倍率',
    scores: 'q @ kᵀ / √d',
    masked: 'masked_fill の後',
    weights: 'softmax の後（att）',
    note: '倍率 1 が nanoGPT の計算で、その att は上の図の係数と同じです。softmax の後の各行の和は 1 です。倍率を変えると、softmax の前にスコアの差が広がったり縮んだりします。',
    factorValue: (factor: number) => `× ${factor}`,
  },
  en: {
    caption: 'From scores to weights: scale, mask, softmax',
    sample: 'Sample b',
    factor: 'Factor applied to the scores',
    scores: 'q @ kᵀ / √d',
    masked: 'After masked_fill',
    weights: 'After softmax (att)',
    note: 'Factor 1 is nanoGPT’s computation; its att equals the coefficients in the figure above. Each row sums to 1 after softmax. Other factors widen or narrow the differences between scores before softmax.',
    factorValue: (factor: number) => `× ${factor}`,
  },
};

export const attentionScalingUi = {
  ja: {
    caption: '成分数 d と、スコアの散らばり・参照の広がり',
    stdCaption: 'スコアの標準偏差',
    effectiveCaption: '位置 63 が実質的に参照する位置の数（64 か所中）',
    raw: 'q · k（割らない）',
    scaled: 'q · k / √d（nanoGPT）',
    d: '成分数 d',
    note: '各成分が独立に標準正規分布に従う query 1 本と key 64 本を 4,000 組作り、平均をとりました。参照する位置の数は、softmax の重みのエントロピー H から exp(H) として求めています。',
    table: '値を表で表示',
    std: '標準偏差',
    effective: '参照する位置の数',
    maxWeight: '最大の重み',
  },
  en: {
    caption: 'Head size d, the spread of scores, and the breadth of attention',
    stdCaption: 'Standard deviation of the scores',
    effectiveCaption:
      'Effective number of positions attended by position 63 (out of 64)',
    raw: 'q · k (unscaled)',
    scaled: 'q · k / √d (nanoGPT)',
    d: 'Head size d',
    note: 'The values are averages over 4,000 trials, each drawing one query and 64 keys whose components are independent standard normal values. The effective number of positions is exp(H), where H is the entropy of the softmax weights.',
    table: 'Show the values as a table',
    std: 'Standard deviation',
    effective: 'Effective positions',
    maxWeight: 'Largest weight',
  },
};
