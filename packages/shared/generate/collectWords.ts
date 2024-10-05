export type WordMap = Record<string, string>;

const wordMap: WordMap = {};

export const setWordMap = (key: string, value: string,) => {
  wordMap[key] = value;
};

export const getWordMap = () => wordMap;
