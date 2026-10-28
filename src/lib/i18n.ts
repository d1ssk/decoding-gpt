import type { Language } from './site';

export const ui = {
  ja: {
    siteTitle: 'GPTを読み解く',
    siteSubtitle: 'nanoGPT / nanochat をコード・実験・可視化から理解する',
    homeIntroduction:
      '大規模言語モデル（LLM）は、大量のテキストデータから言語の統計的なパターンを学習し、与えられた文脈に続く次のトークンの確率分布を予測するモデルです。ChatGPT のような生成 AI も、基本的にはこの仕組みの上で動いています。',
    homeVideoBefore: '最初に全体像をつかむためには、',
    homeVideoLink: '3Blue1Brown のニューラルネットワークの動画シリーズ',
    homeVideoAfter:
      'がおすすめです。視覚的にわかりやすいので、コードを読んでいて迷ったときに見返すのにも向いています。',
    homeRepositoriesBefore: '実装を読む題材には、Andrej Karpathy の ',
    homeNanoGptAfter: ' と ',
    homeNanoChatAfter:
      ' を使います。まず nanoGPT で GPT の基本を追い、そのあと nanochat でトークナイザ、事前学習、ファインチューニング、評価、推論まで見ていきます。',
    homeReadingPlan:
      'このサイトは、コードを読んだり動かしたりしながら、LLM の仕組みを理解していくための学習ノートです。必要に応じて、小さな実験や可視化も入れていきます。',
    home: 'ホーム',
    navigation: 'メインナビゲーション',
    breadcrumbs: 'パンくずリスト',
    articleNavigation: '記事ナビゲーション',
    learningSections: '学習セクション',
    skipToContent: '本文へ移動',
    chooseLanguage: '言語を選択',
    currentLanguage: '日本語',
    otherLanguage: 'English',
    languageSwitcher: '言語を切り替える',
    nanoGptStatus: '第1部',
    planned: '今後公開',
    readOverview: '概要を読む',
    viewSection: 'セクションを見る',
    nanoGptLead:
      '小さく見通しのよい実装を通して、GPT の計算と学習を一つずつ追います。',
    nanoChatLead:
      'nanoGPT の理解を土台に、現代的な LLM のより完全なパイプラインへ進みます。',
    nanoChatStatus: '第2部 — nanoGPT のあとに続きます',
    nanoChatOverviewTitle: 'nanochat へ',
    nanoChatOverviewBody:
      'nanoGPT で Transformer の核心を読み解いたあと、トークナイザ、事後学習、評価、推論までを含む、より完全な言語モデル開発の流れへ進みます。',
    nanoChatChaptersLead: '概要と、これから扱うセクションの予定です。',
    nanoChatPlannedSections: ['トークナイザ', '事後学習', '評価', '推論'],
    overview: '概要',
    chapters: '学習の流れ',
    onThisPage: 'このページの内容',
    allNanoGptArticles: 'nanoGPT の全記事',
    previous: '前へ',
    next: '次へ',
    sourceMetadata: 'ソース情報',
    repository: '参照元リポジトリ',
    commit: 'コミット',
    sourceFiles: '参照ファイル',
    experimentId: '実験 ID',
    sourcePending: '参照元リポジトリのコミットは未指定です。',
    series: 'シリーズ',
    conceptualFigure: '概念図',
    conceptualFigureNote: 'この図は処理の流れを整理した概念図です。',
    noPrevious: 'このシリーズの最初の記事です',
    noNext: '次の記事は準備中です',
  },
  en: {
    siteTitle: 'Decoding GPT',
    siteSubtitle:
      'Understanding nanoGPT / nanochat through code, experiments, and visualization',
    homeIntroduction:
      'Large language models (LLMs) learn statistical patterns in language from large amounts of text and predict a probability distribution over the next token given the preceding context. Generative AI such as ChatGPT is also fundamentally built on this mechanism.',
    homeVideoBefore: 'To get an initial overview, I recommend ',
    homeVideoLink: '3Blue1Brown’s neural networks video series',
    homeVideoAfter:
      '. Its clear visual explanations also make it useful to revisit when you get stuck reading the code.',
    homeRepositoriesBefore:
      'For implementation examples, we will study Andrej Karpathy’s ',
    homeNanoGptAfter: ' and ',
    homeNanoChatAfter:
      '. We will first follow the basics of GPT in nanoGPT, then explore tokenization, pretraining, fine-tuning, evaluation, and inference in nanochat.',
    homeReadingPlan:
      'This site is a collection of study notes for understanding how LLMs work by reading and running code. Small experiments and visualizations will be included where useful.',
    home: 'Home',
    navigation: 'Main navigation',
    breadcrumbs: 'Breadcrumbs',
    articleNavigation: 'Article navigation',
    learningSections: 'Learning sections',
    skipToContent: 'Skip to content',
    chooseLanguage: 'Choose a language',
    currentLanguage: 'English',
    otherLanguage: '日本語',
    languageSwitcher: 'Switch language',
    nanoGptStatus: 'Part one',
    planned: 'Planned',
    readOverview: 'Read the overview',
    viewSection: 'View section',
    nanoGptLead:
      'Follow GPT computation and training step by step through a small, easy-to-follow implementation.',
    nanoChatLead:
      'Build on nanoGPT to explore a more complete, modern LLM pipeline.',
    nanoChatStatus: 'Part two — follows nanoGPT',
    nanoChatOverviewTitle: 'Toward nanochat',
    nanoChatOverviewBody:
      'After decoding the Transformer core through nanoGPT, this part will move into a more complete language-model pipeline: tokenization, post-training, evaluation, and inference.',
    nanoChatChaptersLead:
      'The overview and the sections planned for this series.',
    nanoChatPlannedSections: [
      'Tokenization',
      'Post-training',
      'Evaluation',
      'Inference',
    ],
    overview: 'Overview',
    chapters: 'Learning path',
    onThisPage: 'On this page',
    allNanoGptArticles: 'All nanoGPT articles',
    previous: 'Previous',
    next: 'Next',
    sourceMetadata: 'Source metadata',
    repository: 'Source repository',
    commit: 'Commit',
    sourceFiles: 'Source files',
    experimentId: 'Experiment ID',
    sourcePending: 'Source repository commit: unspecified.',
    series: 'Series',
    conceptualFigure: 'Conceptual diagram',
    conceptualFigureNote:
      'This conceptual diagram outlines the computation flow.',
    noPrevious: 'This is the first article in the series',
    noNext: 'The next article is in preparation',
  },
} as const;

export function useTranslations(lang: Language) {
  return ui[lang];
}
