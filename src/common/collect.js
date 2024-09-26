import { getWordMap, setWordMap } from '../generate/collectWords'
import path from 'node:path'

const rootPath = process.cwd()

export let globalSetting = {}

/**
 * Init setting
 * @param {Object} setting
 */
function initSetting(setting) {
  const defaultFile = {
    filename: 'zh.json',
    path: path.resolve(rootPath, './lang')
  }
  const defaultSetting = {
    mode: 'build',
    output: {
      generate: true,
      ...defaultFile
    },
    localePattern: /[\u4e00-\u9fa5]+/, // chinese
    keyRule: null,
    include: undefined,
    exclude: undefined,
    i18nCallee: '',
    dependency: undefined,
    alias: [],
    sourceMap: false,
    transform: true,
    translate: false
  }

  for (const key in defaultSetting) {
    if (setting[key] === undefined) {
      continue
    }
    const value = defaultSetting[key]
    if (value && value.constructor === Object) {
      Object.assign(defaultSetting[key], setting[key])
    } else {
      defaultSetting[key] = setting[key]
    }
  }

  globalSetting = defaultSetting
}

/**
 * Initialize
 */
export default function init(options) {
  initSetting(options)

  return {
    setting: globalSetting
  }
}

/**
 * Default rule to set the key for new word
 * @returns
 */
const defaultKeyRule = (value) => {
  return value
}

export const setConfig = (value, node) => {
  if (globalSetting.keyRule) {
    const key = globalSetting.keyRule(value, node, getWordMap())
    setWordMap(key, value)
    return key
  }
  return defaultKeyRule(value)
}
