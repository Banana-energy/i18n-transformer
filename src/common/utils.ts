import crypto from 'crypto'

export function md5(data: string,) {
  return crypto.createHash('md5',).update(data,).digest('hex',)
}

export function ignoreAutoI18n<T>(val: T,): T {
  return val
}
