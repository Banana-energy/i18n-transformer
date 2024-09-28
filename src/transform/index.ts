import {
  parse, ParseResult,
} from '@babel/parser'
import traverse, {
  NodePath, TraverseOptions,
} from '@babel/traverse'
import generator from '@babel/generator'
import {
  localeWordPattern, transCode, transformTemplate,
} from './transform'
import {
  GlobalSetting, setConfig,
} from '../common/collect'
import {
  ArgumentPlaceholder,
  Comment,
  Expression,
  File,
  Node,
  ObjectProperty,
  PrivateName,
  RestElement,
  SpreadElement,
  StringLiteral,
  Super,
  TemplateLiteral,
  V8IntrinsicIdentifier,
} from '@babel/types'
import { WordMap, } from '../generate/collectWords';

function getParent(path?: NodePath | null, deep = 1,) {
  let tempPath = path;
  for (let i = 0; i < deep - 1; i++) {
    tempPath = tempPath?.parentPath;
  }
  return tempPath?.parent;
}

function decodeUnicode(str: string,) {
  return str.replace(/\\u[\dA-F]{4}/gi, (match,) => {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, '',), 16,),)
  },)
}

type WithCallee = Extract<Node, { callee: Expression | Super | V8IntrinsicIdentifier; }>;

function isInConsole(path: NodePath<StringLiteral> | NodePath<TemplateLiteral>,) {
  const parent = path.parent as WithCallee
  const {
    type: parentType, callee: parentCallee,
  } = (parent)
  if (parentType === 'CallExpression' && parentCallee.type === 'MemberExpression') {
    const parentCalleeObject = parentCallee.object
    if (parentCalleeObject.type === 'Identifier' && parentCalleeObject.name === 'console') {
      return true
    }
  }
  return false
}

function findCommentExclude(path: NodePath, ast: ParseResult<File>,) {
  //If from TemplateLiteral to StringLiteral
  if (!path.node.loc) {
    return false
  }
  const startLine = path.node.loc.start.line
  const leadingComments = path.node.leadingComments
  const check = (commentList?: Comment[] | null,) => {
    if (commentList && commentList.length) {
      return commentList.some((comment,) => {
        return (
          comment.type === 'CommentBlock' &&
          comment.value.trim() === 'no-i18n-auto' &&
          comment.loc?.start.line === startLine
        )
      },)
    }
    return false
  }
  return check(leadingComments,) || check(ast.comments,)
}

type WithName = Extract<V8IntrinsicIdentifier | Expression | PrivateName, { name: string }>

function matchVueFileSpecialRule(path: NodePath<StringLiteral>, id: string,) {
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
            (theParent2.callee as WithName).name === '_export_sfc' &&
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

type WithValue = Extract<(ArgumentPlaceholder | SpreadElement | Expression), { value: string; }>;
type WithKey = Extract<(ObjectProperty | RestElement), { key: PrivateName | Expression; }>;

export default function({
  id, code,
}: { id: string; code: string }, options: GlobalSetting,) {
  const collection = []
  let loadedDependency = false
  const {
    i18nCallee = '',
    dependency, // {name, value, objectPattern}
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
        ['ExportAllDeclaration', 'ImportDeclaration', 'ExportNamedDeclaration',].indexOf(
          path.parent.type,
        ) !== -1
      ) {
        return
      }
      if (findCommentExclude(path, ast,)) {
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
          const res = localeWordPattern(val,)
          if (res && res.length) {
            const wordKeyMap: WordMap = {}
            res.forEach((word,) => {
              const key = setConfig(word, path.node,)
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
            },)
          }
        }
      }
    },
    TemplateLiteral(path,) {
      if (findCommentExclude(path, ast,)) {
        return
      }
      if (isInConsole(path,)) {
        return
      }
      const hasWord = path.node.quasis.some((item,) =>
        localePattern.test(decodeUnicode(item.value.raw,),),
      )
      if (!hasWord) {
        return
      }
      transformTemplate({
        path, callee: i18nCallee,
      },)
    },
  }
  traverse(ast, visitor,)

  // Whether to collect the language to be internationalized
  const hasLang = !!collection.length

  // If user set the dependency, which wants to import, but now hasn't imported, and has language to be internationalized
  if (dependency && hasLang && !loadedDependency) {
    // Add the import declaration
    const {
      name, objectPattern,
    } = dependency
    const i18nImport = `import ${objectPattern ? '{' + name + '}' : name} from '${
      dependency.path
    }'`
    const i18nImportAst = parse(i18nImport, {
      sourceType: 'module',
    },)
    ast.program.body = i18nImportAst.program.body.concat(ast.program.body,)
  }

  const {
    code: newCode, map,
  } = generator(
    ast,
    {
      sourceMaps: true,
    },
    code,
  )

  return {
    code: newCode, map,
  }
}
