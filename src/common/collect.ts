import {
  getWordMap, setWordMap, WordMap,
} from '../generate/collectWords'
import { Node, } from '@babel/types'
import path from 'node:path'
import { md5, } from './utils';

const rootPath = process.cwd()

export interface FileSetting {
  filename: string;
  path: string;
  langList: string[]
}

export interface OutputSetting {
  filename: string;
  path: string;
  langList: string[]
}

export interface DependencySetting {
  name: string
  value: string
  objectPattern: boolean
}

export interface GlobalSetting {
  output: OutputSetting;
  localePattern: RegExp;
  keyRule?: ((value: string, node?: Node, map?: Record<string, string>) => string) | null;
  include?: string[];
  exclude?: string[];
  i18nCallee: string;
  dependency?: DependencySetting;
}

export let globalSetting: GlobalSetting = {} as GlobalSetting;

function initSetting(setting: Partial<GlobalSetting>,) {
  const defaultFile: FileSetting = {
    filename: 'zh.json',
    path: path.resolve(rootPath, './lang',),
    langList: [],
  }
  const defaultSetting: GlobalSetting = {
    output: {
      ...defaultFile,
    },
    localePattern: /[\u4e00-\u9fa5]+/, // chinese
    keyRule: null,
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

  globalSetting = defaultSetting
}

/**
 * Initialize
 */
export default function init(options: Partial<GlobalSetting>,) {
  initSetting(options,)

  return {
    setting: globalSetting,
  }
}

const defaultKeyRule = (value: string, node: Node, exist: WordMap,) => {
  let key = md5(value,)
  let index = 1
  const generateKey = () => {
    while (exist[key]) {
      if (key.includes('-',)) {
        key = key.replace(/-\d+$/, `-${index}`,)
      } else {
        key = `${key}-${index}`
      }
      index++
    }
    return key
  }
  return generateKey()
}

export const setConfig = (value: string, node: Node,) => {
  const keyRule = globalSetting.keyRule || defaultKeyRule
  const key = keyRule(value, node, getWordMap(),);
  setWordMap(key, value,);
  return key;

}
