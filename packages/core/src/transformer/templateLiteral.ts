/**
 * 模板字符串转换模块
 * 负责处理ES6模板字符串的国际化转换
 * 支持带变量插值的字符串，如：`Hello ${name}`
 */

import type { NodePath, } from '@babel/traverse'
import type { Expression, TemplateLiteral, } from '@babel/types'
import type { GenerateKey, } from './types'
import {
  callExpression,
  identifier,
  objectExpression,
  objectProperty,
  stringLiteral,
} from '@babel/types'
import { getMessages, setMessage, } from '../generator'

/**
 * 转换模板字符串为i18n调用表达式
 */
export function transformTemplate({
  path,
  i18nCallee,
  generateKey,
}: {
  path: NodePath<TemplateLiteral>
  i18nCallee: string
  generateKey: GenerateKey
},): void {
  if (!path || !path.node) {
    return
  }

  // 获取模板字符串中的表达式部分（${...}中的内容）
  const expressions = path.node.expressions || []
  // 获取模板字符串中的静态文本部分
  const quasis = path.node.quasis || []

  // 检查是否有有效的模板字符串内容
  if (!quasis.length || !quasis[0]) {
    return
  }

  // 如果没有变量表达式，直接转换为普通字符串
  if (expressions.length === 0) {
    const text = quasis[0].value.cooked || quasis[0].value.raw || ''
    const key = generateKey(text, path.node, getMessages(),)
    setMessage(key, text,)
    const i18nCall = callExpression(identifier(i18nCallee,), [
      stringLiteral(key,),
    ],)
    path.replaceWith(i18nCall,)
    return
  }

  // 将每个表达式转换为对象属性
  // 例如：${name} => { var1: name }
  const properties = expressions.map((expr, index,) => {
    const varName = `var${index + 1}`
    return objectProperty(
      identifier(varName,),
      expr as Expression,
    )
  },)

  // 构建模板字符串的静态文本部分
  const newStringParts = quasis
    .map((element, index,) => {
      const varName = expressions[index] ? `{var${index + 1}}` : ''
      return element.value.cooked + varName
    },)
    .join('',)
  const key = generateKey(newStringParts, path.node, getMessages(),)
  setMessage(key, newStringParts,)
  // 创建i18n调用
  const i18nCall = callExpression(identifier(i18nCallee,), [
    stringLiteral(key,),
    objectExpression(properties,),
  ],)

  // 用i18n调用替换原始的模板字符串
  path.replaceWith(i18nCall,)
}
