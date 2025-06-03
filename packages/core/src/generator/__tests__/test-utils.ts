import type { Messages, } from '../types'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs'
import { resolve, } from 'path'

/**
 * 创建临时测试目录
 * @param {string} dir - 目录路径
 */
export function createTempDir(dir: string,) {
  if (existsSync(dir,)) {
    rmSync(dir, {
      recursive: true,
    },)
  }
  mkdirSync(dir, {
    recursive: true,
  },)
}

/**
 * 清理临时测试目录
 * @param {string} dir - 目录路径
 */
export function cleanTempDir(dir: string,) {
  if (existsSync(dir,)) {
    rmSync(dir, {
      recursive: true,
    },)
  }
}

/**
 * 创建测试用的翻译文件
 * @param {string} path - 文件路径
 * @param {Messages} content - 文件内容
 */
export function createTranslationFile(path: string, content: Messages,) {
  writeFileSync(path, JSON.stringify(content, null, 2,),)
}

/**
 * 读取翻译文件内容
 * @param {string} path - 文件路径
 * @returns {Messages} 文件内容
 */
export function readTranslationFile(path: string,): Messages {
  return JSON.parse(readFileSync(path, 'utf-8',),)
}

/**
 * 生成测试用的消息数据
 * @returns {Messages} 测试消息
 */
export function generateTestMessages(): Messages {
  return {
    hello: '你好',
    welcome: '欢迎',
    goodbye: '再见',
    nested: {
      morning: '早上好',
      evening: '晚上好',
    },
  }
}

/**
 * 验证翻译文件是否存在
 * @param {string} dir - 目录路径
 * @param {string[]} files - 文件名列表
 * @returns {boolean} 是否全部存在
 */
export function verifyTranslationFiles(dir: string, files: string[],): boolean {
  return files.every(file => existsSync(resolve(dir, file,),),)
}
