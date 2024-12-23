import type { Node, } from '@babel/types'
import type { AppType, } from '../generate'
import path from 'path'
import * as process from 'process'
import { getWordMap, setWordMap, type WordMap, } from '../generate/collectWords'
import { md5, } from './utils'

const rootPath = process.cwd()

export interface OutputSetting {
  filename: string
  path: string
  langList: string[]
}

export interface UploadSetting {
  app: string
  appType?: AppType
  uploadUrl: string
  localePath: string
  localeConfig: Record<string, string[]>
}

export enum Module {
  COMMONJS = 'CommonJS',
  ESNEXT = 'ESNext',
}

export interface DependencySetting {
  name: string
  path: string
  modules?: Module
  preprocessing?: string
  objectPattern: boolean
}

export interface GlobalSetting {
  output: OutputSetting
  localePattern: RegExp
  keyRule?: ((value: string, node: Node, map: WordMap) => string)
  include?: string[]
  exclude?: string[]
  i18nCallee: string
  dependency?: DependencySetting
  upload?: UploadSetting
}

export type Options = Partial<GlobalSetting>

function defaultKeyRule(value: string,): string {
  const key = md5(value,)
  // let index = 1
  const generateKey = (): string => {
    // while (exist[key]) {
    //   if (key.includes('-',)) {
    //     key = key.replace(/-\d+$/, `-${index}`,)
    //   } else {
    //     key = `${key}-${index}`
    //   }
    //   index++
    // }
    return key
  }
  return generateKey()
}

function initSetting(setting: Options,): GlobalSetting {
  const defaultFile: OutputSetting = {
    filename: 'zh.json',
    path: path.resolve(rootPath, './lang',),
    langList: [],
  }
  const defaultSetting: GlobalSetting = {
    output: {
      ...defaultFile,
    },
    localePattern: /[\u4E00-\u9FA5]+/, // Chinese
    keyRule: defaultKeyRule,
    include: undefined,
    exclude: undefined,
    i18nCallee: '',
    dependency: undefined,
    upload: undefined,
  }

  Object.keys(defaultSetting,).forEach((key,) => {
    if (setting[key as keyof GlobalSetting] !== undefined) {
      if (typeof defaultSetting[key as keyof GlobalSetting] === 'object') {
        Object.assign(defaultSetting[key as keyof GlobalSetting] as object, setting[key as keyof GlobalSetting],)
      } else {
        (defaultSetting[key as keyof GlobalSetting] as GlobalSetting[keyof GlobalSetting]) = setting[key as keyof GlobalSetting]
      }
    }
  },)

  return defaultSetting
}

export function init(options: Options,): { setting: GlobalSetting } {
  return {
    setting: initSetting(options,),
  }
}

export function setConfig(value: string, node: Node, option: GlobalSetting,): string {
  const keyRule = option.keyRule || defaultKeyRule
  const key = keyRule(value, node, getWordMap(),)
  setWordMap(key, value,)
  return key
}
