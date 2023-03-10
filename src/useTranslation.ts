import { useContext } from 'react';
import { I18nContext, I18nContextType, Locales } from './context';
import { I18nProvider } from './Provider';

export function useTranslation<T extends Locales = Locales>() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error(
      `could not find ${I18nContext.displayName},` +
        ` please ensure the component is wrapped in an <${I18nProvider.name}>`,
    );
  }

  return context as I18nContextType<T>;
}
