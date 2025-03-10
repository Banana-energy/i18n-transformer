import type { NodePath, } from '@babel/traverse'
import type { WordMap, } from '../generate/collectWords'
import {
  type ArrayExpression,
  type AssignmentPattern,
  type BinaryExpression,
  binaryExpression,
  type CallExpression,
  callExpression,
  type ConditionalExpression,
  type Expression,
  identifier,
  type LogicalExpression,
  type NewExpression,
  objectExpression,
  type ObjectProperty,
  objectProperty,
  type ReturnStatement,
  type StringLiteral,
  stringLiteral,
  type TemplateLiteral,
  type VariableDeclarator,
} from '@babel/types'
import { type GlobalSetting, setConfig, } from '../common/collect'

interface TransformOptions {
  path: NodePath<StringLiteral>
  originValue: string
  wordKeyMap: WordMap
  callee: string
}

export function localeWordPattern(word: string, options: GlobalSetting,): string[] | null {
  const pattern = options.localePattern
  if (!pattern.test(word,))
    return null

  return word.split('\n',).map((line,) => {
    const firstCharNotSpace = line.match(/\S/,)?.index ?? 0
    const lastSpace = line.match(/\s+$/,)?.index ?? line.length
    return line.substring(firstCharNotSpace, lastSpace,)
  },)
}

function createSplitNode({
  word,
  wordKeyMap,
  callee,
}: {
  word: string
  wordKeyMap: Record<string, string>
  callee: string
}, options: GlobalSetting,) {
  if (!options.localePattern.test(word,))
    return [ stringLiteral(word,), ]

  const firstCharNotSpace = word.match(/\S/,)?.index ?? 0
  const lastSpace = word.match(/\s+$/,)?.index ?? word.length
  const leftPart = firstCharNotSpace !== 0 ? stringLiteral(word.substring(0, firstCharNotSpace,),) : undefined
  const wordMatchPart = word.substring(firstCharNotSpace, lastSpace,)
  const rightPart = lastSpace !== word.length ? stringLiteral(word.substring(lastSpace,),) : undefined

  const splitNode = [ callExpression(identifier(callee,), [ stringLiteral(wordKeyMap[wordMatchPart],), ],), ]
  return [ leftPart, ...splitNode, rightPart, ].filter(Boolean,)
}

function createT({
  originValue,
  wordKeyMap,
  callee,
}: TransformOptions, options: GlobalSetting,) {
  if (!options.localePattern.test(originValue,))
    return
  const splits: (StringLiteral | CallExpression)[] = []
  const wordByLines = originValue.split('\n',)
  wordByLines.forEach((wordLine,) => {
    const res = createSplitNode({
      word: wordLine,
      wordKeyMap,
      callee,
    }, options,)
    splits.push(...res as Exclude<typeof res[number], undefined>[],)
  },)

  if (!splits.length)
    return
  if (splits.length === 1)
    return splits[0]
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

function transformNode(params: TransformOptions, options: GlobalSetting, transformFn: (params: TransformOptions, options: GlobalSetting) => void,) {
  transformFn(params, options,)
}

export function transCode(params: TransformOptions, options: GlobalSetting,) {
  const { path, } = params
  const transformMap: Record<string, (params: TransformOptions, options: GlobalSetting) => void> = {
    NewExpression: transMethodArg,
    CallExpression: transMethodArg,
    ArrayExpression: transArrayEle,
    VariableDeclarator: transVarDec,
    BinaryExpression: transBinaryExp,
    ObjectProperty: transObjectValue,
    ConditionalExpression: transCondExp,
    LogicalExpression: transLogicExp,
    ReturnStatement: transReturnState,
    AssignmentExpression: transAssign,
    AssignmentPattern: transAssign,
  }

  const transformFn = transformMap[path.parent.type]
  if (transformFn) {
    transformNode(params, options, transformFn,)
  }
}

function transMethodArg(params: TransformOptions, options: GlobalSetting,) {
  const {
    path,
    originValue,
  } = params
  const parent = path.parent as CallExpression | NewExpression
  const argI = parent.arguments.findIndex(
    item => item.type === 'StringLiteral' && item.value === originValue,
  )
  parent.arguments[argI] = createT(params, options,)!
}

function transArrayEle(params: TransformOptions, options: GlobalSetting,) {
  const {
    path,
    originValue,
  } = params
  const parent = path.parent as ArrayExpression
  const eleI = parent.elements.findIndex(
    item => item?.type === 'StringLiteral' && item?.value === originValue,
  )
  parent.elements[eleI] = createT(params, options,)!
}

function transVarDec(params: TransformOptions, options: GlobalSetting,) {
  const { path, } = params
  const parent = path.parent as VariableDeclarator
  parent.init = createT(params, options,)
}

function transBinaryExp(params: TransformOptions, options: GlobalSetting,) {
  const {
    path,
    originValue,
  } = params
  const parent = path.parent as BinaryExpression
  const left = parent.left
  if (left.type === 'StringLiteral' && left.value === originValue) {
    parent.left = createT(params, options,)!
  } else {
    parent.right = createT(params, options,)!
  }
}

function transObjectValue(params: TransformOptions, options: GlobalSetting,) {
  const { path, } = params
  const parent = path.parent as ObjectProperty
  parent.value = createT(params, options,)!
}

function transCondExp(params: TransformOptions, options: GlobalSetting,) {
  const {
    path,
    originValue,
  } = params
  const parent = path.parent as ConditionalExpression
  const {
    consequent,
    alternate,
    test,
  } = parent
  if (test.type === 'StringLiteral' && test.value === originValue) {
    parent.test = createT(params, options,)!
  } else if (consequent.type === 'StringLiteral' && consequent.value === originValue) {
    parent.consequent = createT(params, options,)!
  } else if (alternate.type === 'StringLiteral' && alternate.value === originValue) {
    parent.alternate = createT(params, options,)!
  }
}

function transLogicExp(params: TransformOptions, options: GlobalSetting,) {
  const {
    path,
    originValue,
  } = params
  const parent = path.parent as LogicalExpression
  const {
    left,
    right,
  } = parent
  if (left.type === 'StringLiteral' && left.value === originValue) {
    parent.left = createT(params, options,)!
  } else if (right.type === 'StringLiteral' && right.value === originValue) {
    parent.right = createT(params, options,)!
  }
}

function transReturnState(params: TransformOptions, options: GlobalSetting,) {
  const { path, } = params
  const parent = path.parent as ReturnStatement
  parent.argument = createT(params, options,)
}

function transAssign(params: TransformOptions, options: GlobalSetting,) {
  const {
    path,
    originValue,
  } = params
  const parent = path.parent as AssignmentPattern
  const { right, } = parent
  if (right.type === 'StringLiteral' && right.value === originValue) {
    parent.right = createT(params, options,)!
  }
}

export function transformTemplate({
  path,
  callee,
}: {
  path: NodePath<TemplateLiteral>
  callee: string
}, options: GlobalSetting,) {
  let variableCount = 1
  const expressions = path.node.expressions
  const quasis = path.node.quasis
  if (expressions.length > 0) {
    const properties = expressions.map((expr,) => {
      const varName = `var${variableCount++}`
      return objectProperty(identifier(varName,), expr as Expression,)
    },)

    const newStringParts = quasis
      .map((element, index,) => {
        const varName = expressions[index] ? `{var${index + 1}}` : ''
        return element.value.cooked + varName
      },)
      .join('',)

    const key = setConfig(newStringParts, path.node, options,)

    const i18nCall = callExpression(identifier(callee,), [
      stringLiteral(key,),
      objectExpression(properties,),
    ],)

    path.replaceWith(i18nCall,)
  }
}
