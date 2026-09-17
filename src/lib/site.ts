export const languages = ['ja', 'en'] as const;
export type Language = (typeof languages)[number];
export type Series = 'nanogpt' | 'nanochat';

export const isLanguage = (value: string | undefined): value is Language =>
  languages.includes(value as Language);

export function sitePath(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalized = path.replace(/^\//, '');
  return normalized ? `${base}/${normalized}` : `${base}/`;
}

export function localizedPath(lang: Language, path = ''): string {
  return sitePath(`${lang}/${path}`);
}
