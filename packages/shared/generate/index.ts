import type { OutputSetting, UploadSetting, } from '../common/collect'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs'
import { resolve, } from 'path'
import babel, { type PluginItem, } from '@babel/core'
import axios from 'axios'
import chalk from 'chalk'
import { getWordMap, } from './collectWords'

type JSONValue = string | JSONObject

interface JSONObject {
  [key: string]: JSONValue
}

export enum CodeSource {
  STATIC = 'FE_SCAN_UPLOAD',
  AUTOMATIC = 'FE_GENERATE_UPLOAD',
}

export enum AppTypeEnum {
  VUE2 = 'FE_VUE2',
  VUE3 = 'FE_VUE3',
}

export type AppType = 'FE_VUE2' | 'FE_VUE3'

export interface UploadPayload {
  app: string
  appType?: AppType
  codeSource: CodeSource
  langList: LangItem[]
}

export interface LangItem {
  locale: string
  json: JSONObject
}

function formatTime() {
  const now = new Date()
  const pad = (n: number,) => String(n,).padStart(2, '0',) // 补零函数
  return `${now.getFullYear()}-${pad(now.getDate(),)}-${pad(now.getMonth() + 1,)} ${pad(now.getHours(),)}:${pad(now.getMinutes(),)}:${pad(now.getSeconds(),)}`
}

export const log = {
  levels: {
    info: chalk.blue('INFO',),
    warn: chalk.yellow('WARN',),
    error: chalk.red('ERROR',),
  },
  log(level: string, message: string,) {
    const time = formatTime()
    const levelTag = this.levels[level] || 'LOG'
    console.log(`\n${chalk.gray(time,)} [${levelTag}]: ${message}`,)
  },
  info(message: string,) {
    this.log('info', message,)
  },
  warn(message: string,) {
    this.log('warn', message,)
  },
  error(message: string,) {
    this.log('error', message,)
  },
}

export function generate(output: OutputSetting,): void {
  const dir = output.path
  if (!existsSync(dir,)) {
    mkdirSync(dir, {
      recursive: true,
    },)
  }

  const localeWordConfig = getWordMap()
  const content: Record<string, string> = {}

  Object.keys(localeWordConfig,).forEach((key,) => {
    content[key] = localeWordConfig[key] || ''
  },)

  writeFileSync(resolve(dir, output.filename,), JSON.stringify(content,),)

  if (output.langList) {
    const cn = JSON.parse(readFileSync(resolve(dir, output.filename,), 'utf-8',),)
    output.langList.forEach((lang,) => {
      const langFile = resolve(dir, lang,)
      const exist = existsSync(langFile,) ? JSON.parse(readFileSync(langFile, 'utf-8',),) : {}
      const config: Record<string, string> = {}

      Object.keys(cn,).forEach((key,) => {
        const originKey = key.replace(/-\d+$/, '',)
        config[key] = exist[originKey] || cn[key]
      },)

      writeFileSync(langFile, JSON.stringify(config, null, 2,),)
    },)
  }
}

function transformWithBabel(content: string, filePath: string, presets: PluginItem[] = [], plugins: PluginItem[] = [],) {
  const { code, } = babel.transformSync(content, {
    filename: filePath,
    presets,
    plugins,
  },) || {}
  return code || ''
}

function evaluateModule(code: string,) {
  const moduleExports = {}
  const module = {
    exports: moduleExports,
  }
  const evalFunc = new Function('module', 'exports', code || '',)
  evalFunc(module, moduleExports,)
  return (module.exports as { default: JSONObject }).default || module.exports
}

/**
 * Read file content. Supports .json, .js, and .ts files.
 * @param filePath Path to the file
 */
async function readFileContent(filePath: string,): Promise<JSONObject> {
  const ext = filePath.split('.',).pop()

  const content = readFileSync(filePath, 'utf-8',)

  if (ext === 'json') {
    return JSON.parse(content,)
  }
  if (ext === 'js' || ext === 'ts') {
    const isTypeScript = ext === 'ts'

    // Use Babel to transform the JS/TS content into CommonJS format
    const transformedCode = transformWithBabel(content, filePath, [
      [ '@babel/preset-env', {
        targets: {
          node: 'current',
        },
      }, ],
      isTypeScript ? '@babel/preset-typescript' : '',
    ].filter(Boolean,), [
      '@babel/plugin-transform-modules-commonjs',
    ],)

    return evaluateModule(transformedCode,)
  } else {
    throw new Error(`Unsupported file format: ${filePath}`,)
  }
}

/**
 * Loads local configuration files and merges their contents.
 * @param config - The upload settings.
 * @returns A map of merged JSON objects by locale.
 */
export async function loadLocaleConfig(
  config: UploadSetting,
): Promise<Record<string, JSONObject>> {
  const dir = config.localePath

  if (!existsSync(dir,)) {
    throw new Error(`Locale path does not exist: ${dir}`,)
  }

  const localeData: Record<string, JSONObject> = {}

  for (const [ locale, filePaths, ] of Object.entries(config.localeConfig,)) {
    if (!filePaths || filePaths.length === 0) {
      throw new Error(`No file paths specified for locale: ${locale}`,)
    }

    for (const filePath of filePaths) {
      const absolutePath = resolve(dir, filePath,)

      if (!existsSync(absolutePath,)) {
        throw new Error(`File not found: ${absolutePath}`,)
      }

      const fileContent = await readFileContent(absolutePath,)
      localeData[locale] = {
        ...localeData[locale],
        ...fileContent,
      }
    }
  }

  return localeData
}

/**
 * Loads output files and returns their contents as LangItems.
 * @param output - The output settings.
 * @returns An array of LangItem objects.
 */
export async function loadOutputFiles(output: OutputSetting,): Promise<LangItem[]> {
  const outputPath = output.path

  if (!existsSync(outputPath,)) {
    throw new Error(`Output path does not exist: ${outputPath}`,)
  }

  const langList = [ output.filename, ...(output.langList || []), ]

  const promises: Promise<LangItem>[] = langList.map(async (filename,) => {
    const file = resolve(outputPath, filename,)
    const json = await readFileContent(file,)
    const locale = filename.replace(/\.json$/, '',)
    return {
      locale,
      json,
    }
  },)

  return Promise.all(promises,)
}

/**
 * The main upload function.
 * @param config - The upload settings.
 * @param output - The output settings.
 */
export async function upload(
  config: UploadSetting,
  output: OutputSetting,
): Promise<void> {
  if (!config.uploadUrl) {
    throw new Error('Upload URL is missing.',)
  }

  const localeConfigMap = await loadLocaleConfig(config,)

  const staticLangList: LangItem[] = Object.entries(localeConfigMap,).map(([ locale, json, ],) => ({
    locale,
    json,
  }),)

  const automaticLangList = await loadOutputFiles(output,)

  const staticPayload: UploadPayload = {
    app: config.app,
    appType: config.appType,
    codeSource: CodeSource.STATIC,
    langList: staticLangList,
  }

  const automaticPayload: UploadPayload = {
    app: config.app,
    appType: config.appType,
    codeSource: CodeSource.AUTOMATIC,
    langList: automaticLangList,
  }

  axios
    .post(config.uploadUrl, staticPayload,)
    .then((response,) => {
      if (response.data.success) {
        log.info(`Upload successful.`,)
      } else {
        log.warn(`Upload failed, static files will be used instead.`,)
        log.error(response.data.responseDesc,)
      }
    },)
    .catch((e,) => {
      log.warn(`Upload failed, static files will be used instead.`,)
      log.error(e,)
    },)
  axios
    .post(config.uploadUrl, automaticPayload,)
    .then((response,) => {
      if (response.data.success) {
        log.info(`Upload successful.`,)
      } else {
        log.warn(`Upload failed, static files will be used instead.`,)
        log.error(response.data.responseDesc,)
      }
    },)
    .catch((e,) => {
      log.warn(`Upload failed, static files will be used instead.`,)
      log.error(e,)
    },)
}
