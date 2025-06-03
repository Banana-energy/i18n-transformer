import { describe, expect, it, } from 'vitest'
import { transform, } from '../index'
import { decodeUnicode, } from '../utils'
import { mockI18nConfig, } from './test-utils'

describe('transform', () => {
  // 测试基本字符串转换
  it('should transform basic string literals', () => {
    const code = 'const message = "你好世界";'
    const result = transform({
      id: 'test.ts',
      code,
    }, {
      ...mockI18nConfig,
    },)

    expect(decodeUnicode(result.code,),).toContain('i18n("key_你好世界")',)
  },)

  // 测试模板字符串转换
  it('should transform template literals', () => {
    const code = 'const message = `你好，${name}`;'
    const result = transform({
      id: 'test.ts',
      code,
    }, {
      ...mockI18nConfig,
    },)

    expect(decodeUnicode(result.code,),).toContain('i18n("key_你好，{var1}"',)
    expect(result.code,).toContain('var1: name',)
  },)

  // 测试ESM依赖注入
  it('should inject ESM dependency', () => {
    const code = 'const message = "你好世界";'
    const result = transform({
      id: 'test.ts',
      code,
    }, {
      ...mockI18nConfig,
      dependency: {
        path: '@/i18n',
        name: 'i18n',
        module: 'esm',
      },
    },)

    expect(result.code,).toContain('import i18n from \'@/i18n\'',)
  },)

  // 测试CommonJS依赖注入
  it('should inject CommonJS dependency', () => {
    const code = 'const message = "你好世界";'
    const result = transform({
      id: 'test.ts',
      code,
    }, {
      ...mockI18nConfig,
      dependency: {
        path: '@/i18n',
        name: 'i18n',
        module: 'commonjs',
      },
    },)

    expect(result.code,).toContain('const i18n = require(\'@/i18n\')',)
  },)

  // 测试带解构的依赖注入
  it('should inject dependency with object pattern', () => {
    const code = 'const message = "你好世界";'
    const result = transform({
      id: 'test.ts',
      code,
    }, {
      ...mockI18nConfig,
      dependency: {
        path: '@/i18n',
        name: 'i18n',
        module: 'esm',
        objectPattern: true,
      },
    },)

    expect(result.code,).toContain('import { i18n } from \'@/i18n\'',)
  },)

  // 测试混合使用字符串和模板字符串
  it('should transform mixed string and template literals', () => {
    const code = `
      const str1 = "你好";
      const str2 = \`世界，\${name}\`;
    `
    const result = transform({
      id: 'test.ts',
      code,
    }, {
      ...mockI18nConfig,
    },)

    expect(decodeUnicode(result.code,),).toContain('i18n("key_你好")',)
    expect(decodeUnicode(result.code,),).toContain('i18n("key_世界，{var1}"',)
  },)

  // 测试带注释的代码
  it('should respect ignoreAutoI18n comments', () => {
    const code = `
      const str1 = ignoreAutoI18n("不要转换");
      const str2 = "需要转换";
    `
    const result = transform({
      id: 'test.ts',
      code,
    }, {
      ...mockI18nConfig,
    },)

    expect(decodeUnicode(result.code,),).toContain('"不要转换"',)
    expect(decodeUnicode(result.code,),).toContain('i18n("key_需要转换")',)
  },)

  // 测试控制台输出
  it('should not transform console output', () => {
    const code = `
      console.log("调试信息");
      const message = "需要转换";
    `
    const result = transform({
      id: 'test.ts',
      code,
    }, {
      ...mockI18nConfig,
    },)

    expect(decodeUnicode(result.code,),).toContain('console.log("调试信息")',)
    expect(decodeUnicode(result.code,),).toContain('i18n("key_需要转换")',)
  },)
},)
