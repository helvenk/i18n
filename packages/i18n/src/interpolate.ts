import React, { isValidElement } from 'react';
import { Payload } from './context';
import { isEmpty, memoize } from './utils';

export const INCLUDES_VARIABLE_REGEXP = /%(\S+?)%/g;

export type Interpolate<T = any> = (
  message: string,
  payload?: Payload<T>,
) => T extends string ? string : T;

type Part = { name?: string; value: string };

function getParts(message: string, varReg: RegExp): Part[] {
  const result = message.matchAll(varReg);
  const matches = Array.from(result);

  const parts: Part[] = [];

  let lastIndex = 0;

  for (const match of matches) {
    const { index = 0, input = '' } = match;
    const [origin, varName] = match;

    parts.push({ value: input.slice(lastIndex, index) });
    parts.push({ name: varName, value: origin });

    lastIndex = index + origin.length;
  }

  if (lastIndex !== message.length) {
    parts.push({ value: message.slice(lastIndex) });
  }

  return parts;
}

export function createInterpolator(varReg = INCLUDES_VARIABLE_REGEXP) {
  const parseParts = memoize((message: string) => getParts(message, varReg));

  const interpolate: Interpolate = (message, payload) => {
    if (isEmpty(payload)) {
      return message;
    }

    const parts = parseParts(message);

    const values = parts.map(({ name, value }) =>
      name ? payload[name] ?? value : value,
    );

    if (values.length <= 1) {
      return values[0] ?? '';
    }

    if (Object.values(payload).some(isValidElement)) {
      return React.Children.toArray(values);
    }

    return values.join('');
  };

  return interpolate;
}

export const defaultInterpolate = createInterpolator();
