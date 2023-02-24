import { declare } from '@babel/helper-plugin-utils';
import fs from 'fs';
import path from 'path';
import type { Locale } from '../context';

declare module '@babel/core' {
  interface PluginPass {
    messages: Set<string>;
  }
}

const TRANS_FUNC_NAME = 't';

type Options = {
  langs?: string[];
  output?: string;
  extractFunctionName?: string;
  extractMemberCall?: boolean;
};

const BabelPluginI18n = declare(({ types: t }, options: Options, dirname) => {
  const {
    langs = [],
    output = './locales',
    extractMemberCall = false,
    extractFunctionName = TRANS_FUNC_NAME,
  } = options;

  const dir = path.resolve(dirname, output);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  return {
    pre() {
      this.messages = new Set();

      if (this.filename?.includes('node_modules')) {
        this.file.path.skip();
      }
    },
    visitor: {
      CallExpression(path, state) {
        const [firstArg] = path.node.arguments;
        const callee = path.get('callee');

        const isTranslateCall =
          // t('some words')
          callee.isIdentifier({ name: extractFunctionName }) ||
          // i18n.t('some words')
          (extractMemberCall &&
            callee.isMemberExpression() &&
            callee.get('property').isIdentifier({ name: extractFunctionName }));

        if (isTranslateCall && t.isStringLiteral(firstArg) && firstArg.value) {
          state.messages.add(firstArg.value);
        }
      },
    },
    post() {
      if (this.messages.size === 0) {
        return;
      }

      for (const lang of langs) {
        const filename = path.join(dir, lang + '.json');

        let sourceLocale: Locale = {};

        if (fs.existsSync(filename)) {
          try {
            sourceLocale = JSON.parse(fs.readFileSync(filename, 'utf-8'));
          } catch (err) {
            throw new Error(`${lang}.json is invalid json format`);
          }
        }

        this.messages.forEach((key) => {
          if (!sourceLocale[key]) {
            sourceLocale[key] = key;
          }
        });

        fs.writeFileSync(filename, JSON.stringify(sourceLocale, null, 2));
      }
    },
  };
});
export default BabelPluginI18n;
