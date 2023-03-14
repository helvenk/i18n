import { defaultAdapter, Locale, Options } from '@helven/babel-plugin-i18n';
import type { NormalModule } from 'webpack';

const BABEL_LOADER = 'babel-loader';
const BABEL_PLUGIN_I18N = '@helven/i18n';

export function getBabelPlugins(loaders: NormalModule['loaders']) {
  const babelLoader = loaders.find((o) => o.loader.includes(BABEL_LOADER));
  if (!babelLoader) {
    return;
  }

  if (!babelLoader.options) {
    babelLoader.options = {};
  }

  if (!babelLoader.options.plugins) {
    babelLoader.options.plugins = [];
  }

  return babelLoader.options.plugins as Array<any>;
}

export function isI18nBabelPlugin(plugin: any) {
  if (Array.isArray(plugin)) {
    return plugin[0] === BABEL_PLUGIN_I18N;
  }

  return plugin === BABEL_PLUGIN_I18N;
}

export function getAdapter(cache: Map<string, Locale>): Options['adapter'] {
  return {
    read() {
      return {};
    },
    write(file, data) {
      const source = cache.get(file) || {};
      cache.set(file, { ...source, ...data });
    },
    merge(source, messages) {
      return defaultAdapter.merge(source, messages);
    },
  };
}

export function addI18nBabelPlugin(
  babelPlugins: any[],
  { cache, ...options }: Options & { cache: Map<string, any> },
) {
  if (!babelPlugins.some(isI18nBabelPlugin)) {
    babelPlugins.push([
      BABEL_PLUGIN_I18N,
      { ...options, adapter: getAdapter(cache) },
    ]);
  }
}

export function emitAssets(cache: Map<string, Locale>) {
  cache.forEach((data, file) => {
    const source = defaultAdapter.read(file);
    const locale = defaultAdapter.merge(source, data);
    if (locale) {
      defaultAdapter.write(file, locale);
    }
  });
}
