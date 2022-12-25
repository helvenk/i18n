import { createContext } from 'react';

type Literal<T> = keyof T | Omit<string, keyof T>;

export type Locale = Record<string, string>;

export type Locales = Record<string, Locale>;

export type Payload = Record<string, any>;

export type Translate<T extends Locale> = (
  message: Literal<T>,
  payload?: Payload,
) => string;

export type SetLang<T extends Locales> = (
  lang: Literal<T>,
  locale?: T[keyof T],
) => void;

export interface I18nContextType<T extends Locales = Locales> {
  lang?: Literal<T>;
  locales?: T;
  setLang: SetLang<T>;
  t: Translate<T[keyof T]>;
}

export const I18nContext = createContext<I18nContextType<Locales> | undefined>(
  undefined,
);
