import type {
  ArgumentPlaceholder,
  Expression,
  Node,
  ObjectProperty,
  PrivateName,
  RestElement,
  SpreadElement,
  Statement,
  StringLiteral,
  Super,
  TemplateLiteral,
  V8IntrinsicIdentifier,
} from '@babel/types'
import type { WordMap, } from '../generate/collectWords'
import babelGenerator from '@babel/generator'
import { parse, } from '@babel/parser'
import babelTraverse, { type NodePath, type TraverseOptions, } from '@babel/traverse'
import { type GlobalSetting, Module, setConfig, } from '../common/collect'
import { localeWordPattern, transCode, transformTemplate, } from './transform'

interface BabelTraverse {
  default: typeof babelTraverse
}

interface BabelGenerator {
  default: typeof babelGenerator
}

type WithCallee = Extract<Node, { callee: Expression | Super | V8IntrinsicIdentifier }>
type WithName = Extract<V8IntrinsicIdentifier | Expression | PrivateName, { name: string }>
type WithValue = Extract<(ArgumentPlaceholder | SpreadElement | Expression), { value: string }>
type WithKey = Extract<(ObjectProperty | RestElement), { key: PrivateName | Expression }>

function getParent(path?: NodePath | null, deep = 1,): Node | void {
  let tempPath = path
  for (let i = 0; i < deep - 1; i++) {
    tempPath = tempPath?.parentPath
  }
  return tempPath?.parent
}

function decodeUnicode(str: string,): string {
  return str.replace(/\\u[\dA-F]{4}/gi, (match,) => {
    return String.fromCharCode(Number.parseInt(match.replace(/\\u/g, '',), 16,),)
  },)
}

function isInConsole(path: NodePath<StringLiteral> | NodePath<TemplateLiteral>,): boolean {
  const parent = path.parent as WithCallee
  const {
    type: parentType,
    callee: parentCallee,
  } = (parent)
  if (parentType === 'CallExpression' && parentCallee.type === 'MemberExpression') {
    const parentCalleeObject = parentCallee.object
    if (parentCalleeObject.type === 'Identifier' && parentCalleeObject.name === 'console') {
      return true
    }
  }
  return false
}

function findCommentExclude(path: NodePath,): boolean {
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

function matchVueFileSpecialRule(path: NodePath<StringLiteral>, id: string,): boolean {
  const pathParent = path.parent
  if (
    /\.vue$/.test(id,) &&
    pathParent.type === 'CallExpression' &&
    pathParent.callee.type === 'Identifier' &&
    pathParent.callee.name === '_createCommentVNode'
  ) {
    return true
  }
  // vue file has special sfc render export function
  if (/\.vue$/.test(id,) && pathParent.type === 'ArrayExpression') {
    const firstElement = pathParent.elements[0]
    if (firstElement?.type === 'StringLiteral' && firstElement.value === '__file') {
      const theParent = getParent(path, 2,)
      if (theParent && theParent.type === 'ArrayExpression') {
        const theParent2 = getParent(path, 3,)
        if (theParent2 && theParent2.type === 'CallExpression') {
          const theParent3 = getParent(path, 4,)
          if (
            'name' in theParent2.callee &&
            theParent2.callee.name === '_export_sfc' &&
            theParent3 &&
            theParent3.type === 'ExportDefaultDeclaration'
          ) {
            return true
          }
        }
      }
    }
  }
  return false
}

export function transform({
  id,
  code,
}: {
  id: string
  code: string
}, options: GlobalSetting,) {
  const collection: Record<string, string>[] = []
  let loadedDependency = false
  const {
    i18nCallee = '',
    dependency,
    localePattern,
  } = options || {}

  const ast = parse(code, {
    sourceType: 'unambiguous',
  },)

  const visitor: TraverseOptions = {
    // Finds if the user's dependency is in the import declaration
    ImportDeclaration(path,) {
      if (!dependency || loadedDependency) {
        return
      }
      if (dependency.path !== path.node.source.value) {
        return
      }
      const matched = path.node.specifiers.some((item,) => {
        if (item.type === 'ImportDefaultSpecifier') {
          return item.local.name === dependency.name
        } else if (item.type === 'ImportSpecifier') {
          return item.imported.type === 'Identifier' && item.imported.name === dependency.name
        }
        return false
      },)
      if (matched) {
        (loadedDependency = true)
      }
    },
    VariableDeclarator(path,) {
      if (!dependency || loadedDependency) {
        return
      }
      const initNode = path.node.init
      if (!initNode || initNode.type !== 'CallExpression') {
        return
      }
      let valueMatched = false
      let nameMatched = false
      const initNodeCallee = initNode.callee
      if (initNodeCallee.type === 'Identifier' && initNodeCallee.name === 'require') {
        const args = initNode.arguments
        if (args.length && dependency.path === (args[0] as WithValue).value) {
          valueMatched = true
        }
      }
      if (dependency.objectPattern) {
        if (path.node.id.type === 'ObjectPattern') {
          path.node.id.properties.forEach((item,) => {
            if ((item as WithKey).key.type === 'Identifier' && ((item as WithKey).key as WithName).name === dependency.name) {
              nameMatched = true
            }
          },)
        }
      } else {
        if (path.node.id.type === 'Identifier' && path.node.id.name === dependency.name) {
          nameMatched = true
        }
      }
      if (valueMatched && nameMatched) {
        loadedDependency = true
      }
    },
    StringLiteral(path,) {
      if (
        [ 'ExportAllDeclaration', 'ImportDeclaration', 'ExportNamedDeclaration', ].includes(path.parent.type,)
      ) {
        return
      }
      if (findCommentExclude(path,)) {
        return
      }

      if (isInConsole(path,)) {
        return
      }

      if (path.node.type === 'StringLiteral') {
        const val = path.node.value
        if (localePattern.test(val,)) {
          if (matchVueFileSpecialRule(path, id,)) {
            return
          }
          const res = localeWordPattern(val, options,)
          if (res && res.length) {
            const wordKeyMap: WordMap = {}
            res.forEach((word,) => {
              const key = setConfig(word, path.node, options,)
              collection.push({
                [key]: word,
              },)
              wordKeyMap[word] = key
            },)
            transCode({
              path,
              originValue: val,
              wordKeyMap,
              callee: i18nCallee,
            }, options,)
          }
        }
      }
    },
    TemplateLiteral(path,) {
      if (findCommentExclude(path,)) {
        return
      }
      if (isInConsole(path,)) {
        return
      }
      const hasWord = path.node.quasis.some(item =>
        localePattern.test(decodeUnicode(item.value.raw,),),
      )
      if (!hasWord) {
        return
      }
      transformTemplate({
        path,
        callee: i18nCallee,
      }, options,)
    },
  }
  const traverse = (babelTraverse as unknown as BabelTraverse).default || babelTraverse
  traverse(ast, visitor,)

  // Whether to collect the language to be internationalized
  const hasLang = !!collection.length

  // If user set the dependency, which wants to import, but now hasn't imported, and has language to be internationalized
  if (dependency && hasLang && !loadedDependency) {
    // Add the import declaration
    const {
      name,
      objectPattern,
      modules,
    } = dependency
    const isCommonJS = modules === Module.COMMONJS
    const i18nImport = isCommonJS ?
      `const ${objectPattern ? `{${name}}` : name} = require('${dependency.path}');` :
      `import ${objectPattern ? `{${name}}` : name} from '${dependency.path}'`
    const i18nImportAst = parse(i18nImport, {
      sourceType: 'module',
    },)
    const dependencyPreprocessing = dependency.preprocessing
    let preprocessingBody: Statement[] = []
    if (dependencyPreprocessing) {
      const preprocessingAst = parse(dependencyPreprocessing, {
        sourceType: 'module',
      },)
      preprocessingBody = preprocessingAst.program.body
    }
    ast.program.body = i18nImportAst.program.body.concat(ast.program.body,)
    if (isCommonJS) {
      ast.program.body.splice(1, 0, ...preprocessingBody,)
    } else {
      const firstNonImportIndex = ast.program.body.findIndex(
        item => item.type !== 'ImportDeclaration',
      )
      if (firstNonImportIndex !== -1) {
        ast.program.body.splice(firstNonImportIndex, 0, ...preprocessingBody,)
      }
    }
  }

  const generator = (babelGenerator as unknown as BabelGenerator).default || babelGenerator

  const {
    code: newCode,
    map,
  } = generator(
    ast,
    {
      sourceMaps: true,
    },
    code,
  )

  return {
    code: newCode,
    map,
  }
}
