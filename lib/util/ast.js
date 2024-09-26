const { getVueVersion } = require('./targets')
const compiler = require('@vue/compiler-sfc')
const fs = require('fs')
const ts = require('typescript')
const { generateHashByText } = require('./updateLangFile')

const DOUBLE_BYTE_REGEX = /[^\x00-\xff]/g

/**
 * @typedef {Object} textAttr
 * @property {{start: import("@vue/compiler-core").Position, end: import("@vue/compiler-core").Position}} range
 * @property {string} text
 * @property {string} name
 * @property {boolean} isAttr
 * @property {boolean} isString
 * @property {boolean} isTemplate
 * @property {boolean} isDirective
 * @property {boolean} isInterpolation
 */

/**
 * @param {string} code
 * @param {number} version
 * @returns {textAttr[]}
 */
function findTextInTemplate (code, version) {
  const matches = []

  if (version === 3) {
    /**
     * 遍历属性
     * @param {
     *   import("@vue/compiler-core").AttributeNode |
     *   import("@vue/compiler-core").DirectiveNode
     * } attr
     */
    const traverseAttr = (attr) => {
      const { type, name, value, loc: { start, end } } = attr
      // 属性
      if (type === 6 && value.content.match(DOUBLE_BYTE_REGEX)) {
        matches.push({
          range: { start, end },
          text: value.content,
          name,
          isAttr: true,
          isString: true,
          isTemplate: true,
          isDirective: false
        })
      }
      // 命令(v-if v-bind...)
      if (type === 7 && attr.exp.content.match(DOUBLE_BYTE_REGEX)) {
        matches.push({
          range: attr.exp.loc,
          text: attr.exp.content,
          name,
          isAttr: true,
          isString: true,
          isTemplate: true,
          isDirective: true
        })
      }
    }

    /**
     * 遍历节点
     * @param {
     *  import("@vue/compiler-sfc").ElementNode |
     *  import("@vue/compiler-core").TemplateChildNode
     * } node
     */
    const traverse = (node) => {
      const { type, content, loc } = node
      // 文字节点
      if (type === 2 && content && content.match(DOUBLE_BYTE_REGEX)) {
        const { start, end } = loc
        matches.push({
          range: { start, end },
          text: content,
          isAttr: false,
          isDirective: false,
          isString: true,
          isTemplate: true,
          isInterpolation: false
        })
      }
      // 插值表达式节点
      if (type === 5 && content && content.content?.match(DOUBLE_BYTE_REGEX)) {
        const { start, end } = loc
        matches.push({
          range: { start, end },
          text: loc.source,
          isAttr: false,
          isString: true,
          isTemplate: true,
          isDirective: false,
          isInterpolation: true
        })
      }

      if (node.props && node.props.length) {
        node.props.forEach(traverseAttr)
      }

      if (node.children && node.children.length) {
        node.children.forEach(traverse)
      }
    }

    const { descriptor, errors } = compiler.parse(code)
    if (!errors.length) {
      const { template } = descriptor
      const { ast } = template
      traverse(ast)
    }
  }
  return matches
}

function findTextInScript (code, version) {
  const matches = []
  if (version === 3) {
    const traverse = (node) => {
      switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
        /** 判断 Ts 中的字符串含有中文 */
        if (node.text.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart()
          const end = node.getEnd()
          const range = { start, end }
          matches.push({
            range,
            text: node.text,
            isAttr: false,
            isString: true
          })
        }
        break
      case ts.SyntaxKind.TemplateExpression:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral: {
        const { pos, end } = node
        const templateContent = code.slice(pos, end)

        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const nodeStart = node.getStart()
          const nodeEnd = node.getEnd()
          const range = { start: nodeStart, end: nodeEnd }
          matches.push({
            range,
            text: code.slice(nodeStart + 1, nodeEnd - 1),
            isAttr: false,
            isString: true
          })
        }
      }
      }
      ts.forEachChild(node, traverse)
    }

    const ast = ts.createSourceFile(
      '',
      code,
      ts.ScriptTarget.ES2015,
      true,
      ts.ScriptKind.TSX
    )

    ts.forEachChild(ast, traverse)
  }
  return matches
}

/**
 *
 * @param {string} source
 * @param {textAttr[]} textInTemplate
 * @returns {string}
 */
function replaceTextInTemplate (source, textInTemplate) {
  for (let i = textInTemplate.length - 1; i >= 0; i--) {
    const { range, name, text, isInterpolation, isAttr, isDirective } = textInTemplate[i]
    const { start, end } = range
    let left = source.slice(0, start.offset)
    let right = source.slice(end.offset)
    let hashKey
    if (isInterpolation) {
      // 插值表达式
      const matchList = []
      let replaceText
      text.replace(/'([^']*)'|"([^"]*)"|`([^`]*)`/g, (match, p1, p2, p3, offset) => {
        const matched = p1 || p2 || p3
        matchList.push({ match, matched, offset, p3 })
      })
      for (let j = matchList.length - 1; j >= 0; j--) {
        const { match, matched, offset, p3 } = matchList[j]
        const length = match.length
        left = source.slice(0, start.offset + offset)
        right = source.slice(start.offset + offset + length + 1)
        hashKey = generateHashByText(matched)
        replaceText = `$t('${hashKey}')`
        if (p3) {
          // 反引号包裹的字符串可能包含变量，`测试${test}` => $t('test', {test: test})
          const varObj = {}
          matched.replace(/\${([a-zA-Z_][a-zA-Z0-9_]*)}/g, (_, p1) => {
            varObj[p1] = p1
          })
          if (Object.keys(varObj).length) {
            const str = JSON.stringify(varObj).replaceAll('"', '')
            replaceText = `$t('${hashKey}', ${str})`
          }
        }
        source = left + replaceText + right
      }
    } else if (isAttr) {
      if (isDirective) {
        if (/^(if|else-if)$/.test(name)) {
          // TODO v-if处理
          console.log(text)
        } else if (name === 'bind') {
          // TODO v-bind处理
        }
      }
    } else {
      hashKey = generateHashByText(text)
      source = left + `{{ $t('${hashKey}') }}` + right
    }
  }
  return source
}

function replaceTextInScript (source, textInScript) {

}

const convert = (file) => {
  const version = getVueVersion()
  let source = fs.readFileSync(file, {
    encoding: 'utf-8'
  })
  const textInTemplate = findTextInTemplate(source, version)
  source = replaceTextInTemplate(source, textInTemplate)
  let textInScript = []
  if (version === 3) {
    const { descriptor, errors } = compiler.parse(source)
    if (!errors.length) {
      const { scriptSetup, script } = descriptor
      if (scriptSetup) {
        const { content } = scriptSetup
        textInScript = findTextInScript(content, version)
      }
      if (script) {
        const { content } = script
        textInScript = textInScript.concat(findTextInScript(content, version))
      }
    }
  }

  console.log(textInScript)
  // TODO 写入新文件
}

module.exports.convert = convert
