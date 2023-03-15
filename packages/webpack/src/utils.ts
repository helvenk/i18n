import {
  Adapter,
  Format,
  getAdapter,
  Locale,
  Options,
} from '@helven/babel-plugin-i18n';
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

export function getPluginAdapter(
  format: Format | undefined,
  cache: Map<string, Locale>,
): Adapter {
  const adapter = getAdapter(format);

  return {
    read() {
      return {};
    },
    write(file, data) {
      const source = cache.get(file) || {};
      cache.set(file, { ...source, ...data });
    },
    merge(source, messages) {
      return adapter.merge(source, messages);
    },
  };
}

export function addI18nBabelPlugin(
  babelPlugins: any[],
  { cache, format, ...options }: Options & { cache: Map<string, any> },
) {
  if (!babelPlugins.some(isI18nBabelPlugin)) {
    babelPlugins.push([
      BABEL_PLUGIN_I18N,
      { ...options, format, adapter: getPluginAdapter(format, cache) },
    ]);
  }
}

export function emitAssets(cache: Map<string, Locale>, { format }: Options) {
  const adapter = getAdapter(format);

  cache.forEach((data, file) => {
    const source = adapter.read(file);
    const locale = adapter.merge(source, Object.keys(data));
    if (locale) {
      adapter.write(file, locale);
    }
  });
}
