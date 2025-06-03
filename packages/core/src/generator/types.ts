/**
 * 国际化消息集合
 * @interface Messages
 * @example
 * ```typescript
 * const messages: Messages = {
 *   'hello': '你好',
 *   'welcome': {
 *     'morning': '早上好',
 *     'evening': '晚上好'
 *   }
 * }
 * ```
 */
export interface Messages {
  [key: string]: string | Messages
}

/**
 * 生成国际化文件的配置
 * @interface GenerateConfig
 * @property {string} filename - 基准语言文件名，如 'zh-CN.json'
 * @property {string} path - 生成文件的目标路径，如 './locales'
 * @property {string[]} langList - 需要生成的语言列表，如 ['en-US', 'ja-JP']
 * @example
 * ```typescript
 * const config: GenerateConfig = {
 *   filename: 'zh-CN.json',
 *   path: './locales',
 *   langList: ['en-US', 'ja-JP']
 * }
 * ```
 */
export interface GenerateConfig {
  filename: string
  path: string
  langList: string[]
}
