import { declare } from '@babel/helper-plugin-utils';
import fs from 'fs';
import path from 'path';

let FuncName = 't';

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}
let BabelPluginI18n = declare(function (_ref, options, dirname) {
  let t = _ref.types;
  let _options$output = options.output,
    output = _options$output === void 0 ? './locales' : _options$output;
  let dir = path.resolve(dirname, output);
  ensureDirSync(dir);
  console.log('enter plugin');
  return {
    pre: function pre(file) {
      let sourceFileName = file.opts.sourceFileName;
      console.log('filename', sourceFileName);
      if (
        sourceFileName !== null &&
        sourceFileName !== void 0 &&
        sourceFileName.includes('node_modules')
      ) {
        this.set('skip', true);
      }
    },
    visitor: {
      Program: function Program(path, state) {
        console.log('enter program');
        if (state.get('skip')) {
          console.log('skip program');
          path.skip();
        }
      },
      CallExpression: function CallExpression(path) {
        // if (shouldSkip) {
        //   return;
        // }

        console.log('enter call');
        let firstArg = path.node.arguments.at(0);
        if (
          path.get('callee').isIdentifier({
            name: FuncName,
          }) &&
          firstArg
        ) {
          if (t.isStringLiteral(firstArg) && firstArg.value) {
          }
        }
      },
    },
  };
});
export default BabelPluginI18n;
