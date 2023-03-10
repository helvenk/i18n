import React, { ReactNode, useEffect, useMemo } from 'react';
import { I18nContext, Locales } from './context';
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
  i18n,
  children,
}: I18nProviderProps<T>) {
  const forceUpdate = useForceUpdate();

  const instance = useMemo(() => {
    return i18n ?? createI18n({ lang, locales, interpolate });
  }, [i18n]);

  useEffect(() => {
    return instance.subscribe(forceUpdate);
  }, [instance]);

  return (
    <I18nContext.Provider value={instance.context() as any}>
      {children}
    </I18nContext.Provider>
  );
}
