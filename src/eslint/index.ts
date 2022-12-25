import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

const { Identifier, Literal } = AST_NODE_TYPES;

const TranslateFunctionName = 't';

type MessageIds = 'literal';

const rule = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  defaultOptions: [],
  meta: {
    type: 'problem',
    docs: {
      description: 'enforces the rules of i18n',
      recommended: 'error',
    },
    messages: {
      literal: `The first argument of function \`${TranslateFunctionName}\` must be a literal string`,
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const { callee, arguments: params } = node;
        const [firstArg] = params;

        const isTranslateFn =
          callee.type === Identifier && callee.name === TranslateFunctionName;
        const isFirstArgLiteralString =
          firstArg?.type === Literal && typeof firstArg.value === 'string';

        if (isTranslateFn && !isFirstArgLiteralString) {
          context.report({
            node,
            messageId: 'literal',
          });
        }
      },
    };
  },
});

export default {
  rules: {
    'rules-of-i18n': rule,
  },
};
