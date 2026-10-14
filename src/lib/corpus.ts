// UI strings for the corpus statistics of chapters 01 and 02.

export const frequencyUi = {
  ja: {
    caption: 'Tiny Shakespeare の学習用データに現れる文字の割合',
    axis: '学習用データ 1,003,854 文字に占める割合',
    note: '65 文字を学習用データでの出現回数の順に並べています。棒にカーソルを合わせると回数を表示します。',
    table: '文字ごとの出現回数を表で表示',
    char: '文字',
    id: 'ID',
    count: '学習用の出現回数',
    share: '割合',
    lossCaption: '予測に使う情報と、検証データでの平均損失',
    lossAxis: '検証データでの平均損失（nat）',
    uniform: '一様（65 文字に等しい確率）',
    unigram: '文字の出現頻度だけを使う',
    bigram: '直前の 1 文字だけを使う',
    model: '第 11 章で学習したモデル（直前の最大 64 文字）',
    lossNote:
      '頻度と直前の 1 文字による予測は、学習用データで数えた回数に 1 を足して確率にしたものです。モデルの値は train.py が表示した更新 2,000 回後の検証損失です。',
  },
  en: {
    caption: 'Share of each character in the Tiny Shakespeare training data',
    axis: 'Share of the 1,003,854 training characters',
    note: 'The 65 characters are ordered by their count in the training data. Hover over a bar to see its count.',
    table: 'Show character counts as a table',
    char: 'Character',
    id: 'ID',
    count: 'Training count',
    share: 'Share',
    lossCaption: 'Information used for prediction and the mean validation loss',
    lossAxis: 'Mean loss on the validation data (nats)',
    uniform: 'Uniform (equal probability for 65 characters)',
    unigram: 'Character frequencies only',
    bigram: 'Previous character only',
    model: 'Chapter 11 model (up to 64 previous characters)',
    lossNote:
      'The frequency and previous-character predictions add 1 to every count from the training data before normalizing. The model value is the validation loss train.py printed after 2,000 updates.',
  },
};

export const coverageUi = {
  ja: {
    caption: '第 11 章の学習で、各文字が入力 X に含まれた回数',
    countAxis: '入力 X に含まれた回数',
    shareAxis: '学習用データの位置の割合',
    observed: '実際の回数',
    poisson: 'ポアソン分布による見積もり',
    progressCaption: '一度でも入力に含まれた位置の割合',
    updates: '更新回数',
    note: '2,001 回の更新で使った 24,012 本の入力（各 64 文字）を数えています。評価用に取り出したバッチは含めていません。',
    table: '回数ごとの位置の数を表で表示',
    times: '回数',
    positions: '位置の数',
    expected: '見積もり',
  },
  en: {
    caption:
      'How many times each character appeared in an input X during the chapter 11 run',
    countAxis: 'Times included in an input X',
    shareAxis: 'Share of training-data positions',
    observed: 'Observed',
    poisson: 'Poisson estimate',
    progressCaption: 'Share of positions included in at least one input',
    updates: 'Updates',
    note: 'The counts cover the 24,012 inputs (64 characters each) used by the 2,001 updates. Batches drawn for evaluation are not included.',
    table: 'Show the number of positions per count as a table',
    times: 'Times',
    positions: 'Positions',
    expected: 'Estimate',
  },
};
