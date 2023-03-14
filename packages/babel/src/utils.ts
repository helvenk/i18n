import { BabelAPI } from '@babel/helper-plugin-utils';
import type {
  CallExpression,
  Expression,
  ImportDeclaration,
  JSXAttribute,
  JSXElement,
  JSXOpeningElement,
  ObjectPattern,
  ObjectProperty,
} from '@babel/types';
import fs from 'fs-extra';

export type Locale = Record<string, string>;

export function createHelpers({ types: t }: BabelAPI) {
  // import {} from '[name]'
  const isImportModule = (node: any, name: string) => {
    return (
      t.isImportDeclaration(node) &&
      t.isStringLiteral(node.source, { value: name })
    );
  };

  // import { [name], Trans } from 'i18n'
  const getImportName = (
    nodes: ImportDeclaration['specifiers'],
    name: string,
  ) => {
    const target = nodes.find(
      (node) =>
        t.isImportSpecifier(node) && t.isIdentifier(node.imported, { name }),
    );
    return target?.local.name ?? name;
  };

  // t()
  const isCall = (node: Expression, name: string): node is CallExpression => {
    return t.isCallExpression(node) && t.isIdentifier(node.callee, { name });
  };

  // i18n.t()
  const isMemberCall = (
    node: Expression,
    object: string,
    property: string,
  ): node is CallExpression => {
    return (
      t.isCallExpression(node) &&
      t.isMemberExpression(node.callee) &&
      t.isIdentifier(node.callee.object, { name: object }) &&
      t.isIdentifier(node.callee.property, { name: property })
    );
  };

  // <Trans></Trans>
  const isComponent = (node: any, name: string): node is JSXElement => {
    return (
      t.isJSXElement(node) &&
      t.isJSXIdentifier(node.openingElement.name, { name })
    );
  };

  const getPropertyName = (
    nodes: ObjectPattern['properties'],
    name: string,
  ) => {
    const target = nodes.find(
      (node) => t.isObjectProperty(node) && t.isIdentifier(node.key, { name }),
    ) as ObjectProperty | undefined;
    return t.isIdentifier(target?.value) ? target?.value.name : undefined;
  };

  const getStringValue = (node: any) => {
    const target = t.isJSXExpressionContainer(node) ? node.expression : node;
    if (t.isJSXText(target) || t.isStringLiteral(target)) {
      return target.value;
    }
  };

  const getJSXAttrValue = (
    nodes: JSXOpeningElement['attributes'],
    name: string,
  ) => {
    const target = nodes.find(
      (node) =>
        t.isJSXAttribute(node) && t.isJSXIdentifier(node.name, { name }),
    ) as JSXAttribute | undefined;
    return target?.value;
  };

  return {
    t,
    isImportModule,
    getImportName,
    isCall,
    isMemberCall,
    isComponent,
    getPropertyName,
    getStringValue,
    getJSXAttrValue,
  };
}

export type Adapter = {
  read: (file: string) => Locale;
  write: (file: string, data: Locale) => void;
  merge: (source: Locale, messages: any[]) => Locale | undefined;
};

export function getAdapter(): Adapter {
  return {
    read(file) {
      return fs.readJSONSync(file, { throws: false }) ?? {};
    },
    write(file, data) {
      fs.outputJsonSync(file, data, { spaces: 2 });
    },
    merge(source, messages) {
      let hasChanges = false;

      // eslint-disable-next-line no-param-reassign
      messages = Array.from(new Set(messages));

      messages.forEach((key) => {
        if (key && !source[key]) {
          source[key] = key;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        return source;
      }
    },
  };
}
