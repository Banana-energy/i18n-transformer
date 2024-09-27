import {
  ArrayExpression,
  AssignmentPattern,
  BinaryExpression,
  binaryExpression,
  CallExpression,
  callExpression,
  ConditionalExpression,
  Expression,
  identifier,
  LogicalExpression,
  NewExpression,
  objectExpression,
  ObjectProperty,
  objectProperty,
  ReturnStatement,
  StringLiteral,
  stringLiteral,
  TemplateLiteral,
  VariableDeclarator,
} from '@babel/types'
import {
  globalSetting, setConfig,
} from '../common/collect'
import { NodePath, } from '@babel/traverse';
import { WordMap, } from '../generate/collectWords';

// const localeWordPattern = /(\S.*)*[\u4e00-\u9fa5]+(.*\S)*/g

type TransformOptions =
  {
    path: NodePath<StringLiteral>,
    originValue: string,
    wordKeyMap: WordMap,
    callee: string
  }


export const localeWordPattern = (word: string,): string[] | null => {
  const pattern = globalSetting.localePattern;
  if (!pattern.test(word,)) return null;

  return word.split('\n',).map((line,) => {
    const firstCharNotSpace = line.match(/\S/,)?.index ?? 0;
    const lastSpace = line.match(/\s+$/,)?.index ?? line.length;
    return line.substring(firstCharNotSpace, lastSpace,);
  },);
};

const createSplitNode = ({
  word, wordKeyMap, callee,
}: {
  word: string;
  wordKeyMap: Record<string, string>;
  callee: string
},) => {
  if (!globalSetting.localePattern.test(word,)) return [stringLiteral(word,),];

  const firstCharNotSpace = word.match(/\S/,)?.index ?? 0;
  const lastSpace = word.match(/\s+$/,)?.index ?? word.length;
  const leftPart = firstCharNotSpace !== 0 ? stringLiteral(word.substring(0, firstCharNotSpace,),) : undefined;
  const wordMatchPart = word.substring(firstCharNotSpace, lastSpace,);
  const rightPart = lastSpace !== word.length ? stringLiteral(word.substring(lastSpace,),) : undefined;

  const splitNode = [callExpression(identifier(callee,), [stringLiteral(wordKeyMap[wordMatchPart],),],),];
  return [leftPart, ...splitNode, rightPart,].filter(Boolean,);
};

const createT = ({
  originValue, wordKeyMap, callee,
}: TransformOptions,) => {
  if (!globalSetting.localePattern.test(originValue,)) {
    return
  }
  const splits: (StringLiteral | CallExpression)[] = []
  const wordByLines = originValue.split('\n',)
  wordByLines.forEach((wordLine,) => {
    const res = createSplitNode({
      word: wordLine, wordKeyMap, callee,
    },)
    splits.push(...res as Exclude<typeof res[number], undefined>[],)
  },)

  if (!splits.length) {
    return
  }
  if (splits.length === 1) {
    return splits[0]
  } else {
    const recurExp = (nodeList: (StringLiteral | CallExpression)[],): BinaryExpression => {
      if (nodeList.length > 2) {
        const lastIndex = nodeList.length - 1
        const right = nodeList[lastIndex]
        const left = recurExp(nodeList.slice(0, lastIndex,),)
        return binaryExpression('+', left, right,)
      } else {
        return binaryExpression('+', nodeList[0], nodeList[1],)
      }
    }
    return recurExp(splits,)
  }
}

function transMethodArg(params: TransformOptions,) {
  const {
    path, originValue,
  } = params
  const parent = path.parent as CallExpression | NewExpression
  const argI = parent.arguments.findIndex(
    (item,) => item.type === 'StringLiteral' && item.value === originValue,
  )
  parent.arguments[argI] = createT(params,)!
}

function transArrayEle(params: TransformOptions,) {
  const {
    path, originValue,
  } = params
  const parent = path.parent as ArrayExpression
  const eleI = parent.elements.findIndex(
    (item,) => item?.type === 'StringLiteral' && item?.value === originValue,
  )
  parent.elements[eleI] = createT(params,)!
}

function transVarDec(params: TransformOptions,) {
  const { path, } = params
  const parent = path.parent as VariableDeclarator
  parent.init = createT(params,)
}

function transBinaryExp(params: TransformOptions,) {
  const {
    path, originValue,
  } = params
  const parent = path.parent as BinaryExpression
  const left = parent.left
  if (left.type === 'StringLiteral' && left.value === originValue) {
    parent.left = createT(params,)!
  } else {
    parent.right = createT(params,)!
  }
}

function transObjectValue(params: TransformOptions,) {
  const { path, } = params
  const parent = path.parent as ObjectProperty
  parent.value = createT(params,)!
}

function transCondExp(params: TransformOptions,) {
  const {
    path, originValue,
  } = params
  const parent = path.parent as ConditionalExpression
  const {
    consequent, alternate, test,
  } = parent
  if (test.type === 'StringLiteral' && test.value === originValue) {
    parent.test = createT(params,)!
  } else if (consequent.type === 'StringLiteral' && consequent.value === originValue) {
    parent.consequent = createT(params,)!
  } else if (alternate.type === 'StringLiteral' && alternate.value === originValue) {
    parent.alternate = createT(params,)!
  }
}

function transLogicExp(params: TransformOptions,) {
  const {
    path, originValue,
  } = params
  const parent = path.parent as LogicalExpression
  const {
    left, right,
  } = parent
  if (left.type === 'StringLiteral' && left.value === originValue) {
    parent.left = createT(params,)!
  } else if (right.type === 'StringLiteral' && right.value === originValue) {
    parent.right = createT(params,)!
  }
}

function transReturnState(params: TransformOptions,) {
  const { path, } = params
  const parent = path.parent as ReturnStatement
  parent.argument = createT(params,)
}

function transAssign(params: TransformOptions,) {
  const {
    path, originValue,
  } = params
  const parent = path.parent as AssignmentPattern
  const { right, } = parent
  if (right.type === 'StringLiteral' && right.value === originValue) {
    parent.right = createT(params,)!
  }
}

export function transformTemplate({
  path, callee,
}: { path: NodePath<TemplateLiteral>, callee: string },) {
  let variableCount = 1
  const expressions = path.node.expressions
  const quasis = path.node.quasis
  if (expressions.length > 0) {
    // 创建 i18n 替换表达式
    // 构建对象字面量传递变量 { var1: selectedRows.value.length }
    const properties = expressions.map((expr,) => {
      const varName = `var${variableCount++}`
      return objectProperty(identifier(varName,), expr as Expression,)
    },)

    // 替换模板字符串的静态部分，将 ${} 替换为 {var1} 样式
    const newStringParts = quasis
      .map((element, index,) => {
        const varName = expressions[index] ? `{var${index + 1}}` : ''
        return element.value.cooked + varName
      },)
      .join('',)

    const key = setConfig(newStringParts, path.node,)

    // 替换模板字符串为 useI18n().t('key', { var1: ..., var2: ... })
    const i18nCall = callExpression(identifier(callee,), [
      stringLiteral(key,), // 这里可以替换成需要的翻译 key
      objectExpression(properties,), // 传入变量对象
    ],)

    // 替换 TemplateLiteral 为 i18n 表达式
    path.replaceWith(i18nCall,)
  }
}

export function transCode(params: TransformOptions,) {
  const { path, } = params
  switch (path.parent.type) {
    case 'NewExpression':
    case 'CallExpression':
      transMethodArg(params,)
      break
    case 'ArrayExpression':
      transArrayEle(params,)
      break
    case 'VariableDeclarator':
      transVarDec(params,)
      break
    case 'BinaryExpression':
      transBinaryExp(params,)
      break
    case 'ObjectProperty':
      transObjectValue(params,)
      break
    case 'ConditionalExpression':
      transCondExp(params,)
      break
    case 'LogicalExpression':
      transLogicExp(params,)
      break
    case 'ReturnStatement':
      transReturnState(params,)
      break
    case 'AssignmentExpression':
    case 'AssignmentPattern':
      transAssign(params,)
      break
  }
}
