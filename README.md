# vite-plugin-i18n-transformer

An automatic i18n conversion Vite plugin.

一个自动转换代码中的中文为i18n翻译函数的 Vite 插件。

## Usage

npm包已发布至公司[npm私服](https://packages.aliyun.com/npm/npm-registry/guide)，配置好私服后即可通过npm安装。

### Vite

```shell
pnpm i -D @kapo/vite-plugin-i18n-transformer
```

```js
import Vue from "@vitejs/plugin-vue";
import VueJsx from "@vitejs/plugin-vue-jsx";
import I18nTransformer from "vite-plugin-i18n-transformer";
import {defineConfig} from 'vite'
import path from 'path'

export default defineConfig({
    plugins: [
        Vue(),
        VueJsx(),
        // 需要放在Vue和VueJsx插件之后
        I18nTransformer({
            include: ['**.js', '**.vue'],                        // 针对什么文件进行国际化
            exclude: [                                           // 项目内不需要国际化的文件或文件夹
                'src/locales/**',
                'node_modules/**',
                'src/store/modules/locale.ts'
            ],
            i18nCallee: 'useI18n().t',                           // 调用国际化函数
            dependency: {                                        // 国际化函数依赖引入配置
                name: 'useI18n',                                 // 国际化函数依赖的名称
                value: '@/hooks/web/useI18n',                    // 引入国际化函数的路径
                objectPattern: true,                             // 引入的国际化函数依赖的形式。true为解构形式：import { name } from 'xxx'
                preprocessing: 'const {t} = use18n()'            // 这行代码将添加至import依赖之后，可以用来做一些处理
            },
            output: {
                filename: 'zh-CN.json',                          // 生成中文配置的文件名
                langList: ['en-US.json'],                        // 生成其他语言配置的文件名列表
                path: path.resolve(process.cwd(), './lang'),     // 生成文件的路径
            }
        }),
    ],
})
```

### Webpack

Webpack由于vue-loader版本不同，需要分版本处理。

## Example

### Before

[![pA193RO.png](https://s21.ax1x.com/2024/09/28/pA193RO.png)](https://imgse.com/i/pA193RO)

### After

[![pA19UeA.png](https://s21.ax1x.com/2024/09/28/pA19UeA.png)](https://imgse.com/i/pA19UeA)

## Configuration

```ts
export interface OutputSetting {
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

export interface DependencySetting {
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
export type WordMap = Record<string, string>;

export interface GlobalSetting {
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
