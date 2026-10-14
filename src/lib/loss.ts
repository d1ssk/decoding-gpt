// Shared colour scale for per-character losses (natural log units).
export const lossColor = (loss: number) => {
  const alpha = Math.min(loss / 5, 1) * 0.75;
  return `rgba(160, 90, 32, ${alpha.toFixed(3)})`;
};

export const lossUi = {
  ja: {
    toyCaption: '概念図：logits を動かして softmax と損失を見る',
    toyNote:
      '5 種類のトークンからなる説明用の例です。スライダーで各 logit を変え、正解のトークンを選んでください。',
    logit: 'logit',
    target: '正解',
    prob: '確率 p',
    loss: '損失 −log p(正解)',
    gradient: '勾配 p − y',
    gradientNote:
      '勾配の棒は、正解のトークンでは負（logit を上げる向き）、それ以外では正（logit を下げる向き）です。',
    stripCaption: '学習済みモデルが各文字に割り当てた損失',
    stripNote:
      '各文字の背景は、その文字を直前までの文字から予測したときの損失 −log p です。文字を選ぶと、そのときの予測の上位 5 候補を表示します。',
    snapshot: '学習の段階',
    iteration: '更新 {n} 回後',
    meanLoss: 'この 64 文字の平均損失',
    valLoss: '検証データ 200 本の平均損失',
    uniform: '一様分布の損失 ln 65',
    selected: '予測する文字',
    context: '直前の文字',
    top: '上位 5 候補',
    position: '位置',
    noScript:
      'JavaScript が無効な場合は、更新 2,000 回後の位置 57 の予測を表示します。',
  },
  en: {
    toyCaption:
      'Conceptual diagram: change logits and watch softmax and the loss',
    toyNote:
      'An illustrative example with five tokens. Move the sliders to change each logit and choose the target token.',
    logit: 'logit',
    target: 'Target',
    prob: 'Probability p',
    loss: 'Loss −log p(target)',
    gradient: 'Gradient p − y',
    gradientNote:
      'The gradient bar is negative for the target (pushing its logit up) and positive for every other token (pushing their logits down).',
    stripCaption: 'Loss the trained model assigns to each character',
    stripNote:
      'Each character’s background shows the loss −log p of predicting it from the preceding characters. Select a character to show the top 5 candidates of that prediction.',
    snapshot: 'Training stage',
    iteration: 'After {n} updates',
    meanLoss: 'Mean loss over these 64 characters',
    valLoss: 'Mean loss over 200 validation windows',
    uniform: 'Loss of a uniform distribution, ln 65',
    selected: 'Character to predict',
    context: 'Preceding character',
    top: 'Top 5 candidates',
    position: 'Position',
    noScript:
      'With JavaScript disabled, the prediction at position 57 after 2,000 updates is shown.',
  },
} as const;
