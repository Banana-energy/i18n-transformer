# vite-plugin-i18n-transformer

An automatic i18n conversion Vite plugin.

一个自动转换代码中的中文为i18n翻译函数的 Vite 插件。

## Usage

```js
import i18nTransformer from "vite-plugin-i18n-transformer";
import {defineConfig} from 'vite'
import path from 'path'

export default defineConfig({
    plugins: [
        i18nTransformer({
            include: ['**.js', '**.vue'],                      // 针对什么文件进行国际化
            i18nCallee: 'useI18n().t',                         // 调用国际化函数
            dependency: {                                      // 国际化函数依赖引入配置
                name: 'useI18n',                                 // 国际化函数依赖的名称
                value: '@/hooks/web/useI18n',                    // 引入国际化函数的路径
                objectPattern: true                              // 引入的国际化函数依赖的形式。true为解构形式：import { name } from 'xxx'
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
