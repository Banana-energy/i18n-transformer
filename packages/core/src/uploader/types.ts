/**
 * 上次至翻译平台配置
 * 该模块功能是将翻译资源上传至翻译平台
 * 与后端强相关，需要后端支持
 */
import type { Messages, } from '@higgins-mmt/core'

export type AppType = 'FE_VUE2' | 'FE_VUE3'

/**
 * 上传策略
 * - INSERT_ONLY：只插入新键，原有键不作变更
 * - INSERT_UPDATE：不仅插入新键，还覆盖更新原有键的文本值
 * - INSERT_CLEAN：只插入新键，并删去此次请求中未出现的键
 * - UPSERT_CLEAN：不仅插入新键，还覆盖更新原有键的文本值，并删去此次请求中未出现的键
 *
 * 在服务器端构建翻译资源时，请选择UPSERT_CLEAN以清理冗余的翻译资源
 */
export type UploadStrategy = 'INSERT_ONLY' | 'INSERT_UPDATE' | 'INSERT_CLEAN' | 'UPSERT_CLEAN'

/** 上传至翻译平台配置 */
export interface UploadConfig {
  /** 标识应用，每个应用唯一 */
  app: string
  /** 翻译平台接口的url */
  url: string
  /** 应用类型 */
  appType: AppType
  /** 本地语言文件路径 */
  localePath?: string
  /** 本地语言文件配置，key为对应的语种，value为对应语种翻译文件名，可传多个 */
  localeConfig?: Record<string, string[]>
  uploadStrategy?: UploadStrategy
}

export interface LangItem {
  /** 语种 */
  locale: string
  /** 语种翻译内容 */
  json: Messages
}

export interface UploadParams {
  app: string
  appType: AppType
  codeSource: 'FE_SCAN_UPLOAD' | 'FE_GENERATE_UPLOAD'
  langList: LangItem[]
  strategy?: UploadStrategy
}

export interface UploadResponse {
  code: number
  message: string
  success: boolean
}
