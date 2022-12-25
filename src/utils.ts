import { useState } from 'react';

export function memoize<F extends (...args: any[]) => any>(
  fn: F,
  resolver?: (...args: any[]) => any,
) {
  const cache = new Map();

  const memoizedFn = (...args: any[]) => {
    const key = resolver?.apply(null, args) ?? args[0];

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn.apply(null, args);
    cache.set(key, result);

    return result;
  };

  return memoizedFn as F;
}

export function isEmpty(value: any): value is null | undefined {
  return (
    !value || (typeof value === 'object' && Object.keys(value).length === 0)
  );
}

export function omitKeys<T extends Record<any, any>, K extends keyof T>(
  source: T,
  keys: K[],
) {
  return Object.keys(source).reduce((value, key) => {
    if (!keys.includes(key as K)) {
      value[key as keyof Omit<T, K>] = source[key];
    }
    return value;
  }, {} as Omit<T, K>);
}

export function replaceText(
  template: string,
  replacers: [origin: string, value: any][],
) {
  return replacers.reduce(
    (text, [origin, value]) => text.replace(origin, value),
    template,
  );
}

export function useForceUpdate() {
  const [, setState] = useState({});
  return () => setState({});
}
