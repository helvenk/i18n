import { Options } from '@helven/babel-plugin-i18n';
import type { Compiler } from 'webpack';
import { addI18nBabelPlugin, emitAssets, getBabelPlugins } from './utils';

const EXCLUDE_PATH = 'node_modules';

export type I18nPluginOptions = Omit<Options, 'adapter'>;

export default class I18nPlugin {
  options: I18nPluginOptions;

  constructor(options: I18nPluginOptions) {
    this.options = options;
  }

  apply(compiler: Compiler) {
    const pluginName = I18nPlugin.name;

    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      const cache = new Map();

      compilation.hooks.normalModuleLoader.tap(
        pluginName,
        (_, { resource, loaders }) => {
          if (resource.includes(EXCLUDE_PATH)) {
            return;
          }

          const babelPlugins = getBabelPlugins(loaders);
          if (babelPlugins) {
            addI18nBabelPlugin(babelPlugins, { ...this.options, cache });
          }
        },
      );

      compilation.hooks.afterProcessAssets.tap(pluginName, () => {
        emitAssets(cache, this.options);
      });
    });
  }
}

export function nextWithI18n({
  i18nConfig = {},
  ...nextConfig
}: { i18nConfig: I18nPluginOptions } & { [x: string]: any }) {
  return {
    ...nextConfig,
    webpack(config: any, opts: any) {
      config.plugins.push(new I18nPlugin(i18nConfig));

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, opts);
      }

      return config;
    },
  };
}
