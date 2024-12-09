import { resolve, } from 'path';
import {
  existsSync, mkdirSync, readFileSync, writeFileSync,
} from 'fs';
import { getWordMap, } from './collectWords';
import type { OutputSetting, } from '../common/collect';

export function generate(output: OutputSetting,): void {
  const dir = output.path;
  if (!existsSync(dir,)) {
    mkdirSync(dir, {
      recursive: true,
    },);
  }

  const localeWordConfig = getWordMap();
  const content: Record<string, string> = {};

  Object.keys(localeWordConfig,).forEach((key,) => {
    content[key] = localeWordConfig[key] || '';
  },);

  writeFileSync(resolve(dir, output.filename,), JSON.stringify(content,),);

  if (output.langList) {
    const cn = JSON.parse(readFileSync(resolve(dir, output.filename,), 'utf-8',),);
    output.langList.forEach((lang,) => {
      const langFile = resolve(dir, lang,);
      const exist = existsSync(langFile,) ? JSON.parse(readFileSync(langFile, 'utf-8',),) : {};
      const config: Record<string, string> = {};

      Object.keys(cn,).forEach((key,) => {
        const originKey = key.replace(/-\d+$/, '',);
        config[key] = exist[originKey] || cn[key];
      },);

      writeFileSync(langFile, JSON.stringify(config, null, 2,),);
    },);
  }
}
