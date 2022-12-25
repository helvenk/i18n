import React, { ReactNode, useEffect, useMemo } from 'react';
import { I18nContext, I18nContextType, Locales } from './context';
import { createI18n, I18nInstance, I18nParams } from './i18n';
import { useForceUpdate } from './utils';

export interface I18nProviderProps<T extends Locales> extends I18nParams<T> {
  i18n?: I18nInstance<T>;
  children?: ReactNode;
}

export function I18nProvider<T extends Locales = Locales>({
  lang,
  locales,
  interpolate,
  i18n: i18nInstance,
  children,
}: I18nProviderProps<T>) {
  const forceUpdate = useForceUpdate();

  const i18n = useMemo(() => {
    return i18nInstance ?? createI18n({ lang, locales, interpolate });
  }, []);

  useEffect(() => {
    return i18n.subscribe(forceUpdate);
  }, [i18n]);

  return (
    <I18nContext.Provider value={i18n.context() as I18nContextType}>
      {children}
    </I18nContext.Provider>
  );
}
