import type { Language } from './site';

export const ui = {
  ja: {
    siteTitle: 'GPTを読み解く',
    siteSubtitle: 'nanoGPT / nanochat をコード・実験・可視化から理解する',
    homeIntroduction:
      '大規模言語モデル（LLM）は、大量のテキストデータから言語の統計的なパターンを学習し、与えられた文脈に続く次のトークンの確率分布を予測するモデルです。ChatGPTのような生成AIも、基本的にはこの仕組みの上で動いています。',
    homeVideoBefore: '最初に全体像をつかむためには、',
    homeVideoLink: '3Blue1Brownのニューラルネットワークの動画シリーズ',
    homeVideoAfter:
      'がおすすめです。視覚的にわかりやすいので、コードを読んでいて迷ったときに見返すのにも向いています。',
    homeRepositoriesBefore: '実装を読む題材には、Andrej Karpathyの',
    homeNanoGptAfter: 'と',
    homeNanoChatAfter:
      'を使います。まずnanoGPTでGPTの基本を追い、そのあとnanochatでトークナイザ、事前学習、ファインチューニング、評価、推論まで見ていきます。',
    homeReadingPlan:
      'このサイトは、コードを読んだり動かしたりしながら、LLMの仕組みを理解していくための学習ノートです。必要に応じて、小さな実験や可視化も入れていきます。',
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
    startHere: 'ここから始める',
    planned: '今後公開',
    readOverview: '概要を読む',
    viewSection: 'セクションを見る',
    nanoGptTitleStart: 'nanoGPTを',
    nanoGptTitleEnd: '読み解く',
    nanoGptLead:
      '小さく見通しのよい実装を通して、GPTの計算と学習を一つずつ追います。',
    nanoChatLead:
      'nanoGPTの理解を土台に、現代的なLLMのより完全なパイプラインへ進みます。',
    nanoChatStatus: '第2部 — nanoGPTのあとに続きます',
    nanoChatOverviewTitle: 'nanochatへ',
    nanoChatOverviewBody:
      'nanoGPTで Transformer の核心を読み解いたあと、トークナイザ、事後学習、評価、推論までを含む、より完全な言語モデル開発の流れへ進みます。',
    nanoChatChaptersLead: '概要と、これから扱うセクションの予定です。',
    nanoChatPlannedSections: ['トークナイザ', '事後学習', '評価', '推論'],
    overview: '概要',
    chapters: '学習の流れ',
    onThisPage: 'このページの内容',
    previous: '前へ',
    next: '次へ',
    sourceMetadata: 'ソース情報',
    repository: 'リポジトリ',
    commit: 'コミット',
    sourceFiles: '参照ファイル',
    experimentId: '実験 ID',
    sourcePending:
      'この概要では、特定の upstream コミットにはまだ紐づけていません。',
    series: 'シリーズ',
    conceptualFigure: '概念図',
    conceptualFigureNote:
      'この図は概念的な流れを示すもので、実験結果ではありません。',
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
    startHere: 'Start here',
    planned: 'Planned',
    readOverview: 'Read the overview',
    viewSection: 'View section',
    nanoGptTitleStart: 'Decoding ',
    nanoGptTitleEnd: 'nanoGPT',
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
    previous: 'Previous',
    next: 'Next',
    sourceMetadata: 'Source metadata',
    repository: 'Repository',
    commit: 'Commit',
    sourceFiles: 'Source files',
    experimentId: 'Experiment ID',
    sourcePending:
      'This overview is not yet tied to a specific upstream commit.',
    series: 'Series',
    conceptualFigure: 'Conceptual diagram',
    conceptualFigureNote:
      'This diagram shows a conceptual flow, not an experiment result.',
    noPrevious: 'This is the first article in the series',
    noNext: 'The next article is in preparation',
  },
} as const;

export function useTranslations(lang: Language) {
  return ui[lang];
}
