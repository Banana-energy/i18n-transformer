import {
  binaryExpression,
  callExpression,
  identifier,
  objectExpression,
  objectProperty,
  stringLiteral
} from '@babel/types'
import { globalSetting, setConfig } from '../common/collect.js'

// const localeWordPattern = /(\S.*)*[\u4e00-\u9fa5]+(.*\S)*/g

export const localeWordPattern = (word) => {
  const pattern = globalSetting.localePattern
  if (!pattern.test(word)) {
    return null
  }
  const matches = []
  const wordByLines = word.split('\n')
  wordByLines.forEach((wordLine) => {
    if (!pattern.test(wordLine)) {
      return
    }
    const firstCharNotSpace = wordLine.match(/\S/)
    const lastSpace = wordLine.match(/\s+$/)
    const firstCharNotSpaceIndex = firstCharNotSpace.index
    let wordMatchPart
    if (lastSpace) {
      wordMatchPart = wordLine.substring(firstCharNotSpaceIndex, lastSpace.index)
    } else {
      wordMatchPart = wordLine.substring(firstCharNotSpaceIndex)
    }
    matches.push(wordMatchPart)
  })

  return matches
}

const createSplitNode = ({ word, wordKeyMap, callee }) => {
  if (!globalSetting.localePattern.test(word)) {
    return [stringLiteral(word)]
  }
  const result = []
  const firstCharNotSpace = word.match(/\S/)
  const lastSpace = word.match(/\s+$/)
  const firstCharNotSpaceIndex = firstCharNotSpace.index
  let leftPart = ''
  let wordMatchPart
  let rightPart = ''
  if (firstCharNotSpaceIndex !== 0) {
    leftPart = stringLiteral(word.substring(0, firstCharNotSpaceIndex))
  }
  if (lastSpace) {
    wordMatchPart = word.substring(firstCharNotSpaceIndex, lastSpace.index)
    rightPart = stringLiteral(word.substring(lastSpace.index))
  } else {
    wordMatchPart = word.substring(firstCharNotSpaceIndex)
  }
  wordMatchPart = callExpression(identifier(callee), [
    stringLiteral('' + wordKeyMap[wordMatchPart])
  ])
  leftPart && result.push(leftPart)
  result.push(wordMatchPart)
  rightPart && result.push(rightPart)
  return result
}

const createT = ({ originValue, wordKeyMap, callee }) => {
  if (!globalSetting.localePattern.test(originValue)) {
    return
  }
  const splits = []
  const wordByLines = originValue.split('\n')
  wordByLines.forEach((wordLine) => {
    const res = createSplitNode({ word: wordLine, wordKeyMap, callee })
    splits.push(...res)
  })

  if (!splits.length) {
    return
  }
  if (splits.length === 1) {
    return splits[0]
  } else {
    const recurExp = (nodeList) => {
      if (nodeList.length > 2) {
        const lastIndex = nodeList.length - 1
        const right = nodeList[lastIndex]
        const left = recurExp(nodeList.slice(0, lastIndex))
        return binaryExpression('+', left, right)
      } else {
        return binaryExpression('+', nodeList[0], nodeList[1])
      }
    }
    return recurExp(splits)
  }
}

function transMethodArg({ path, originValue }) {
  const argI = path.parent.arguments.findIndex(
    (item) => item.type === 'StringLiteral' && item.value === originValue
  )
  path.parent.arguments[argI] = createT(arguments[0])
}

function transArrayEle({ path, originValue }) {
  const eleI = path.parent.elements.findIndex(
    (item) => item.type === 'StringLiteral' && item.value === originValue
  )
  path.parent.elements[eleI] = createT(arguments[0])
}

function transVarDec({ path }) {
  path.parent.init = createT(arguments[0])
}

function transBinaryExp({ path, originValue }) {
  const left = path.parent.left
  if (left.type === 'StringLiteral' && left.value === originValue) {
    path.parent.left = createT(arguments[0])
  } else {
    path.parent.right = createT(arguments[0])
  }
}

/**
 *  a: b
 * @param {*} params
 */
function transObjectValue({ path }) {
  path.parent.value = createT(arguments[0])
}

/**
 * a ? b : c
 * @param {*} param0
 */
function transCondExp({ path, originValue }) {
  const { consequent, alternate, test } = path.parent
  if (test.type === 'StringLiteral' && test.value === originValue) {
    path.parent.test = createT(arguments[0])
  } else if (consequent.type === 'StringLiteral' && consequent.value === originValue) {
    path.parent.consequent = createT(arguments[0])
  } else if (alternate.type === 'StringLiteral' && alternate.value === originValue) {
    path.parent.alternate = createT(arguments[0])
  }
}

/**
 * a || b
 * @param {*} param0
 */
function transLogicExp({ path, originValue }) {
  const { left, right } = path.parent
  if (left.type === 'StringLiteral' && left.value === originValue) {
    path.parent.left = createT(arguments[0])
  } else if (right.type === 'StringLiteral' && right.value === originValue) {
    path.parent.right = createT(arguments[0])
  }
}

/**
 * return xx
 * @param {*} param0
 */
function transReturnState({ path }) {
  path.parent.argument = createT(arguments[0])
}

/**
 * a = xxx
 * @param {*} param0
 */
function transAssign({ path, originValue }) {
  const { right } = path.parent
  if (right.type === 'StringLiteral' && right.value === originValue) {
    path.parent.right = createT(arguments[0])
  }
}

export function transformTemplate({ path, callee }) {
  let variableCount = 1
  const expressions = path.node.expressions
  const quasis = path.node.quasis
  if (expressions.length > 0) {
    // 创建 i18n 替换表达式
    // 构建对象字面量传递变量 { var1: selectedRows.value.length }
    const properties = expressions.map((expr) => {
      const varName = `var${variableCount++}`
      return objectProperty(identifier(varName), expr)
    })

    // 替换模板字符串的静态部分，将 ${} 替换为 {var1} 样式
    const newStringParts = quasis
      .map((element, index) => {
        const varName = expressions[index] ? `{var${index + 1}}` : ''
        return element.value.cooked + varName
      })
      .join('')

    const key = setConfig(newStringParts, path.node)

    // 替换模板字符串为 useI18n().t('key', { var1: ..., var2: ... })
    const i18nCall = callExpression(identifier(callee), [
      stringLiteral(key), // 这里可以替换成需要的翻译 key
      objectExpression(properties) // 传入变量对象
    ])

    // 替换 TemplateLiteral 为 i18n 表达式
    path.replaceWith(i18nCall)
  }
}

export function transCode({ path, originValue, wordKeyMap, callee }) {
  switch (path.parent.type) {
    case 'NewExpression':
    case 'CallExpression':
      transMethodArg(arguments[0])
      break
    case 'ArrayExpression':
      transArrayEle(arguments[0])
      break
    case 'VariableDeclarator':
      transVarDec(arguments[0])
      break
    case 'BinaryExpression':
      transBinaryExp(arguments[0])
      break
    case 'ObjectProperty':
      transObjectValue(arguments[0])
      break
    case 'ConditionalExpression':
      transCondExp(arguments[0])
      break
    case 'LogicalExpression':
      transLogicExp(arguments[0])
      break
    case 'ReturnStatement':
      transReturnState(arguments[0])
      break
    case 'AssignmentExpression':
    case 'AssignmentPattern':
      transAssign(arguments[0])
      break
  }
}
