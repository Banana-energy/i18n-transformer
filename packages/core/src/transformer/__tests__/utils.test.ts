import type { NodePath, } from '@babel/traverse'
import type * as t from '@babel/types'
import { parse, } from '@babel/parser'
import traverse from '@babel/traverse'
import { describe, expect, it, } from 'vitest'
import {
  decodeUnicode,
  findCommentExclude,
  getLeadingSpaceEnd,
  getTrailingSpaceStart,
  isChineseText,
  isInConsole,
} from '../utils'

describe('getLeadingSpaceEnd', () => {
  it('should return 0 for string without leading spaces', () => {
    expect(getLeadingSpaceEnd('test',),).toBe(0,)
  },)

  it('should return correct index for string with leading spaces', () => {
    expect(getLeadingSpaceEnd('  test',),).toBe(2,)
  },)

  it('should return string length for all-space string', () => {
    expect(getLeadingSpaceEnd('   ',),).toBe(0,)
  },)
},)

describe('getTrailingSpaceStart', () => {
  it('should return string length for string without trailing spaces', () => {
    expect(getTrailingSpaceStart('test',),).toBe(4,)
  },)

  it('should return correct index for string with trailing spaces', () => {
    expect(getTrailingSpaceStart('test  ',),).toBe(4,)
  },)

  it('should return 0 for all-space string', () => {
    expect(getTrailingSpaceStart('   ',),).toBe(3,)
  },)
},)

describe('isChineseText', () => {
  const chinesePattern = /[\u4E00-\u9FA5]/

  it('should return true for Chinese text', () => {
    expect(isChineseText('你好', chinesePattern,),).toBe(true,)
  },)

  it('should return false for non-Chinese text', () => {
    expect(isChineseText('hello', chinesePattern,),).toBe(false,)
  },)

  it('should return true for mixed text with Chinese', () => {
    expect(isChineseText('hello你好', chinesePattern,),).toBe(true,)
  },)
},)

describe('decodeUnicode', () => {
  it('should decode Unicode escape sequences', () => {
    expect(decodeUnicode('\\u4F60\\u597D',),).toBe('你好',)
  },)

  it('should handle mixed string with Unicode escapes', () => {
    expect(decodeUnicode('hello\\u4F60\\u597D',),).toBe('hello你好',)
  },)

  it('should return original string if no Unicode escapes', () => {
    expect(decodeUnicode('hello',),).toBe('hello',)
  },)
},)

describe('isInConsole', () => {
  it('should return true for console.log calls', () => {
    const code = 'console.log("test");'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)
    let result = false

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        result = isInConsole(path,)
      },
    },)

    expect(result,).toBe(true,)
  },)

  it('should return true for other console methods', () => {
    const code = 'console.error("test");'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)
    let result = false

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        result = isInConsole(path,)
      },
    },)

    expect(result,).toBe(true,)
  },)

  it('should return false for non-console calls', () => {
    const code = 'normalFunction("test");'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)
    let result = false

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        result = isInConsole(path,)
      },
    },)

    expect(result,).toBe(false,)
  },)
},)

describe('findCommentExclude', () => {
  it('should return true for direct ignoreAutoI18n calls', () => {
    const code = 'ignoreAutoI18n("test");'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)
    let result = false

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        result = findCommentExclude(path,)
      },
    },)

    expect(result,).toBe(true,)
  },)

  it('should return true for member expression ignoreAutoI18n calls', () => {
    const code = 'obj.ignoreAutoI18n("test");'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)
    let result = false

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        result = findCommentExclude(path,)
      },
    },)

    expect(result,).toBe(true,)
  },)

  it('should return true for sequence expression ignoreAutoI18n calls', () => {
    const code = '(a, b, obj.ignoreAutoI18n)("test");'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)
    let result = false

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        result = findCommentExclude(path,)
      },
    },)

    expect(result,).toBe(true,)
  },)

  it('should return false for normal function calls', () => {
    const code = 'normalFunction("test");'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)
    let result = false

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        result = findCommentExclude(path,)
      },
    },)

    expect(result,).toBe(false,)
  },)
},)
