export const validateWord = (word: string): boolean => {
  return /^[A-Z]+$/i.test(word) && word.length > 0;
};

export const validateClue = (clue: string): boolean => {
  return clue.trim().length > 0;
};

export const validateGridSize = (rows: number, cols: number): boolean => {
  return rows >= 5 && rows <= 30 && cols >= 5 && cols <= 30;
};