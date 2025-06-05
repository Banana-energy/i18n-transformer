import { describe, expect, it, } from 'vitest'
import { generateKey, ignoreAutoI18n, } from '../utils'

describe('utils', () => {
  it('should generate a valid key', () => {
    expect(generateKey('hello world',),).length(32,)
  },)

  it('should ignore auto i18n', () => {
    expect(ignoreAutoI18n('hello world',),).toBe('hello world',)
  },)
},)
