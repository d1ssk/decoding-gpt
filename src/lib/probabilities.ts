import { softmax } from './plot';

// The same steps as GPT.generate(): divide by temperature, keep the top k
// logits, then apply softmax.
export const nextTokenProbs = (
  logits: number[],
  temperature: number,
  topK: number,
) => {
  const scaled = logits.map((v) => v / temperature);
  const kth = [...scaled].sort((a, b) => b - a)[
    Math.min(topK, scaled.length) - 1
  ];
  return softmax(scaled.map((v) => (v < kth ? -Infinity : v)));
};

export const entropy = (probs: number[]) =>
  -probs.reduce((sum, p) => (p > 0 ? sum + p * Math.log(p) : sum), 0);

export const probabilityUi = {
  ja: {
    caption: '次の文字の確率分布を temperature と top-k で変える',
    instruction:
      '文字を選ぶと、その位置までを入力として次の文字を予測した分布を表示します。',
    temperature: 'temperature',
    topK: 'top-k',
    sample: '20 回サンプリング',
    samples: 'サンプル',
    target: '正解',
    targetProb: '正解の確率',
    entropy: 'エントロピー',
    candidates: '確率の高い候補（上位 12）',
    lensCaption:
      '各 block の後のストリームを ln_f と lm_head で読んだ場合の上位 5 候補',
    stage: '読み出す位置',
    embedding: '埋め込み',
    afterBlock: 'block {n} の後',
    position: '位置',
    note: '確率はブラウザで logits から計算しています。サンプリングもブラウザの乱数を使うため、結果は毎回変わります。',
    noScript:
      'JavaScript が無効な場合は、位置 56 の temperature 1.0 の分布を表示します。',
  },
  en: {
    caption:
      'Change the next-character distribution with temperature and top-k',
    instruction:
      'Select a character to show the predicted distribution for the next character, using the input up to that position.',
    temperature: 'temperature',
    topK: 'top-k',
    sample: 'Sample 20 times',
    samples: 'Samples',
    target: 'Target',
    targetProb: 'Target probability',
    entropy: 'Entropy',
    candidates: 'Most probable candidates (top 12)',
    lensCaption:
      'Top 5 candidates when the stream after each block is read through ln_f and lm_head',
    stage: 'Read from',
    embedding: 'Embedding',
    afterBlock: 'After block {n}',
    position: 'Position',
    note: 'Probabilities are computed from the logits in the browser. Sampling also uses the browser’s random numbers, so results change on every run.',
    noScript:
      'With JavaScript disabled, the temperature 1.0 distribution at position 56 is shown.',
  },
} as const;
