/**
 * 工具函数模块
 * 提供字符串处理、文本检测和AST节点分析等通用功能
 */

import type { Node, NodePath, } from '@babel/traverse'
import type { StringLiteral, TemplateLiteral, } from '@babel/types'

/**
 * 获取字符串开头的非空白字符位置
 * @param str 输入字符串
 * @returns 非空白字符的开始位置
 */
export function getLeadingSpaceEnd(str: string,): number {
  if (!str)
    return 0
  return str.match(/\S/,)?.index ?? 0
}

/**
 * 获取字符串结尾的空白字符开始位置
 * @param str 输入字符串
 * @returns 结尾空白字符的开始位置
 */
export function getTrailingSpaceStart(str: string,): number {
  if (!str)
    return 0
  if (str.trim().length === 0) {
    return str.length
  }
  return str.match(/\s+$/,)?.index ?? str.length
}

/**
 * 检查文本是否匹配本地化模式（如中文文本）
 * @param text 待检查的文本
 * @param pattern 匹配模式
 * @returns 是否匹配
 */
export function isChineseText(text: string, pattern: RegExp,): boolean {
  return pattern.test(text,)
}

/**
 * 解码Unicode转义序列
 * 如：将 "\u4F60\u597D" 转换为 "你好"
 * @param str 包含Unicode转义序列的字符串
 * @returns 解码后的字符串
 */
export function decodeUnicode(str: string,): string {
  return str.replace(/\\u[\dA-F]{4}/gi, (match,) => {
    return String.fromCharCode(Number.parseInt(match.replace(/\\u/g, '',), 16,),)
  },)
}

/**
 * 获取指定深度的父节点
 * @param path 当前节点路径
 * @param deep 向上查找的深度
 * @returns 找到的父节点
 */
function getParent(path?: NodePath | null, deep = 1,): Node | undefined {
  let tempPath = path
  for (let i = 0; i < deep - 1; i++) {
    tempPath = tempPath?.parentPath
  }
  return tempPath?.parent
}

/**
 * 检查节点是否在console调用中
 * 用于跳过控制台输出的国际化转换
 * @param path 节点路径
 * @returns 是否在console调用中
 */
export function isInConsole(path: NodePath<StringLiteral> | NodePath<TemplateLiteral>,): boolean {
  const parent = path.parent
  if ('callee' in parent) {
    const {
      type: parentType,
      callee: parentCallee,
    } = parent
    if (parentType === 'CallExpression' && parentCallee.type === 'MemberExpression') {
      const parentCalleeObject = parentCallee.object
      if (parentCalleeObject.type === 'Identifier' && parentCalleeObject.name === 'console') {
        return true
      }
    }
  }
  return false
}

/**
 * 查找是否有忽略自动国际化的注释标记
 * 支持三种形式：
 * 1. ignoreAutoI18n()
 * 2. xxx.ignoreAutoI18n()
 * 3. (xxx, yyy).ignoreAutoI18n()
 * @param path 节点路径
 * @returns 是否应该忽略国际化转换
 */
export function findCommentExclude(path: NodePath,): boolean {
  const parent = getParent(path,)
  if (!parent || parent.type !== 'CallExpression') {
    return false
  }

  const { callee, } = parent

  // 判断是否直接调用 ignoreAutoI18n
  const isDirectIgnoreCall =
    'name' in callee && callee.name === 'ignoreAutoI18n'

  // 判断是否是 MemberExpression 的形式
  const isMemberIgnoreCall =
    callee.type === 'MemberExpression' &&
    'name' in callee.property &&
    callee.property.name === 'ignoreAutoI18n'

  // 判断是否是 SequenceExpression 中的最后一项
  function isSequenceIgnoreCall(): boolean {
    if (callee.type === 'SequenceExpression' && callee.expressions.length > 0) {
      const length = callee.expressions.length
      const lastExpression = callee.expressions[length - 1]

      if (lastExpression && lastExpression.type === 'MemberExpression' && 'name' in lastExpression.property) {
        return lastExpression.property.name === 'ignoreAutoI18n'
      }
    }
    return false
  }

  return isDirectIgnoreCall || isMemberIgnoreCall || isSequenceIgnoreCall()
}
