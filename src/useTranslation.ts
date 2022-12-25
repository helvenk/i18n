import { useContext } from 'react';
import { I18nContext } from './context';
import { I18nProvider } from './Provider';

export function useTranslation() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error(
      `could not find ${I18nContext.displayName},` +
        ` please ensure the component is wrapped in an <${I18nProvider.name}>`,
    );
  }

  return context;
}
