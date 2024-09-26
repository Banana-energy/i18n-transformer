import { resolve } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { getWordMap } from './collectWords'

export function createLocalFile(output) {
  const dir = output.path
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  const localeWordConfig = getWordMap()
  const content = {}
  for (const key in localeWordConfig) {
    if (Object.prototype.hasOwnProperty.call(localeWordConfig, key)) {
      content[key] = localeWordConfig[key] || ''
    }
  }
  writeFileSync(resolve(dir, output.filename), JSON.stringify(content))
  if (output.langList) {
    const cn = JSON.parse(readFileSync(resolve(dir, output.filename), 'utf-8'))
    for (let i = 0; i < output.langList.length; i++) {
      const lang = output.langList[i]
      const langFile = resolve(dir, lang)
      const exist = existsSync(langFile) ? JSON.parse(readFileSync(langFile, 'utf-8')) : {}
      const config = {}
      if (exist) {
        Object.keys(cn).forEach((key) => {
          let originKey = key
          if (key.match(/-\d+$/)) {
            originKey = key.replace(/-\d+$/, '')
          }
          if (!exist[originKey]) {
            config[key] = cn[key]
            this.warn(`${lang} - ${key}未翻译`)
          } else {
            config[key] = exist[originKey]
          }
        })
      }
      writeFileSync(langFile, JSON.stringify(config, null, 2))
    }
  }
}
