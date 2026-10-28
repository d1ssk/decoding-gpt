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
    tyingCaption: '1 文字の重みに対する勾配を、入力側と出力側で比べる',
    tyingNote:
      '棒の長さは、その文字の重み 1 行に対する勾配の大きさ（ノルム）です。入力側と出力側を同じ目盛りで表示しています。',
    tyingCharacter: '比べる文字',
    tyingCharacterHint:
      '文字を選択（太字は入力に含まれる文字、␣ は空白、\\n は改行）',
    tyingSelected:
      '「{char}」は、入力の {total} 文字中に {count} 回登場します。',
    tyingPresentExplanation:
      '入力側では埋め込みとして使い、出力側では予測候補として使うため、両方の計算から勾配が求まります。',
    tyingAbsentExplanation:
      '入力側ではこの文字の埋め込みを使わないため、勾配は 0 です。出力側では予測候補として使うため、勾配があります。',
    inputPath: '入力側',
    outputPath: '出力側',
    tyingInputUse: '埋め込みとして使う',
    tyingOutputUse: '予測候補として使う',
    tyingAxis: '勾配の大きさ（ノルム）',
    tyingOverview:
      '勾配が 0 以外の文字：入力側 {input} / {total} 文字、出力側 {output} / {total} 文字。',
    tyingSumNote:
      '足し合わせるのは、各行の 128 個の勾配です。ここで表示した 2 つの大きさを足しても、共有した重みの勾配の大きさにはなりません。',
    tyingAllRows: '全 65 文字の値を見る',
    tyingRow: '文字（重みの 1 行）',
    tyingOccurrences: '入力中の回数',
    tyingNormDefinition: 'ノルムの計算方法',
    tyingNormExplanation:
      '1 行には 128 個の重みがあり、それぞれに勾配があります。その 128 個の勾配をそれぞれ 2 乗し、合計の平方根を取った値をノルムと呼びます。大きさをまとめた値なので、各勾配の正負は表示されません。',
    tyingSpace: '空白',
    tyingNewline: '改行',
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
      'Compare input-side and output-side gradients for one character’s weights',
    tyingNote:
      'Bar length shows the gradient magnitude (norm) for that character’s weight row. Both sides use the same scale.',
    tyingCharacter: 'Character to compare',
    tyingCharacterHint:
      'Select a character (bold: present in the input; ␣: space; \\n: newline).',
    tyingSelected:
      'Occurrences of “{char}” in the {total}-character input: {count}.',
    tyingPresentExplanation:
      'This character is used both as an input embedding and as a prediction candidate, so both computations contribute gradients.',
    tyingAbsentExplanation:
      'This character’s embedding is unused on the input side, so its gradient is 0. It is still a prediction candidate on the output side, which contributes a gradient.',
    inputPath: 'Input side',
    outputPath: 'Output side',
    tyingInputUse: 'Used as an embedding',
    tyingOutputUse: 'Used as a prediction candidate',
    tyingAxis: 'Gradient magnitude (norm)',
    tyingOverview:
      'Characters with nonzero gradients: input side {input} / {total}, output side {output} / {total}.',
    tyingSumNote:
      'The quantities added are the 128 gradient components in each row. Adding the two magnitudes displayed here does not give the magnitude of the shared weight’s gradient.',
    tyingAllRows: 'View values for all 65 characters',
    tyingRow: 'Character (one weight row)',
    tyingOccurrences: 'Input occurrences',
    tyingNormDefinition: 'How the norm is calculated',
    tyingNormExplanation:
      'One row has 128 weights, each with its own gradient. The norm is the square root of the sum of the squares of these 128 gradients. It summarizes magnitude, so the signs of individual gradients are not shown.',
    tyingSpace: 'Space',
    tyingNewline: 'Newline',
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
