/* eslint-disable @typescript-eslint/no-empty-interface */
import { createContext } from 'react';

export type Literal<T> = keyof T | Omit<string, keyof T>;

export interface Locale extends Record<string, string> {}

export interface Locales extends Record<string, Locale> {}

export type Payload<T = any> = Record<string, T>;

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
