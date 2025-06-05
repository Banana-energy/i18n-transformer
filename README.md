# i18n-transformer
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Banana-energy/i18n-transformer)

一个自动化的国际化转换工具，支持 Vite 和 Webpack 插件形式使用。

## 特性

- 🚀 自动识别和转换需要国际化的文本
- 🔌 支持 Vite 和 Webpack 插件形式使用
- 🎯 支持字符串字面量和模板字符串的转换
- 📦 支持与翻译平台的集成
- 🛠️ 提供灵活的配置选项

## 安装

### 环境要求

- Node.js >= 14

### Vite 插件

```bash
# pnpm
pnpm add -D @higgins-mmt/vite-plugin

# npm
npm install -D @higgins-mmt/vite-plugin

# yarn
yarn add -D @higgins-mmt/vite-plugin
```

### Webpack 插件

```bash
# pnpm
pnpm add -D @higgins-mmt/webpack-plugin

# npm
npm install -D @higgins-mmt/webpack-plugin

# yarn
yarn add -D @higgins-mmt/webpack-plugin
```

## 使用指南

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { i18nTransformer } from '@higgins-mmt/vite-plugin'

export default defineConfig({
  plugins: [
    i18nTransformer({
      // 配置选项
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['node_modules/**'],
      i18nCallee: 't',
      // 翻译平台配置（可选）
      upload: {
        app: 'your-app-name',
        url: 'your-translation-platform-url',
        appType: 'FE_VUE3',
        uploadStrategy: 'INSERT_ONLY'
      }
    })
  ]
})
```

### Webpack 配置

```typescript
// webpack.config.js
const { I18nTransformerPlugin } = require('@higgins-mmt/webpack-plugin')

module.exports = {
  // ...其他配置
  plugins: [
    new I18nTransformerPlugin({
      // 配置选项
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['node_modules/**'],
      i18nCallee: 't',
      // 翻译平台配置（可选）
      upload: {
        app: 'your-app-name',
        url: 'your-translation-platform-url',
        appType: 'FE_VUE3',
        uploadStrategy: 'INSERT_ONLY'
      }
    })
  ]
}
```

## 配置选项

### 转换器配置

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| include | string[] | - | 需要处理的文件匹配模式 |
| exclude | string[] | - | 需要排除的文件匹配模式 |
| i18nCallee | string | '' | i18n 函数名，如 't' 或 'i18n' |
| localePattern | RegExp | /[\u4E00-\u9FA5]+/ | 匹配需要转换文本的正则，默认匹配中文字符 |
| generateKey | (text: string, node: Node, messages: Messages) => string | - | 自定义生成 key 的函数 |
| dependency | { path: string, name: string, module: 'commonjs' \| 'esm', objectPattern?: boolean } | - | i18n 库的导入配置 |

### 翻译平台配置

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| app | string | - | 应用标识，每个应用唯一 |
| url | string | - | 翻译平台 API 地址 |
| appType | 'FE_VUE2' \| 'FE_VUE3' | - | 应用类型 |
| uploadStrategy | 'INSERT_ONLY' \| 'INSERT_UPDATE' \| 'INSERT_CLEAN' \| 'UPSERT_CLEAN' | - | 上传策略 |
| localePath | string | - | 本地语言文件路径 |
| localeConfig | Record<string, string[]> | - | 本地语言文件配置 |

#### 上传策略说明

- INSERT_ONLY：只插入新键，原有键不作变更
- INSERT_UPDATE：不仅插入新键，还覆盖更新原有键的文本值
- INSERT_CLEAN：只插入新键，并删去此次请求中未出现的键
- UPSERT_CLEAN：不仅插入新键，还覆盖更新原有键的文本值，并删去此次请求中未出现的键

## 高级功能

### 忽略自动转换

如果某些文本不需要进行国际化转换，可以使用 `ignoreAutoI18n` 标记：

```typescript
import { ignoreAutoI18n } from '@higgins-mmt/core'

// 使用函数标记
const text = ignoreAutoI18n('不需要转换的文本')
```

### 自定义转换规则

你可以通过配置自定义转换规则：

```typescript
{
  // 自定义生成 key 的函数
  generateKey: (text: string, node: Node, messages: Messages) => {
    return `custom.${text}`
  },
  // 自定义匹配模式（例如匹配所有文本）
  localePattern: /.+/,
  // 自定义转换函数名
  i18nCallee: 't'
}
```

## 常见问题

### 1. 如何处理动态文本？

对于包含变量的文本，插件会自动处理模板字符串：

```typescript
// 转换前
const text = `Hello, ${name}`

// 转换后
const text = t('hello_name', { name })
```

### 2. 如何处理 HTML/JSX 中的文本？

插件会自动处理 JSX 中的文本内容：

```tsx
// 转换前
<div>Hello, World</div>

// 转换后
<div>{t('hello_world')}</div>
```

## 贡献指南

### 开发环境设置

1. 克隆仓库
```bash
git clone https://github.com/your-username/i18n-transformer.git
cd i18n-transformer
```

2. 安装依赖
```bash
pnpm install
```

3. 构建项目
```bash
pnpm build
```

4. 运行测试
```bash
pnpm test
```

## 许可证

本项目基于 [MIT 许可证](./LICENSE) 开源。

## 作者

- Kapo.Yang 