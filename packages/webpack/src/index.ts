import { Compiler } from 'webpack';

function I18nWebpackPlugin() {
  return {
    apply(compiler: Compiler) {
      compiler.hooks.done.tap(I18nWebpackPlugin.name, () => {
        console.log('I18nWebpackPlugin Done.');
      });
    },
  };
}

export default I18nWebpackPlugin;
