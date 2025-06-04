import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { log, } from '../utils'

describe('utils', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log',).mockImplementation()
  },)

  afterEach(() => {
    consoleLogSpy.mockRestore()
  },)

  describe('log', () => {
    it('should log info message with correct format', () => {
      log.info('Test info message',)
      expect(consoleLogSpy,).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]: Test info message',),
      )
    },)

    it('should log warn message with correct format', () => {
      log.warn('Test warning message',)
      expect(consoleLogSpy,).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]: Test warning message',),
      )
    },)

    it('should log error message with correct format', () => {
      log.error('Test error message',)
      expect(consoleLogSpy,).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]: Test error message',),
      )
    },)

    it('should include timestamp in log message', () => {
      const dateRegex = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/
      log.info('Test message',)
      expect(consoleLogSpy,).toHaveBeenCalledWith(
        expect.stringMatching(dateRegex,),
      )
    },)
  },)
},)
