export const backpropUi = {
  ja: {
    flowCaption: 'ある位置の損失から、各位置の入力ベクトルへ届く勾配',
    flowNote:
      '文字を選ぶと、その位置 t で次の文字を予測する損失 ℓₜ を、各位置の埋め込みの和 x（128 成分）で微分した勾配のノルムを、文字の背景の濃さで表示します（最大値で正規化）。',
    lossAt: '微分する損失',
    largest: '勾配のノルムが大きい入力位置',
    future: 't より後の位置への勾配',
    zero: 'すべて 0',
    position: '位置',
    tyingCaption: '共有した重み wte.weight の各行に届く勾配のノルム',
    tyingNote:
      '上段は lm_head として使った経路、下段は埋め込みとして使った経路からの勾配です。横軸は語彙の 65 文字で、入力の 64 文字に含まれる文字を濃く表示しています。縦軸は対数目盛です。',
    outputPath: '出力側（lm_head）の経路',
    inputPath: '入力側（埋め込み）の経路',
    rowsInInput: '入力に含まれる文字',
    normsCaption: '学習中の勾配のノルム（パラメータごと、クリップ前）',
    normsNote:
      '第 11 章の学習で、各更新の backward 直後に記録した値です。横軸は対数目盛です。',
    iteration: '更新 {n} 回目',
    parameter: 'パラメータ',
    noScript: 'JavaScript が無効な場合は、初期状態の値を表示します。',
  },
  en: {
    flowCaption:
      'Gradients reaching each position’s input vector from one position’s loss',
    flowNote:
      'Select a character at position t to show the loss ℓₜ for predicting the next character. Each character’s background shade shows the norm of the gradient of ℓₜ with respect to the embedding sum x at that position (128 components), normalized by the maximum.',
    lossAt: 'Loss being differentiated',
    largest: 'Input positions with the largest gradient norms',
    future: 'Gradients to positions after t',
    zero: 'all 0',
    position: 'Position',
    tyingCaption:
      'Gradient norm reaching each row of the shared weight wte.weight',
    tyingNote:
      'The upper half shows gradients through its use as lm_head, the lower half through its use as the embedding. The horizontal axis lists the 65 vocabulary characters; characters present in the 64 input characters are drawn darker. The vertical axis is logarithmic.',
    outputPath: 'Output path (lm_head)',
    inputPath: 'Input path (embedding)',
    rowsInInput: 'Characters present in the input',
    normsCaption:
      'Gradient norms during training (per parameter, before clipping)',
    normsNote:
      'Values recorded right after backward at each update in chapter 11’s training run. The horizontal axis is logarithmic.',
    iteration: 'Update {n}',
    parameter: 'Parameter',
    noScript: 'With JavaScript disabled, the initial values are shown.',
  },
} as const;

// Short labels for named_parameters() of the chapter 11 model.
export const parameterLabel = (name: string) =>
  name
    .replace('transformer.', '')
    .replace(/^h\.(\d+)\./, 'L$1 ')
    .replace('.weight', '');
