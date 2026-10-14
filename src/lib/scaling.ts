export const widthColors: Record<number, string> = {
  32: '#a05a20',
  64: '#7a4d8c',
  128: '#276b92',
  256: '#1e5b49',
};

export const scalingUi = {
  ja: {
    caption: '条件を変えて学習した 28 回の結果',
    view: '比べる条件',
    tabs: {
      size: 'モデルの大きさ',
      length: '学習の長さ',
      context: '文脈の長さ',
      overfit: '過学習と dropout',
    },
    sizeNote:
      '横軸は位置埋め込みを除くパラメータ数（対数目盛）、縦軸は最終的な検証損失です。同じ色は同じ n_embd で、点は n_layer = 1, 2, 4, 8 の順に並びます。白抜きの点は学習用データの損失です。',
    lengthNote:
      'L = 4、C = 128 のモデルを、max_iters（= lr_decay_iters）を変えて学習しました。横軸は処理したトークン数（対数目盛）です。',
    contextNote:
      '1 回の更新のトークン数を 768 に固定し、block_size（T）とバッチサイズ（768 / T）を変えました。各線は検証損失を入力列の位置 0、1、2–3、4–7、… の区間ごとに平均したもので、線の右端がその T です。横軸は対数目盛です。',
    overfitNote:
      'L = 6、C = 256（473 万パラメータ）のモデルを 6,000 回更新しました。点線は学習用、実線は検証用の損失（estimate_loss、eval_iters = 100）です。',
    params: '位置埋め込みを除くパラメータ数',
    tokens: '学習で処理したトークン数',
    position: '入力列内の位置 t',
    iteration: '更新回数',
    valLoss: '検証損失',
    trainLoss: '学習用の損失',
    loss: '損失',
    width: 'n_embd',
    dropout: 'dropout',
    table: '全 28 回の結果を表で表示',
    group: '条件',
    seconds: '学習時間（秒）',
    flops: '推定 FLOPs',
    note: 'どの値も seed 1337 の 1 回ずつの学習です。最終的な損失は、学習後のモデルで、各データから固定 seed で選んだ 200 本（各 block_size 文字）の平均です。',
  },
  en: {
    caption: 'Results of 28 training runs under different conditions',
    view: 'Compare',
    tabs: {
      size: 'Model size',
      length: 'Training length',
      context: 'Context length',
      overfit: 'Overfitting and dropout',
    },
    sizeNote:
      'The horizontal axis is the parameter count excluding position embeddings (log scale); the vertical axis is the final validation loss. Each color is one n_embd, with points ordered by n_layer = 1, 2, 4, 8. Hollow points show the training loss.',
    lengthNote:
      'A model with L = 4 and C = 128 trained with different max_iters (= lr_decay_iters). The horizontal axis is the number of tokens processed (log scale).',
    contextNote:
      'Tokens per update fixed at 768 while varying block_size (T) and the batch size (768 / T). Each line averages the validation loss over position ranges 0, 1, 2–3, 4–7, … of the input sequence; its right end marks T. The horizontal axis is logarithmic.',
    overfitNote:
      'A model with L = 6 and C = 256 (4.73 million parameters) updated 6,000 times. Dotted lines show the training loss and solid lines the validation loss (estimate_loss, eval_iters = 100).',
    params: 'Parameters excluding position embeddings',
    tokens: 'Tokens processed in training',
    position: 'Position t in the input sequence',
    iteration: 'Updates',
    valLoss: 'Validation loss',
    trainLoss: 'Training loss',
    loss: 'Loss',
    width: 'n_embd',
    dropout: 'dropout',
    table: 'Show all 28 results as a table',
    group: 'Condition',
    seconds: 'Training time (s)',
    flops: 'Estimated FLOPs',
    note: 'Every value comes from a single run with seed 1337. Final losses average 200 windows (each block_size characters) drawn from each split with a fixed seed, using the model after training.',
  },
} as const;
