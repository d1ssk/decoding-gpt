export const headColors = [
  '#1e5b49',
  '#a05a20',
  '#276b92',
  '#7a4d8c',
  '#5d6b1e',
  '#9b3d4a',
  '#3d6f6b',
  '#6b5a2e',
];

// Shapes along CausalSelfAttention.forward() for B = 12, T = 64.
export const headShapes = (H: number, C: number) => {
  const d = C / H;
  return [
    ['c_attn(x)', [12, 64, 3 * C]],
    ['q = split(...)[0]', [12, 64, C]],
    ['q.view(B, T, H, d)', [12, 64, H, d]],
    ['q.transpose(1, 2)', [12, H, 64, d]],
    ['att = softmax(q @ kᵀ)', [12, H, 64, 64]],
    ['y = att @ v', [12, H, 64, d]],
    ['y.transpose(1, 2).view', [12, 64, C]],
    ['c_proj(y)', [12, 64, C]],
  ]
    .map(
      ([label, shape]) =>
        `${String(label).padEnd(26)}[${(shape as number[]).join(', ')}]`,
    )
    .join('\n');
};

export const headSplitUi = {
  ja: {
    caption: 'head 数を変えて、成分の分け方と形状を比べる',
    heads: 'head 数 H',
    strip: '位置 t の query ベクトル（C = 128 成分）を head ごとに色分け',
    perHead: 'head ごとの成分数 d = C / H',
    scale: 'スコアのスケール 1/√d',
    params: 'attention の重みの要素数（c_attn + c_proj）',
    note: '数値は第 11 章で学習するモデルの構成（B = 12、T = 64、C = 128）です。H を変えても重みの要素数は変わりません。',
  },
  en: {
    caption:
      'Change the number of heads and compare the component split and shapes',
    heads: 'Number of heads H',
    strip: 'Query vector at position t (C = 128 components), colored by head',
    perHead: 'Components per head d = C / H',
    scale: 'Score scale 1/√d',
    params: 'Attention weight elements (c_attn + c_proj)',
    note: 'Numbers use the configuration of the model trained in chapter 11 (B = 12, T = 64, C = 128). Changing H leaves the number of weight elements unchanged.',
  },
} as const;

export const attentionHeadsUi = {
  ja: {
    caption: '学習済みモデルの参照の重みを head ごとに見る',
    layer: '層',
    head: 'head',
    instruction:
      '文字を選ぶと、その位置の出力を計算する際の重み（行）を表示します。背景が濃い文字ほど大きな重みで参照しています。',
    heatmap:
      '参照の重み att[0, h, t, j]（行 t：情報を集める位置、列 j：参照先）',
    selected: '選択位置',
    weightsTo: '主な参照先',
    meanDistance: '平均参照距離',
    selfWeight: '自分自身への重み',
    previousWeight: '直前の位置への重み',
    ablation: 'この head を 0 にしたときの損失の増加',
    allHeads: '全 head の統計を表示',
    statsNote:
      '統計と損失は、検証データから固定 seed で選んだ 200 本（各 64 文字）の平均です。基準の損失は',
    noScript:
      'JavaScript が無効な場合は、層 1・head 3 の位置 61 の重みを表示します。',
    position: '位置',
  },
  en: {
    caption: 'Inspect attention weights for each head in the trained model',
    layer: 'Layer',
    head: 'Head',
    instruction:
      'Select a character to show the weights (one row) used to compute the output at that position. Darker backgrounds mark larger weights.',
    heatmap:
      'Attention weights att[0, h, t, j] (row t: position gathering information, column j: source)',
    selected: 'Selected position',
    weightsTo: 'Largest weights',
    meanDistance: 'Mean attention distance',
    selfWeight: 'Weight on itself',
    previousWeight: 'Weight on the previous position',
    ablation: 'Loss increase when this head is zeroed',
    allHeads: 'Show statistics for all heads',
    statsNote:
      'Statistics and losses average 200 validation windows of 64 characters chosen with a fixed seed. The baseline loss is',
    noScript:
      'With JavaScript disabled, weights for layer 1, head 3 at position 61 are shown.',
    position: 'Position',
  },
} as const;
