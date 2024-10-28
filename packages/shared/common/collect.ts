import {
  type WordMap, getWordMap, setWordMap,
} from '../generate/collectWords'
import type { Node, } from '@babel/types'
import path from 'node:path'
import { md5, } from './utils';

const rootPath = process.cwd()

export interface OutputSetting {
  filename: string;
  path: string;
  langList: string[]
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
  output: OutputSetting;
  localePattern: RegExp;
  keyRule?: ((value: string, node: Node, map: WordMap) => string);
  include?: string[];
  exclude?: string[];
  i18nCallee: string;
  dependency?: DependencySetting;
}

export type Options = Partial<GlobalSetting>

const defaultKeyRule = (value: string,) => {
  const key = md5(value,)
  // let index = 1
  const generateKey = () => {
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

function initSetting(setting: Options,) {
  const defaultFile: OutputSetting = {
    filename: 'zh.json',
    path: path.resolve(rootPath, './lang',),
    langList: [],
  }
  const defaultSetting: GlobalSetting = {
    output: {
      ...defaultFile,
    },
    localePattern: /[\u4e00-\u9fa5]+/, // Chinese
    keyRule: defaultKeyRule,
    include: undefined,
    exclude: undefined,
    i18nCallee: '',
    dependency: undefined,
  }

  Object.keys(defaultSetting,).forEach((key,) => {
    if (setting[key as keyof GlobalSetting] !== undefined) {
      if (typeof defaultSetting[key as keyof GlobalSetting] === 'object') {
        Object.assign(defaultSetting[key as keyof GlobalSetting] as object, setting[key as keyof GlobalSetting],);
      } else {
        (defaultSetting[key as keyof GlobalSetting] as GlobalSetting[keyof GlobalSetting]) = setting[key as keyof GlobalSetting];
      }
    }
  },);

  return defaultSetting
}

export function init(options: Options,) {
  return {
    setting: initSetting(options,),
  }
}

export const setConfig = (value: string, node: Node, option: GlobalSetting,) => {
  const keyRule = option.keyRule || defaultKeyRule
  const key = keyRule(value, node, getWordMap(),);
  setWordMap(key, value,);
  return key;
}
