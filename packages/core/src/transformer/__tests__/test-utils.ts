import generate from '@babel/generator'
import { parse, } from '@babel/parser'

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
