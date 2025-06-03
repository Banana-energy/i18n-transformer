import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { getMessages, setMessage, } from '../index'

describe('messages Management', () => {
  beforeEach(() => {
    // 清理消息存储
    const messages = getMessages()
    Object.keys(messages,).forEach((key,) => {
      delete messages[key]
    },)
  },)

  it('should set single message', () => {
    setMessage('hello', '你好',)
    const messages = getMessages()
    expect(messages.hello,).toBe('你好',)
  },)

  it('should get all messages', () => {
    setMessage('hello', '你好',)
    setMessage('welcome', '欢迎',)
    const messages = getMessages()
    expect(messages,).toEqual({
      hello: '你好',
      welcome: '欢迎',
    },)
  },)

  it('should handle duplicate keys', () => {
    setMessage('hello', '你好',)
    setMessage('hello', '您好',)
    const messages = getMessages()
    expect(messages.hello,).toBe('您好',)
  },)

  it('should handle empty messages', () => {
    setMessage('empty', '',)
    const messages = getMessages()
    expect(messages.empty,).toBe('',)
  },)
},)
