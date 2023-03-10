import { declare } from '@babel/helper-plugin-utils';
import fs from 'fs-extra';
import path from 'path';
import type { Locale } from '../context';

const EXCLUDE_PATH = 'node_modules';

export type Options = {
  /** strict match with package name, default to `true` */
  strict?: boolean;
  /** supported languages */
  langs?: string[];
  /** locales output path, default to `./locales` */
  output?: string;
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
};

declare module '@babel/core' {
  interface PluginPass {
    messages: Set<string | undefined>;
    targets: Required<NonNullable<Options['extract']>>;
  }
}

declare module '@babel/types' {
  interface BlockStatement {
    targets: Required<NonNullable<Options['extract']>>;
  }
}

const BabelPluginI18n = declare(({ types: t }, options: Options, dirname) => {
  const {
    strict = true,
    langs = [],
    output = './locales',
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

  // import {} from 'i18n'
  const isModule = (node: any, name: string) => {
    return (
      t.isImportDeclaration(node, { importKind: 'value' }) &&
      t.isStringLiteral(node.source, { value: name })
    );
  };

  // import { useTranslation, Trans } from 'i18n'
  const getImportName = (nodes: any[], name: string) => {
    const target = nodes.find(
      (node) =>
        t.isImportSpecifier(node) && t.isIdentifier(node.imported, { name }),
    );
    return t.isImportSpecifier(target) ? target.local.name : name;
  };

  // t()
  const isCall = (node: any, name: string) => {
    return t.isCallExpression(node) && t.isIdentifier(node.callee, { name });
  };

  // i18n.t()
  const isMemberCall = (node: any, object: string, property: string) => {
    return (
      t.isCallExpression(node) &&
      t.isMemberExpression(node.callee) &&
      t.isIdentifier(node.callee.object, { name: object }) &&
      t.isIdentifier(node.callee.property, { name: property })
    );
  };

  // <Trans></Trans>
  const isComponent = (node: any, name: string) => {
    return (
      t.isJSXElement(node) &&
      t.isJSXIdentifier(node.openingElement.name, { name })
    );
  };

  const getDeclaratorId = (nodes: any[], name: string) => {
    const declarations = nodes
      .filter((node) => t.isVariableDeclaration(node))
      .map((node) => node.declarations)
      .flat();
    return declarations.find((o) => isCall(o.init, name))?.id;
  };

  const getPropName = (nodes: any[], name: string) => {
    const target = nodes.find(
      (node) => t.isObjectProperty(node) && t.isIdentifier(node.key, { name }),
    );
    return t.isIdentifier(target?.value) ? target.value.name : name;
  };

  const getStringValue = (node: any) => {
    const target = t.isJSXExpressionContainer(node) ? node.expression : node;
    if (t.isJSXText(target) || t.isStringLiteral(target)) {
      return target.value;
    }
  };

  const getJSXAttrValue = (nodes: any[], name: string) => {
    const target = nodes.find(
      (node) =>
        t.isJSXAttribute(node) && t.isJSXIdentifier(node.name, { name }),
    );
    return target?.value;
  };

  return {
    pre() {
      this.messages = new Set();
      this.targets = { ...extract };

      if (this.filename?.includes(EXCLUDE_PATH)) {
        this.file.path.stop();
      }
    },
    visitor: {
      /** stop if no use target package in strict mode */
      Program(path, { targets }) {
        if (
          strict &&
          !path.get('body').some((node) => isModule(node, targets.package))
        ) {
          path.stop();
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
      ImportDeclaration({ node }, { targets }) {
        if (strict && isModule(node, targets.package)) {
          targets.hook = getImportName(node.specifiers, targets.hook);
          targets.component = getImportName(node.specifiers, targets.component);
        }
      },
      /**
       * process block scope alias
       *
       * @example
       * const { t: t1 } = useTranslate();
       * {
       *   const { t: t2 } = useTranslate();
       * }
       */
      BlockStatement: {
        enter({ node }, { targets }) {
          node.targets = { ...targets };

          const identifier = getDeclaratorId(node.body, targets.hook);
          if (t.isObjectPattern(identifier)) {
            targets.function = getPropName(
              identifier.properties,
              targets.function,
            );
          }
        },
        exit({ node }, state) {
          state.targets = node.targets;
        },
      },
      /**
       * process function call
       *
       * @example
       * t('hell')
       * i18n.t('hell')
       */
      CallExpression({ node }, { targets, messages }) {
        if (
          isCall(node, targets.function) ||
          isMemberCall(node, targets.instance, targets.function)
        ) {
          const value = getStringValue(node.arguments[0]);
          messages.add(value);
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
      JSXElement({ node }, { targets, messages }) {
        if (isComponent(node, targets.component)) {
          const attrs = node.openingElement.attributes;
          const value =
            getStringValue(node.children) ??
            getStringValue(getJSXAttrValue(attrs, 'message'));
          messages.add(value);
        }
      },
    },
    post() {
      if (this.messages.size === 0) {
        return;
      }

      for (const lang of langs) {
        const file = path.resolve(distination, lang + '.json');
        const locales: Locale = fs.readJSONSync(file, { throws: false }) ?? {};

        let shouldWrite = false;

        this.messages.forEach((key) => {
          if (key && !locales[key]) {
            locales[key] = key;
            shouldWrite = true;
          }
        });

        if (shouldWrite) {
          fs.outputJsonSync(file, locales, { spaces: 2 });
        }
      }
    },
  };
});

export default BabelPluginI18n;
