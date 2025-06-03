import type { NodePath, } from '@babel/traverse'
import type * as t from '@babel/types'
import generate from '@babel/generator'
import { parse, } from '@babel/parser'
import traverse from '@babel/traverse'
import { describe, expect, it, } from 'vitest'
import { transformTemplate, } from '../templateLiteral'
import { decodeUnicode, } from '../utils'
import { compareCode, mockI18nConfig, } from './test-utils'

describe('transformTemplate', () => {
  describe('basic Transformations', () => {
    it('should transform simple template literal without variables', () => {
      const code = 'const message = `你好世界`;'
      const ast = parse(code, {
        sourceType: 'unambiguous',
      },)

      traverse(ast, {
        TemplateLiteral(path: NodePath<t.TemplateLiteral>,) {
          transformTemplate({
            path,
            i18nCallee: mockI18nConfig.i18nCallee,
            generateKey: mockI18nConfig.generateKey,
          },)
        },
      },)

      const { code: newCode, } = generate(ast,)
      expect(compareCode(
        decodeUnicode(newCode,),
        'const message = i18n("key_你好世界");',
      ),).toBe(true,)
    },)

    it('should transform empty template literal', () => {
      const code = 'const message = ``;'
      const ast = parse(code, {
        sourceType: 'unambiguous',
      },)

      traverse(ast, {
        TemplateLiteral(path: NodePath<t.TemplateLiteral>,) {
          transformTemplate({
            path,
            i18nCallee: mockI18nConfig.i18nCallee,
            generateKey: mockI18nConfig.generateKey,
          },)
        },
      },)

      const { code: newCode, } = generate(ast,)
      expect(compareCode(
        decodeUnicode(newCode,),
        'const message = i18n("key_");',
      ),).toBe(true,)
    },)
  },)

  describe('variable Interpolation', () => {
    it('should transform template with single variable', () => {
      const code = 'const message = `你好，${name}`;'
      const ast = parse(code, {
        sourceType: 'unambiguous',
      },)

      traverse(ast, {
        TemplateLiteral(path: NodePath<t.TemplateLiteral>,) {
          transformTemplate({
            path,
            i18nCallee: mockI18nConfig.i18nCallee,
            generateKey: mockI18nConfig.generateKey,
          },)
        },
      },)

      const { code: newCode, } = generate(ast,)
      expect(compareCode(
        decodeUnicode(newCode,),
        'const message = i18n("key_你好，{var1}", { var1: name });',
      ),).toBe(true,)
    },)

    it('should transform template with multiple variables', () => {
      const code = 'const message = `${title}你好，${name}！`;'
      const ast = parse(code, {
        sourceType: 'unambiguous',
      },)

      traverse(ast, {
        TemplateLiteral(path: NodePath<t.TemplateLiteral>,) {
          transformTemplate({
            path,
            i18nCallee: mockI18nConfig.i18nCallee,
            generateKey: mockI18nConfig.generateKey,
          },)
        },
      },)

      const { code: newCode, } = generate(ast,)
      expect(compareCode(
        decodeUnicode(newCode,),
        'const message = i18n("key_{var1}你好，{var2}！", { var1: title, var2: name });',
      ),).toBe(true,)
    },)

    it('should transform template with expressions', () => {
      const code = 'const message = `结果是：${a + b}`;'
      const ast = parse(code, {
        sourceType: 'unambiguous',
      },)

      traverse(ast, {
        TemplateLiteral(path: NodePath<t.TemplateLiteral>,) {
          transformTemplate({
            path,
            i18nCallee: mockI18nConfig.i18nCallee,
            generateKey: mockI18nConfig.generateKey,
          },)
        },
      },)

      const { code: newCode, } = generate(ast,)
      expect(compareCode(
        decodeUnicode(newCode,),
        'const message = i18n("key_结果是：{var1}", { var1: a + b });',
      ),).toBe(true,)
    },)
  },)

  describe('formatting', () => {
    it('should preserve multiline template literal format', () => {
      const code = 'const message = `第一行\n${name}第二行`;'
      const ast = parse(code, {
        sourceType: 'unambiguous',
      },)

      traverse(ast, {
        TemplateLiteral(path: NodePath<t.TemplateLiteral>,) {
          transformTemplate({
            path,
            i18nCallee: mockI18nConfig.i18nCallee,
            generateKey: mockI18nConfig.generateKey,
          },)
        },
      },)

      const { code: newCode, } = generate(ast,)
      expect(compareCode(
        decodeUnicode(newCode,),
        'const message = i18n("key_第一行\\n{var1}第二行", { var1: name });',
      ),).toBe(true,)
    },)

    it('should preserve spaces in template literal', () => {
      const code = 'const message = `  ${name}  你好  `;'
      const ast = parse(code, {
        sourceType: 'unambiguous',
      },)

      traverse(ast, {
        TemplateLiteral(path: NodePath<t.TemplateLiteral>,) {
          transformTemplate({
            path,
            i18nCallee: mockI18nConfig.i18nCallee,
            generateKey: mockI18nConfig.generateKey,
          },)
        },
      },)

      const { code: newCode, } = generate(ast,)
      expect(compareCode(
        decodeUnicode(newCode,),
        'const message = i18n("key_  {var1}  你好  ", { var1: name });',
      ),).toBe(true,)
    },)
  },)

  describe('edge Cases', () => {
    it('should handle template with only variables', () => {
      const code = 'const message = `${a}${b}${c}`;'
      const ast = parse(code, {
        sourceType: 'unambiguous',
      },)

      traverse(ast, {
        TemplateLiteral(path: NodePath<t.TemplateLiteral>,) {
          transformTemplate({
            path,
            i18nCallee: mockI18nConfig.i18nCallee,
            generateKey: mockI18nConfig.generateKey,
          },)
        },
      },)

      const { code: newCode, } = generate(ast,)
      expect(compareCode(
        decodeUnicode(newCode,),
        'const message = i18n("key_{var1}{var2}{var3}", { var1: a, var2: b, var3: c });',
      ),).toBe(true,)
    },)

    it('should handle null path gracefully', () => {
      const path = null as unknown as NodePath<t.TemplateLiteral>

      transformTemplate({
        path,
        i18nCallee: mockI18nConfig.i18nCallee,
        generateKey: mockI18nConfig.generateKey,
      },)

      // Test passes if no error is thrown
      expect(true,).toBe(true,)
    },)
  },)
},)
