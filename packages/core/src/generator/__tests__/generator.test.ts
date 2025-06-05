import {
  existsSync,
  mkdirSync,
  rmSync,
} from 'fs'
import { tmpdir, } from 'os'
import { resolve, } from 'path'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { generate, getMessages, setMessage, } from '../index'

const mockFs = vi.hoisted(() => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  rmSync: vi.fn(),
  writeFileSync: vi.fn(),
}),)

vi.mock('fs', () => mockFs,)

const TEST_DIR = resolve(tmpdir(), 'i18n-transformer-test',)

describe('file Generation', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks()

    // 设置默认的 mock 行为
    mockFs.existsSync.mockReturnValue(false,)
    mockFs.mkdirSync.mockReturnValue(undefined,)
    mockFs.writeFileSync.mockReturnValue(undefined,)
    mockFs.readFileSync.mockReturnValue('{}',)

    // 清理测试目录
    if (existsSync(TEST_DIR,)) {
      rmSync(TEST_DIR, {
        recursive: true,
      },)
    }
    mkdirSync(TEST_DIR, {
      recursive: true,
    },)

    // 清理所有消息
    const messages = getMessages()
    Object.keys(messages,).forEach((key,) => {
      delete messages[key]
    },)
  },)

  afterEach(() => {
    // 清理测试目录
    if (existsSync(TEST_DIR,)) {
      rmSync(TEST_DIR, {
        recursive: true,
      },)
    }
  },)

  it('should create directory', () => {
    const config = {
      filename: 'zh-CN.json',
      path: TEST_DIR,
      langList: [],
    }

    mockFs.existsSync.mockReturnValueOnce(false,).mockReturnValueOnce(true,)

    generate(config,)
    expect(mockFs.mkdirSync,).toHaveBeenCalledWith(TEST_DIR, {
      recursive: true,
    },)
    expect(mockFs.writeFileSync,).toHaveBeenCalled()
  },)

  it('should generate base file', () => {
    setMessage('hello', '你好',)
    setMessage('welcome', '欢迎',)

    const config = {
      filename: 'zh-CN.json',
      path: TEST_DIR,
      langList: [],
    }

    const expectedContent = {
      hello: '你好',
      welcome: '欢迎',
    }

    generate(config,)
    expect(mockFs.writeFileSync,).toHaveBeenCalledWith(
      resolve(TEST_DIR, 'zh-CN.json',),
      JSON.stringify(expectedContent, null, 2,),
    )
  },)

  it('should handle language list', () => {
    setMessage('hello', '你好',)

    const config = {
      filename: 'zh-CN.json',
      path: TEST_DIR,
      langList: [ 'en-US.json', 'ja-JP.json', ],
    }

    generate(config,)
    expect(mockFs.writeFileSync,).toHaveBeenCalledTimes(4,)
  },)

  it('should preserve translations', () => {
    setMessage('hello', '你好',)
    setMessage('goodbye', '再见',)

    const existingTranslations = {
      hello: 'Hello',
    }

    mockFs.existsSync.mockReturnValue(true,)
    mockFs.readFileSync.mockReturnValue(JSON.stringify(existingTranslations,),)

    const config = {
      filename: 'zh-CN.json',
      path: TEST_DIR,
      langList: [ 'en-US.json', ],
    }

    const expectedContent = {
      hello: 'Hello',
      goodbye: '再见',
    }

    generate(config,)
    expect(mockFs.writeFileSync,).toHaveBeenCalledWith(
      resolve(TEST_DIR, 'en-US.json',),
      JSON.stringify(expectedContent, null, 2,),
    )
  },)

  it('should handle file errors', () => {
    mockFs.mkdirSync.mockImplementation(() => {
      throw new Error('EACCES: permission denied',)
    },)

    const config = {
      filename: 'zh-CN.json',
      path: '/root/nonexistent',
      langList: [],
    }

    expect(() => generate(config,),).toThrow(/Failed to generate i18n files.*Directory is not writable/,)
  },)

  it('should handle invalid config', () => {
    const invalidConfig = {
      path: TEST_DIR,
    } as any

    expect(() => generate(invalidConfig,),).toThrow('Invalid configuration',)
  },)

  it('should handle invalid language file', () => {
    setMessage('hello', '你好',)

    mockFs.existsSync.mockReturnValue(true,)
    mockFs.readFileSync.mockReturnValue('{invalid json',)

    const config = {
      filename: 'zh-CN.json',
      path: TEST_DIR,
      langList: [ 'invalid.json', ],
    }

    expect(() => generate(config,),).toThrow(/Failed to generate i18n files.*Failed to parse existing translation file/,)
  },)

  it('should handle read-only directory', () => {
    mockFs.writeFileSync.mockImplementation(() => {
      throw new Error('EACCES: permission denied',)
    },)

    const config = {
      filename: 'zh-CN.json',
      path: '/root/readonly',
      langList: [],
    }

    expect(() => generate(config,),).toThrow(/Failed to generate i18n files.*Directory is not writable/,)
  },)

  it('should handle empty language list', () => {
    setMessage('hello', '你好',)

    const config = {
      filename: 'zh-CN.json',
      path: TEST_DIR,
      langList: [],
    }

    generate(config,)
    expect(mockFs.writeFileSync,).toHaveBeenCalledTimes(2,)
  },)

  it('should handle concurrent file operations', async () => {
    setMessage('hello', '你好',)

    const config = {
      filename: 'zh-CN.json',
      path: TEST_DIR,
      langList: [ 'en-US.json', ],
    }

    await Promise.all([
      Promise.resolve(generate(config,),),
      Promise.resolve(generate(config,),),
    ],)

    expect(mockFs.writeFileSync,).toHaveBeenCalledTimes(6,)
  },)
},)
