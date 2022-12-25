import { I18nContextType, Locales, SetLang } from './context';
import { defaultInterpolate, Interpolate } from './interpolate';
import { omitKeys } from './utils';

export interface I18nInstance<T extends Locales> extends I18nContextType<T> {
  subscribe: (listener: SetLang<T>) => void;
  context: () => I18nContextType<T>;
  clone: () => I18nInstance<T>;
}

export interface I18nParams<T extends Locales> {
  lang?: I18nContextType<T>['lang'];
  locales?: I18nContextType<T>['locales'];
  interpolate?: Interpolate;
}

export function createI18n<T extends Locales>({
  lang,
  locales,
  interpolate = defaultInterpolate,
}: I18nParams<T> = {}) {
  const hooks = new Set<I18nInstance<T>['setLang']>();

  const i18n: I18nInstance<T> = {
    lang,
    locales,
    setLang: (lang, locale) => {
      const { locales } = i18n;
      const nextLocale = { ...locales?.[lang as string], ...locale };

      i18n.lang = lang;
      i18n.locales = { ...locales, [lang as string]: nextLocale } as T;

      hooks.forEach((listener) => listener?.(lang, locale));
    },
    t: (message, payload) => {
      const { lang, locales } = i18n;

      const translationSet = locales?.[lang as string];
      const translatedText = translationSet?.[message as string] || message;

      return interpolate(translatedText as string, payload);
    },
    subscribe: (listener) => {
      hooks.add(listener);

      return () => {
        hooks.delete(listener);
      };
    },
    clone: () => {
      return { ...i18n };
    },
    context: () => {
      return omitKeys(i18n, ['subscribe', 'clone', 'context']);
    },
  };

  return i18n;
}
