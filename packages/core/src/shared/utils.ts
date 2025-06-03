import { createHash, } from 'crypto'

export function generateKey(text: string,): string {
  return createHash('md5',).update(text,).digest('hex',)
}
