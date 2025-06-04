import { createHash, } from 'crypto'

export function generateKey(text: string,): string {
  return createHash('md5',).update(text,).digest('hex',)
}

export function ignoreAutoI18n<T, >(val: T,): T {
  return val
}
