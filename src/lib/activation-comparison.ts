import { gelu } from './residual';

export const activationValues = (x: number) => ({
  gelu: gelu(x),
  reluSquared: Math.max(0, x) ** 2,
});

export const activationViews = {
  full: {
    xDomain: [-3, 3] as [number, number],
    yDomain: [-0.5, 9.5] as [number, number],
    xTicks: [-3, -2, -1, 0, 1, 2, 3],
    yTicks: [0, 3, 6, 9],
  },
  near: {
    xDomain: [-1, 1] as [number, number],
    yDomain: [-0.25, 1.1] as [number, number],
    xTicks: [-1, -0.5, 0, 0.5, 1],
    yTicks: [-0.2, 0, 0.5, 1],
  },
};

export const activationPlot = {
  width: 480,
  height: 320,
  left: 48,
  right: 458,
  top: 28,
  bottom: 275,
};

export const activationUi = {
  ja: {
    caption: 'GELU と ReLU² の比較',
    view: '表示範囲',
    views: { full: '全体（−3〜3）', near: '0 付近（−1〜1）' },
    input: '入力 x',
    output: '出力 f(x)',
    note: '関数の式から描いた曲線です。GELU(x) = xΦ(x)、ReLU²(x) = max(0, x)²。Φ は標準正規分布の累積分布関数です。',
  },
  en: {
    caption: 'Comparing GELU and ReLU²',
    view: 'View range',
    views: { full: 'Full (−3 to 3)', near: 'Near zero (−1 to 1)' },
    input: 'Input x',
    output: 'Output f(x)',
    note: 'Curves calculated from the functions: GELU(x) = xΦ(x), ReLU²(x) = max(0, x)². Φ is the standard normal cumulative distribution function.',
  },
} as const;
