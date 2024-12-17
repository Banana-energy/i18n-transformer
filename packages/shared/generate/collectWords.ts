export type WordMap = Record<string, string>

const wordMap: WordMap = {}

export function setWordMap(key: string, value: string,): void {
  wordMap[key] = value
}

export const getWordMap = (): WordMap => wordMap
