import { createElement, ReactHTML } from 'react';
import { Literal, Locale, Payload } from './context';
import { useTranslation } from './useTranslation';

export interface TransProps<T extends Locale> extends Payload {
  as?: keyof ReactHTML;
  message?: Literal<T>;
  children?: Literal<T>;
}

export function Trans<T extends Locale = Locale>({
  as = 'span',
  message,
  children = message,
  ...props
}: TransProps<T>) {
  const { t } = useTranslation();

  if (typeof children !== 'string') {
    throw new Error('message or children must be string in Trans');
  }

  return createElement(
    as,
    { style: { whiteSpace: 'pre-line' } },
    t(children, props),
  );
}
