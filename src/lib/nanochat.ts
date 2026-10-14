export const dotColor = (value: number, max: number) => {
  const alpha = Math.min(Math.abs(value) / max, 1) * 0.85;
  return value >= 0
    ? `rgba(30, 91, 73, ${alpha.toFixed(3)})`
    : `rgba(160, 90, 32, ${alpha.toFixed(3)})`;
};

export const rotaryUi = {
  ja: {
    caption: 'RoPE：位置に応じてベクトルを回転させる',
    note: 'nanochat の _precompute_rotary_embeddings() と apply_rotary_emb() で計算した値です。head の成分数 8、base 100000 の説明用の例で、回転前の q と k はすべての位置で同じベクトルにしています。',
    query: 'query の位置 m',
    key: 'key の位置 n',
    pair: '成分の組 {a} と {b}（周波数 {f}）',
    dot: '回転後の内積 q_m · k_n',
    offset: '相対位置 m − n',
    table: 'すべての (m, n) の内積（行 m、列 n）',
    tableNote: '同じ相対位置 m − n の対角線上では、内積が同じ値になります。',
  },
  en: {
    caption: 'RoPE: rotate vectors according to position',
    note: 'Values computed with nanochat’s _precompute_rotary_embeddings() and apply_rotary_emb(). This illustrative example uses 8 components per head and base 100000; the unrotated q and k are the same vectors at every position.',
    query: 'Query position m',
    key: 'Key position n',
    pair: 'Components {a} and {b} (frequency {f})',
    dot: 'Dot product after rotation q_m · k_n',
    offset: 'Relative position m − n',
    table: 'Dot products for every (m, n) (row m, column n)',
    tableNote:
      'Along each diagonal with the same relative position m − n, the dot product has the same value.',
  },
} as const;
