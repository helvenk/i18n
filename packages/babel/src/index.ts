import { declare } from '@babel/helper-plugin-utils';
import path from 'path';
import { Adapter, createHelpers, Format, getAdapter } from './utils';

export * from './utils';

const EXCLUDE_PATH = 'node_modules';

export type Options = {
  /** strict match with package name, default to `true` */
  strict?: boolean;
  /** supported languages */
  langs?: string[];
  /** locales output path, default to `./locales` */
  output?: string;
  /** locale output format */
  format?: Format;
  /** auto translate messages */
  translator?: 'google';
  /** extract options */
  extract?: {
    /** extracted package or module name, default to `@helven/i18n` */
    package?: string;
    /** extracted instance name, default to `i18n` */
    instance?: string;
    /** extracted translate hook name, default to `useTranslation` */
    hook?: string;
    /** extracted translate function name, default to `t` */
    function?: string;
    /** extracted translate component name, default to `Trans` */
    component?: string;
  };
  /** adapter to read and write json file */
  adapter?: Adapter;
};

declare module '@babel/core' {
  interface PluginPass {
    cache: {
      messages: any[];
      targets: Required<NonNullable<Options['extract']>>;
      targetFunction: string;
      shouldSkip: boolean;
    };
  }
}

declare module '@babel/types' {
  interface BlockStatement {
    targetFunction: string;
  }
}

// TODO: extract with scope
const BabelPluginI18n = declare((babel, options: Options, dirname) => {
  const {
    strict = true,
    langs = [],
    output = './locales',
    format,
    adapter = getAdapter(format),
    // TODO: auto translate messages
    // translator,
  } = options;

  const extract = {
    package: '@helven/i18n',
    instance: 'i18n',
    hook: 'useTranslation',
    function: 't',
    component: 'Trans',
    ...options.extract,
  };

  const distination = path.resolve(dirname, output);

  const {
    t,
    isImportModule,
    isCall,
    isMemberCall,
    isComponent,
    getImportName,
    getPropertyName,
    getStringValue,
    getJSXAttrValue,
  } = createHelpers(babel);

  return {
    pre() {
      this.cache = {
        messages: [],
        targets: { ...extract },
        targetFunction: extract.function,
        shouldSkip: false,
      };

      if (this.filename?.includes(EXCLUDE_PATH)) {
        this.file.path.stop();
      }
    },
    visitor: {
      /** stop if no use target package in strict mode */
      Program(path, { cache }) {
        const { targets } = cache;

        if (
          strict &&
          !path
            .get('body')
            .some(({ node }) => isImportModule(node, targets.package))
        ) {
          // cannot use `path.skip()` directly, may cause building error
          // why?
          cache.shouldSkip = true;
        }
      },
      /**
       * process alias import in strict mode
       *
       * @example
       * import { useTranslation as useT, Trans as Translate } from '@helven/i18n'
       * import { useTranslation as useT } from '@helven/i18n'
       * import { Trans as Translate } from '@helven/i18n'
       */
      ImportDeclaration({ node }, { cache }) {
        const { targets, shouldSkip } = cache;

        if (shouldSkip) {
          return;
        }

        if (strict && isImportModule(node, targets.package)) {
          targets.hook = getImportName(node.specifiers, targets.hook);
          targets.component = getImportName(node.specifiers, targets.component);
        }
      },
      /**
       * process block scope, restore `targetFunction`
       *
       * @example
       * {
       *   const { t: t1 } = useTranslate();
       * }
       */
      BlockStatement: {
        enter(path, { cache }) {
          path.node.targetFunction = cache.targetFunction;
        },
        exit(path, { cache }) {
          cache.targetFunction = path.node.targetFunction;
        },
      },
      /**
       * process object pattern
       *
       * @example
       * const { t } = useTranslate()
       * const { t: translate } = useTranslate()
       */
      VariableDeclarator({ node }, { cache }) {
        if (cache.shouldSkip) {
          return;
        }

        if (
          isCall(node.init!, cache.targets.hook) &&
          t.isObjectPattern(node.id)
        ) {
          const properName = getPropertyName(
            node.id.properties,
            cache.targets.function,
          );
          if (properName) {
            cache.targetFunction = properName;
          }
        }
      },
      /**
       * process function call
       *
       * @example
       * t('hello') // or aliasT('hello')
       * i18n.t('hello')
       */
      CallExpression({ node }, { cache }) {
        const { shouldSkip, targets, targetFunction, messages } = cache;

        if (shouldSkip) {
          return;
        }

        if (
          isCall(node, targetFunction) ||
          isMemberCall(node, targets.instance, targets.function)
        ) {
          const value = getStringValue(node.arguments[0]);
          messages.push(value);
        }
      },
      /**
       * process JSX
       *
       * @example
       * <Trans>hello</Trans>
       * <Trans>{'hello'}</Trans>
       * <Trans message="hello" />
       * <Trans message={"hello"} />
       */
      JSXElement({ node }, { cache }) {
        const { shouldSkip, targets, messages } = cache;

        if (shouldSkip) {
          return;
        }

        if (isComponent(node, targets.component)) {
          const attrs = node.openingElement.attributes;
          const value =
            getStringValue(node.children) ??
            getStringValue(getJSXAttrValue(attrs, 'message'));
          messages.push(value);
        }
      },
    },
    post() {
      const { messages } = this.cache;

      if (messages.length === 0) {
        return;
      }

      for (const lang of langs) {
        const file = path.resolve(distination, lang + '.json');
        const source = adapter.read(file);
        const locales = adapter.merge(source, messages);
        if (locales) {
          adapter.write(file, locales);
        }
      }
    },
  };
});

export default BabelPluginI18n;
