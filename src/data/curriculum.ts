import type { Language } from '../lib/site';

export interface Chapter {
  order: number;
  slug: string;
  title: Record<Language, string>;
  published: boolean;
}

export const nanoGptChapters: Chapter[] = [
  {
    order: 0,
    slug: '00-overview',
    title: { ja: '概要', en: 'Overview' },
    published: true,
  },
  {
    order: 1,
    slug: '01-text-to-tokens',
    title: { ja: 'テキストとトークン', en: 'Text and Tokens' },
    published: true,
  },
  {
    order: 2,
    slug: '02-context-and-training-examples',
    title: { ja: '学習バッチの作成', en: 'Building Training Batches' },
    published: true,
  },
  {
    order: 3,
    slug: '03-embeddings-and-position',
    title: {
      ja: 'トークンと位置の埋め込み',
      en: 'Token and Position Embeddings',
    },
    published: true,
  },
  {
    order: 4,
    slug: '04-self-attention',
    title: { ja: 'self-attention', en: 'Self-Attention' },
    published: true,
  },
  {
    order: 5,
    slug: '05-multi-head-attention',
    title: { ja: 'multi-head attention', en: 'Multi-Head Attention' },
    published: false,
  },
  {
    order: 6,
    slug: '06-mlp-and-residual-stream',
    title: { ja: 'MLP と残差ストリーム', en: 'MLP and the Residual Stream' },
    published: false,
  },
  {
    order: 7,
    slug: '07-hidden-states-to-probabilities',
    title: {
      ja: '隠れ状態から確率へ',
      en: 'From Hidden States to Probabilities',
    },
    published: false,
  },
  {
    order: 8,
    slug: '08-loss',
    title: { ja: '損失', en: 'Loss' },
    published: false,
  },
  {
    order: 9,
    slug: '09-backpropagation',
    title: { ja: '誤差逆伝播', en: 'Backpropagation' },
    published: false,
  },
  {
    order: 10,
    slug: '10-training-loop',
    title: { ja: '学習ループ', en: 'The Training Loop' },
    published: false,
  },
  {
    order: 11,
    slug: '11-train-a-tiny-gpt',
    title: { ja: '小規模な GPT を学習させる', en: 'Train a Tiny GPT' },
    published: false,
  },
  {
    order: 12,
    slug: '12-scaling-experiments',
    title: { ja: 'スケーリング実験', en: 'Scaling Experiments' },
    published: false,
  },
  {
    order: 13,
    slug: '13-from-nanogpt-to-nanochat',
    title: { ja: 'nanoGPT から nanochat へ', en: 'From nanoGPT to nanochat' },
    published: false,
  },
];
