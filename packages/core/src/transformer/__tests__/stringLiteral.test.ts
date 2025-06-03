import type { NodePath, } from '@babel/traverse'
import type * as t from '@babel/types'
import generate from '@babel/generator'
import { parse, } from '@babel/parser'
import traverse from '@babel/traverse'
import { describe, expect, it, } from 'vitest'
import { extractLocalizedStrings, transformStringLiteral, } from '../stringLiteral'
import { compareCode, mockI18nConfig, } from './test-utils'

describe('extractLocalizedStrings', () => {
  it('should extract single line string', () => {
    const result = extractLocalizedStrings('你好世界',)
    expect(result,).toEqual([ '你好世界', ],)
  },)

  it('should extract string with spaces', () => {
    const result = extractLocalizedStrings('  你好世界  ',)
    expect(result,).toEqual([ '你好世界', ],)
  },)

  it('should extract multiline string', () => {
    const result = extractLocalizedStrings('你好\n世界',)
    expect(result,).toEqual([ '你好', '世界', ],)
  },)

  it('should handle empty string', () => {
    const result = extractLocalizedStrings('',)
    expect(result,).toEqual([ '', ],)
  },)
},)

describe('transformStringLiteral', () => {
  // 测试变量声明中的字符串
  it('should transform string in variable declaration', () => {
    const code = 'const message = "你好世界";'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        transformStringLiteral({
          path,
          keyMap: {
            你好世界: 'key_hello_world',
          },
          i18nCallee: mockI18nConfig.i18nCallee,
        },)
      },
    },)

    const { code: newCode, } = generate(ast,)
    expect(compareCode(
      newCode,
      'const message = i18n("key_hello_world");',
    ),).toBe(true,)
  },)

  // 测试函数调用中的字符串
  it('should transform string in function call', () => {
    const code = 'alert("你好世界");'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        transformStringLiteral({
          path,
          keyMap: {
            你好世界: 'key_hello_world',
          },
          i18nCallee: mockI18nConfig.i18nCallee,
        },)
      },
    },)

    const { code: newCode, } = generate(ast,)
    expect(compareCode(
      newCode,
      'alert(i18n("key_hello_world"));',
    ),).toBe(true,)
  },)

  // 测试对象属性中的字符串
  it('should transform string in object property', () => {
    const code = 'const obj = { message: "你好世界" };'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        transformStringLiteral({
          path,
          keyMap: {
            你好世界: 'key_hello_world',
          },
          i18nCallee: mockI18nConfig.i18nCallee,
        },)
      },
    },)

    const { code: newCode, } = generate(ast,)
    expect(compareCode(
      newCode,
      'const obj = { message: i18n("key_hello_world") };',
    ),).toBe(true,)
  },)

  // 测试带空格的字符串
  it('should preserve spaces in transformed string', () => {
    const code = 'const message = "  你好世界  ";'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        transformStringLiteral({
          path,
          keyMap: {
            你好世界: 'key_hello_world',
          },
          i18nCallee: mockI18nConfig.i18nCallee,
        },)
      },
    },)

    const { code: newCode, } = generate(ast,)
    expect(compareCode(
      newCode,
      'const message = "  " + i18n("key_hello_world") + "  ";',
    ),).toBe(true,)
  },)

  // 测试条件表达式中的字符串
  it('should transform string in conditional expression', () => {
    const code = 'const message = condition ? "你好" : "世界";'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        transformStringLiteral({
          path,
          keyMap: {
            你好: 'key_hello',
            世界: 'key_world',
          },
          i18nCallee: mockI18nConfig.i18nCallee,
        },)
      },
    },)

    const { code: newCode, } = generate(ast,)
    expect(compareCode(
      newCode,
      'const message = condition ? i18n("key_hello") : i18n("key_world");',
    ),).toBe(true,)
  },)

  // 测试数组中的字符串
  it('should transform string in array', () => {
    const code = 'const arr = ["你好", "世界"];'
    const ast = parse(code, {
      sourceType: 'unambiguous',
    },)

    traverse(ast, {
      StringLiteral(path: NodePath<t.StringLiteral>,) {
        transformStringLiteral({
          path,
          keyMap: {
            你好: 'key_hello',
            世界: 'key_world',
          },
          i18nCallee: mockI18nConfig.i18nCallee,
        },)
      },
    },)

    const { code: newCode, } = generate(ast,)
    expect(compareCode(
      newCode,
      'const arr = [i18n("key_hello"), i18n("key_world")];',
    ),).toBe(true,)
  },)
},)
