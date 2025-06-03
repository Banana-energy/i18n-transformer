import type { NodePath, } from '@babel/traverse'
import generate from '@babel/generator'
import { parse, } from '@babel/parser'
import * as t from '@babel/types'

/**
 * 创建AST节点的测试路径
 * @param code 源代码
 * @returns 包含AST节点的NodePath对象
 */
export function createNodePath(code: string,): NodePath {
  const ast = parse(code,)
  const firstNode = ast.program.body[0]

  // 如果是表达式语句，返回其表达式
  if (firstNode.type === 'ExpressionStatement') {
    return {
      node: firstNode.expression,
      parent: firstNode,
      parentPath: {
        node: ast.program,
        parent: null,
      },
      replaceWith(newNode: t.Expression,) {
        firstNode.expression = newNode
      },
    } as unknown as NodePath
  }

  // 如果是变量声明，返回其初始化器
  if (firstNode.type === 'VariableDeclaration' && firstNode.declarations[0].init) {
    return {
      node: firstNode.declarations[0].init,
      parent: firstNode.declarations[0],
      parentPath: {
        node: firstNode,
        parent: ast.program,
      },
      replaceWith(newNode: t.Expression,) {
        firstNode.declarations[0].init = newNode
      },
    } as unknown as NodePath
  }

  return {
    node: firstNode,
    parent: ast.program,
    parentPath: {
      node: ast.program,
      parent: null,
    },
    replaceWith(newNode: t.Statement,) {
      ast.program.body[0] = newNode
    },
  } as unknown as NodePath
}

/**
 * 比较转换前后的代码
 * @param input 输入代码
 * @param output 期望的输出代码
 * @returns 是否匹配
 */
export function compareCode(input: string, output: string,): boolean {
  const inputAst = parse(input,)
  const outputAst = parse(output,)

  const inputCode = generate(inputAst, {
    jsescOption: {
      minimal: true,
    },
  },).code.replace(/['"`]/g, '"',).replace(/\s+/g, ' ',).trim() // 移除首尾空格

  const outputCode = generate(outputAst, {
    jsescOption: {
      minimal: true,
    },
  },).code.replace(/['"`]/g, '"',).replace(/\s+/g, ' ',).trim() // 移除首尾空格

  return inputCode === outputCode
}

/**
 * 创建模拟的i18n配置
 */
export const mockI18nConfig = {
  i18nCallee: 'i18n',
  generateKey: (text: string,) => text.startsWith('key_',) ? text : `key_${text}`,
  keyMap: {},
  localePattern: /[\u4E00-\u9FA5]/,
}

/**
 * 创建基本的AST节点
 */
export const createNodes = {
  stringLiteral: (value: string,) => t.stringLiteral(value,),
  identifier: (name: string,) => t.identifier(name,),
  callExpression: (callee: t.Expression, args: t.Expression[],) => t.callExpression(callee, args,),
  memberExpression: (object: t.Expression, property: t.Expression,) => t.memberExpression(object, property,),
  variableDeclarator: (id: t.LVal, init: t.Expression | null,) => t.variableDeclarator(id, init,),
  objectProperty: (key: t.Expression, value: t.Expression,) => t.objectProperty(key, value,),
}
