export const tokenizationUi = {
  ja: {
    input: '入力テキスト',
    hint: '半角の英字（大文字・小文字）、空白、改行などを使えます。最大 500 文字。',
    sequence: 'token ID の整数列（入力順）',
    count: 'トークン数',
    unknown: '語彙にない文字が含まれるため変換できません：',
    unavailable: '変換できません',
    empty: '空の入力は空の ID 列になります。',
    reset: '入力を戻す',
    noScript: 'JavaScript が無効な場合は、保存済みの計算例を表示します。',
  },
  en: {
    input: 'Input text',
    hint: 'Use uppercase and lowercase English letters, spaces, and newlines. Maximum 500 characters.',
    sequence: 'Token IDs (in input order)',
    count: 'Token count',
    unknown: 'Cannot encode characters outside the vocabulary:',
    unavailable: 'Cannot encode',
    empty: 'Empty input produces an empty ID sequence.',
    reset: 'Reset input',
    noScript: 'With JavaScript disabled, the saved computation is shown.',
  },
} as const;
