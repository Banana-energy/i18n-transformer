# i18n-transformer

A Vite/Webpack plugin/loader that automatically transforms Chinese text in JS code into i18n translation functions based
on AST.

一个基于AST自动转换JS代码中的中文为i18n翻译函数的 Vite/Webpack 插件/loader。

理论上支持任何JS框架，目前只测试了Vue2/3。

## Usage

### Vite

```shell
  pnpm i -D @higgins-mmt/vite-plugin-i18n-transformer
```

```js
// vite.config.ts
import Vue from "@vitejs/plugin-vue";
import VueJsx from "@vitejs/plugin-vue-jsx";
import I18nTransformer from "@higgins-mmt/vite-plugin-i18n-transformer";
import {defineConfig} from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [
    Vue(),
    VueJsx(),
    // 需要放在Vue和VueJsx插件之后
    I18nTransformer({
      include: ['**.js', '**.vue'],                         // 针对什么文件进行国际化
      exclude: [                                            // 项目内不需要国际化的文件或文件夹
        'src/locales/**',
        'node_modules/**',
        'src/store/modules/locale.ts'
      ],
      i18nCallee: 'useI18n().t',                            // 调用国际化函数
      dependency: {                                         // 国际化函数依赖引入配置
        name: 'useI18n',                                    // 国际化函数依赖的名称
        path: '@/hooks/web/useI18n',                        // 引入国际化函数的路径
        objectPattern: true,                                // 引入的国际化函数依赖的形式。true为解构形式：import { name } from 'xxx'
        preprocessing: 'const {t} = useI18n()'              // 这行代码将添加至import依赖之后，可以用来做一些处理
      },
      output: {
        filename: 'zh-CN.json',                             // 生成中文配置的文件名
        langList: ['en-US.json'],                           // 生成其他语言配置的文件名列表
        path: path.resolve(process.cwd(), './public/lang'), // 生成文件的路径
      },
      upload: {                                             // 上传翻译资源配置，如不需要上传可不传           
        uploadUrl: 'uploadUrl',                             // 上传接口地址
        app: 'APP_NAME',                                    // 上传参数，应用名称
        localePath: path.join(process.cwd(), 'src/lang'),   // 本地已存在翻译资源文件夹路径
        localeConfig: {                                     // 本地已存在翻译资源文件名
          en: ['en.json'],
          zh: ['zh.json'],
        },
      },
    }),
  ],
})
```

### Webpack

```shell
  npm i -D @higgins-mmt/webpack-plugin-i18n-transformer
```

Webpack由于vue-loader版本不同，需要分版本处理。

以下是 `vue-loader15.x` 示例

```js
// vue.config.js
const {I18nTransformerPlugin} = require('@higgins-mmt/webpack-plugin-i18n-transformer')
module.exports = {
  ...,
  plugins: [
    new I18nTransformerPlugin({
      filename: 'zh.json',
      langList: ['en.json'],
      path: path.join(process.cwd(), 'public/static/locales'),
    }, {
      uploadUrl: 'uploadUrl',
      app: 'APP_NAME',
      localePath: path.join(process.cwd(), ('src/lang')),
      localeConfig: {
        en: ['en.json'],
        zh: ['zh.json'],
      },
    }),
  ],
  chainWebpack: (config) => {
    const i18nOptions = {
      include: ['**.js', '**.jsx', '**.vue'],
      exclude: ['src/lang/**', 'node_modules/**', 'src/main.js',],
      i18nCallee: 'i18n.default.t',
      dependency: {
        name: 'i18n',
        path: '@/lang',
        modules: 'CommonJS',
      },
    }

    config.module
      .rule('js')
      .use('i18n-loader')
      .loader('@higgins-mmt/webpack-plugin-i18n-transformer')
      .options(i18nOptions)
      .before('babel-loader')
      .end()
      .end()
      .rule('vueTemplateRender')
      .test(/\.vue$/)
      .resourceQuery(/type=template/)
      .enforce('post')
      .use('i18n-loader')
      .loader('@higgins-mmt/webpack-plugin-i18n-transformer')
      .options(i18nOptions)
  }
}
```

### Special

对于项目中可能存在并不想被翻译的项，在 vite/webpack 包中提供了 `ignoreAutoI18n` 函数，将不想翻译的条目使用该函数包裹起来即可。

为什么不采用类似 // eslint-disabled-next-line 形式？

https://github.com/vuejs/core/issues/12114

## Example

### Before

[![pA193RO.png](https://s21.ax1x.com/2024/09/28/pA193RO.png)](https://imgse.com/i/pA193RO)

### After

[![pA19UeA.png](https://s21.ax1x.com/2024/09/28/pA19UeA.png)](https://imgse.com/i/pA19UeA)

## Configuration

```ts
interface OutputSetting {
  /**
   * 生成中文配置的文件名
   */
  filename: string;
  /**
   * 生成文件的路径
   */
  path: string;
  /**
   * 生成其他语言配置的文件名列表
   */
  langList: string[]
}

enum AppType {
  VUE3 = 'FE_VUE3',
  VUE2 = 'FE_VUE2',
}

interface UploadSetting {
  /**
   * 上传参数，应用名称
   */
  app: string;
  /**
   * 上传参数，应用类型，不传默认webpack中使用AppType.VUE2，vite中使用AppType.VUE3
   */
  appType: AppType;
  /**
   * 上传接口地址
   */
  uploadUrl: string;
  /**
   * 本地已存在翻译资源文件夹路径
   */
  localePath: string;
  /**
   * 本地已存在翻译资源文件配置，key为对应的语种，value为对应语种翻译文件名，可传多个
   */
  localeConfig: Record<string, string[]>;
}

interface DependencySetting {
  /**
   * 国际化函数依赖的名称
   */
  name: string
  /**
   * 引入国际化函数的路径
   */
  path: string
  /**
   * 引入的国际化函数依赖的形式
   * 设置true为解构形式：import { name } from 'path'
   */
  objectPattern: boolean
  /**
   * 这行代码将添加至import依赖之后，可以用来做一些处理
   */
  preprocessing?: string
}

/**
 * 收集到的国际化词条，key为通过keyRule生成的key，value为收集到的中文
 */
type WordMap = Record<string, string>;

interface GlobalSetting {
  /**
   * 生产文件配置
   */
  output: OutputSetting;
  /**
   * 匹配需要翻译的正则表达式，默认/[\u4e00-\u9fa5]/
   */
  localePattern: RegExp;
  /**
   * 自定义生成key的函数，参数为收集到的中文，中文在AST中对应的Node，收集到的所有词条配置
   * 默认规则为通过中文生成一串md5作为key，重复的中文在md5后添加 -1，-2
   */
  keyRule?: ((value: string, node: Node, map: WordMap) => string);
  /**
   * 针对哪些文件进行处理
   */
  include?: string[];
  /**
   * 排除哪些文件
   */
  exclude?: string[];
  /**
   * 调用国际化函数
   */
  i18nCallee: string;
  /**
   * 国际化依赖配置
   */
  dependency?: DependencySetting;
}
```

## Thanks

- [@pekonchan](https://github.com/pekonchan/rollup-plugin-i18n-auto)
