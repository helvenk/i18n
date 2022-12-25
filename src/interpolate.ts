import { Locale, Translate } from './context';
import { isEmpty, memoize, replaceText } from './utils';

export const INCLUDES_VARIABLE_REGEXP = /%(\S+?)%/g;

export type Interpolate = Translate<Locale>;

export function createInterpolator(varReg = INCLUDES_VARIABLE_REGEXP) {
  const parseMatches = memoize((message: string) => {
    const matches = message.matchAll(varReg);
    return Array.from(matches);
  });

  const interpolate: Interpolate = (message, payload) => {
    if (isEmpty(payload)) {
      return message as string;
    }

    const matches = parseMatches(message as string);
    const replacers = matches.map(
      ([origin, varName]) => [origin, payload[varName]] as [string, any],
    );
    return replaceText(message as string, replacers);
  };

  return interpolate;
}

export const defaultInterpolate = createInterpolator();
