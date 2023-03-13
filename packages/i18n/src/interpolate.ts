import { Payload } from './context';
import { isEmpty, memoize } from './utils';

export const INCLUDES_VARIABLE_REGEXP = /%(\S+?)%/g;

export type Interpolate = (message: string, payload?: Payload) => string;

export function createInterpolator(varReg = INCLUDES_VARIABLE_REGEXP) {
  const parseMatches = memoize((message: string) => {
    const matches = message.matchAll(varReg);
    return Array.from(matches);
  });

  const interpolate: Interpolate = (message, payload) => {
    if (isEmpty(payload)) {
      return message;
    }

    const matches = parseMatches(message);
    return matches.reduce(
      (text, [origin, varName]) => text.replace(origin, payload[varName]),
      message,
    );
  };

  return interpolate;
}

export const defaultInterpolate = createInterpolator();
