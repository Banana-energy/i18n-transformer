import type { OutputSetting, UploadSetting, } from '../common/collect'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs'
import { resolve, } from 'path'
import axios from 'axios'
import chalk from 'chalk'
import { getWordMap, } from './collectWords'

type JSONValue = string | JSONObject

interface JSONObject {
  [key: string]: JSONValue
}

enum CodeSource {
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
  const pad = n => String(n,).padStart(2, '0',) // 补零函数
  return `${now.getFullYear()}-${pad(now.getDate(),)}-${pad(now.getMonth() + 1,)} ${pad(now.getHours(),)}:${pad(now.getMinutes(),)}:${pad(now.getSeconds(),)}`
}

const log = {
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

/**
 * Reads and parses a JSON file.
 * @param filePath - The path to the JSON file.
 * @returns The parsed JSON object.
 * @throws Error if the file does not exist or is invalid.
 */
function readJsonFile(filePath: string,): JSONObject {
  if (!existsSync(filePath,)) {
    throw new Error(`File not found: ${filePath}`,)
  }
  try {
    const content = readFileSync(filePath, 'utf-8',)
    return JSON.parse(content,)
  } catch (error) {
    throw new Error(`Failed to read or parse JSON file: ${filePath}. Error: ${error}`,)
  }
}

/**
 * Loads local configuration files and merges their contents.
 * @param config - The upload settings.
 * @returns A map of merged JSON objects by locale.
 */
function loadLocaleConfig(config: UploadSetting,): Record<string, JSONObject> {
  const dir = config.localePath

  if (!existsSync(dir,)) {
    throw new Error(`Locale path does not exist: ${dir}`,)
  }

  return Object.entries(config.localeConfig,).reduce((acc, [ locale, filePaths, ],) => {
    if (!filePaths || filePaths.length === 0) {
      throw new Error(`No file paths specified for locale: ${locale}`,)
    }

    filePaths.forEach((filePath,) => {
      const absolutePath = resolve(dir, filePath,)
      const fileContent = readJsonFile(absolutePath,)
      acc[locale] = {
        ...acc[locale],
        ...fileContent,
      }
    },)

    return acc
  }, {} as Record<string, JSONObject>,)
}

/**
 * Loads output files and returns their contents as LangItems.
 * @param output - The output settings.
 * @returns An array of LangItem objects.
 */
function loadOutputFiles(output: OutputSetting,): LangItem[] {
  const outputPath = output.path

  if (!existsSync(outputPath,)) {
    throw new Error(`Output path does not exist: ${outputPath}`,)
  }

  const langList = [ output.filename, ...(output.langList || []), ]

  return langList.map((filename,) => {
    const file = resolve(outputPath, filename,)
    const json = readJsonFile(file,)
    const locale = filename.replace(/\.json$/, '',)
    return {
      locale,
      json,
    }
  },)
}

/**
 * The main upload function.
 * @param config - The upload settings.
 * @param output - The output settings.
 */
export function upload(
  config: UploadSetting,
  output: OutputSetting,
): void {
  if (!config.uploadUrl) {
    throw new Error('Upload URL is missing.',)
  }

  const localeConfigMap = loadLocaleConfig(config,)

  const staticLangList: LangItem[] = Object.entries(localeConfigMap,).map(([ locale, json, ],) => ({
    locale,
    json,
  }),)

  const automaticLangList = loadOutputFiles(output,)

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
