/**
 * i18n转换器主入口模块
 * 负责将源代码转换为国际化版本，主要功能包括：
 * 1. 自动识别和转换中文字符串
 * 2. 处理普通字符串和模板字符串
 * 3. 自动注入i18n依赖
 * 4. 保持源代码格式
 */

import type { NodePath, TraverseOptions, } from '@babel/traverse'
import type { Statement, TemplateLiteral, } from '@babel/types'
import type { TransformConfig, } from './types'
import babelGenerator from '@babel/generator'
import { parse, } from '@babel/parser'
import babelTraverse from '@babel/traverse'
import { generateKey, } from '../shared/utils'
import { transformStringLiteral, } from './stringLiteral'
import { transformTemplate, } from './templateLiteral'
import {
  decodeUnicode,
  findCommentExclude,
  isChineseText,
  isInConsole,
} from './utils'

interface BabelTraverse {
  default: typeof babelTraverse
}

interface BabelGenerator {
  default: typeof babelGenerator
}

/**
 * 转换源代码为国际化版本
 */
export function transform({
  id,
  code,
}: {
  id: string
  code: string
}, config: TransformConfig,) {
  let loadedDependency = false
  let matched = false

  const {
    i18nCallee = '',
    dependency,
    localePattern = /[\u4E00-\u9FA5]+/,
  } = config || {}

  const ast = parse(code, {
    sourceType: 'unambiguous',
  },)
  const generateKeyMethod = config.generateKey || generateKey
  const visitor: TraverseOptions = {
    // 检查是否已导入i18n依赖
    ImportDeclaration(path,) {
      if (!dependency || loadedDependency) {
        return
      }

      // 检查是否是目标依赖的导入语句
      if (dependency.path !== path.node.source.value) {
        return
      }

      // 检查导入说明符是否匹配配置
      const matched = path.node.specifiers.some((item,) => {
        // 处理默认导入：import xxx from 'package'
        if (item.type === 'ImportDefaultSpecifier') {
          return item.local.name === dependency!.name
        }
        // 处理命名导入：import { xxx } from 'package'
        if (item.type === 'ImportSpecifier') {
          return item.imported.type === 'Identifier' &&
            item.imported.name === dependency!.name
        }
        return false
      },)

      if (matched) {
        loadedDependency = true
      }
    },

    // 处理变量声明，主要用于检测 CommonJS 的 require 调用
    VariableDeclarator(path,) {
      if (!dependency || loadedDependency) {
        return
      }
      const initNode = path.node.init
      if (!initNode || initNode.type !== 'CallExpression') {
        return
      }

      // 检查是否是 require 调用
      let valueMatched = false
      let nameMatched = false
      const initNodeCallee = initNode.callee
      if (initNodeCallee.type === 'Identifier' && initNodeCallee.name === 'require') {
        const args = initNode.arguments
        // 检查 require 的包名是否匹配
        if (args.length && 'value' in args[0] && dependency.path === args[0].value) {
          valueMatched = true
        }
      }

      // 检查变量名是否匹配配置
      if (dependency.objectPattern) {
        // 处理解构形式：const { xxx } = require('package')
        if (path.node.id.type === 'ObjectPattern') {
          path.node.id.properties.forEach((item,) => {
            if ('key' in item && item.key && item.key.type === 'Identifier' && item.key.name === config.dependency?.name) {
              nameMatched = true
            }
          },)
        }
      } else {
        // 处理普通形式：const xxx = require('package')
        if (path.node.id.type === 'Identifier' && path.node.id.name === dependency.name) {
          nameMatched = true
        }
      }
      if (valueMatched && nameMatched) {
        loadedDependency = true
      }
    },

    // 处理字符串字面量
    StringLiteral(path,) {
      // 检查是否有忽略注释
      if (findCommentExclude(path,)) {
        return
      }

      // 跳过控制台输出
      if (isInConsole(path,)) {
        return
      }

      const value = path.node.value
      // 检查是否包含需要转换的文本（如中文）
      if (!isChineseText(value, localePattern,)) {
        return
      }
      matched = true

      // 转换节点为i18n调用
      transformStringLiteral({
        path,
        generateKey: generateKeyMethod,
        i18nCallee,
      },)
    },

    // 处理模板字符串
    TemplateLiteral(path: NodePath<TemplateLiteral>,) {
      // 检查是否有忽略注释
      if (findCommentExclude(path,)) {
        return
      }
      // 跳过控制台输出
      if (isInConsole(path,)) {
        return
      }

      // 检查模板字符串的静态部分是否包含需要转换的文本
      const hasWord = path.node.quasis.some(item =>
        localePattern.test(decodeUnicode(item.value.raw,),),
      )
      if (!hasWord) {
        return
      }
      matched = true

      // 转换模板字符串为i18n调用
      transformTemplate({
        path,
        i18nCallee,
        generateKey: generateKeyMethod,
      },)
    },
  }

  // 遍历AST
  const traverse = (babelTraverse as unknown as BabelTraverse).default || babelTraverse
  traverse(ast, visitor,)

  // 如果配置了依赖且找到了需要转换的文本，但还没有导入依赖
  if (dependency && matched && !loadedDependency) {
    // 根据模块系统类型生成导入语句
    const {
      name,
      objectPattern,
      module,
    } = dependency
    const isCommonJS = module === 'commonjs'
    const i18nImport = isCommonJS ?
      `const ${objectPattern ? `{${name}}` : name} = require('${dependency.path}');` :
      `import ${objectPattern ? `{${name}}` : name} from '${dependency.path}'`

    // 解析导入语句为AST
    const i18nImportAst = parse(i18nImport, {
      sourceType: 'module',
    },)
    const preprocessingBody: Statement[] = []

    // 将导入语句添加到文件开头
    ast.program.body = i18nImportAst.program.body.concat(ast.program.body,)

    // 根据模块系统类型调整导入语句的位置
    if (isCommonJS) {
      // CommonJS的require通常放在文件开头
      ast.program.body.splice(1, 0, ...preprocessingBody,)
    } else {
      // ESM的import必须在其他import之后，非import语句之前
      const firstNonImportIndex = ast.program.body.findIndex(
        item => item.type !== 'ImportDeclaration',
      )
      if (firstNonImportIndex !== -1) {
        ast.program.body.splice(firstNonImportIndex, 0, ...preprocessingBody,)
      }
    }
  }

  // 生成代码
  const generator = (babelGenerator as unknown as BabelGenerator).default || babelGenerator
  const {
    code: newCode,
    map,
  } = generator(ast, {
    sourceMaps: true,
    sourceFileName: id.split('/',).pop(),
  }, code,)

  return {
    code: newCode,
    map,
  }
}
