// Character classes and UI strings for chapter 03's trained-embedding figures.

export const classColors: Record<string, string> = {
  vowel: '#c0621f',
  consonant: '#2f6fb0',
  upper: '#9b4fb0',
  symbol: '#3a8a5c',
  space: '#454943',
};
export const classOrder = ['vowel', 'consonant', 'upper', 'symbol', 'space'];

// Diverging scale for cosine similarity: blue (−1), paper (0), orange (+1).
const negative = [47, 111, 176];
const positive = [192, 98, 31];
const neutral = [247, 246, 242];
export const cosineColor = (value: number) => {
  const pole = value < 0 ? negative : positive;
  const t = Math.min(1, Math.abs(value));
  const mix = neutral.map((n, i) => Math.round(n + (pole[i] - n) * t));
  return `rgb(${mix.join(',')})`;
};

export const embeddingMapUi = {
  ja: {
    caption: 'トークン埋め込みの 65 行を 2 次元に射影した配置',
    stage: '重み',
    stageLabel: (iter: number) => `更新 ${iter.toLocaleString('en-US')} 回後`,
    classes: {
      vowel: '小文字の母音',
      consonant: '小文字の子音',
      upper: '大文字',
      symbol: '句読点・記号・数字',
      space: '空白・改行',
    } as Record<string, string>,
    instruction:
      '下の文字を選ぶと、その文字の埋め込みとコサイン類似度が高い文字を表示します。',
    neighbors: 'コサイン類似度の上位 5 文字',
    selected: '選択した文字',
    axes: (pc1: number, pc2: number) =>
      `横軸は第 1 主成分（分散の ${pc1}%）、縦軸は第 2 主成分（${pc2}%）です。`,
    correlation: '第 1 主成分と、学習用データでの出現回数（対数）の相関係数',
    noScript:
      'JavaScript が無効な場合は、更新 2,000 回後の配置と、e の近傍を表示します。',
  },
  en: {
    caption: 'The 65 rows of the token embedding projected onto two dimensions',
    stage: 'Weights',
    stageLabel: (iter: number) =>
      `After ${iter.toLocaleString('en-US')} updates`,
    classes: {
      vowel: 'Lowercase vowels',
      consonant: 'Lowercase consonants',
      upper: 'Uppercase',
      symbol: 'Punctuation, symbols, digits',
      space: 'Space and newline',
    } as Record<string, string>,
    instruction:
      'Select a character below to list the characters whose embeddings have the highest cosine similarity with it.',
    neighbors: 'Top 5 by cosine similarity',
    selected: 'Selected character',
    axes: (pc1: number, pc2: number) =>
      `The horizontal axis is the first principal component (${pc1}% of the variance); the vertical axis is the second (${pc2}%).`,
    correlation:
      'Correlation of the first principal component with the log training count',
    noScript:
      'With JavaScript disabled, the layout after 2,000 updates and the neighbors of e are shown.',
  },
};

export const positionSimilarityUi = {
  ja: {
    caption: '位置埋め込みの 64 行どうしのコサイン類似度',
    stage: '重み',
    stageLabel: (iter: number) => `更新 ${iter.toLocaleString('en-US')} 回後`,
    heatmap: '行・列とも位置 0〜63。左上が位置 0 です。',
    distanceCaption: '位置の差ごとの平均コサイン類似度',
    distance: '位置の差',
    scale: 'コサイン類似度',
    note: '橙は似た向き、青は逆向きのベクトルを表します。',
  },
  en: {
    caption: 'Cosine similarity between the 64 rows of the position embedding',
    stage: 'Weights',
    stageLabel: (iter: number) =>
      `After ${iter.toLocaleString('en-US')} updates`,
    heatmap:
      'Rows and columns are positions 0–63, with position 0 at the top left.',
    distanceCaption: 'Mean cosine similarity by position difference',
    distance: 'Position difference',
    scale: 'Cosine similarity',
    note: 'Orange marks vectors pointing in similar directions; blue marks opposite directions.',
  },
};
