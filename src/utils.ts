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

export function useForceUpdate() {
  const [, setState] = useState({});
  return () => setState({});
}
