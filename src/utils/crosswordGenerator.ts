import type { WordClue, PlacedWord } from '../types';

export const canPlaceWord = (
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: 'horizontal' | 'vertical',
  rows: number,
  cols: number
): boolean => {
  // Check bounds
  if (direction === 'horizontal') {
    if (startCol < 0 || startCol + word.length > cols) return false;
    if (startRow < 0 || startRow >= rows) return false;
  } else {
    if (startRow < 0 || startRow + word.length > rows) return false;
    if (startCol < 0 || startCol >= cols) return false;
  }

  // Check cells
  for (let i = 0; i < word.length; i++) {
    const row = direction === 'horizontal' ? startRow : startRow + i;
    const col = direction === 'horizontal' ? startCol + i : startCol;
    const cell = grid[row][col];

    // Cell must be empty or contain matching letter
    if (cell !== '' && cell !== word[i]) {
      return false;
    }

    // Check adjacent cells
    if (!checkAdjacentCells(grid, row, col, direction, i, word.length, rows, cols)) {
      return false;
    }
  }

  return true;
};

const checkAdjacentCells = (
  grid: string[][],
  row: number,
  col: number,
  direction: 'horizontal' | 'vertical',
  index: number,
  wordLength: number,
  rows: number,
  cols: number
): boolean => {
  // Check cell before the word
  if (index === 0) {
    const beforeRow = direction === 'horizontal' ? row : row - 1;
    const beforeCol = direction === 'horizontal' ? col - 1 : col;

    if (beforeRow >= 0 && beforeRow < rows &&
        beforeCol >= 0 && beforeCol < cols &&
        grid[beforeRow][beforeCol] !== '') {
      return false;
    }
  }

  // Check cell after the word
  if (index === wordLength - 1) {
    const afterRow = direction === 'horizontal' ? row : row + 1;
    const afterCol = direction === 'horizontal' ? col + 1 : col;

    if (afterRow >= 0 && afterRow < rows &&
        afterCol >= 0 && afterCol < cols &&
        grid[afterRow][afterCol] !== '') {
      return false;
    }
  }

  // Check perpendicular adjacency
  if (grid[row][col] === '') {
    const side1Row = direction === 'horizontal' ? row - 1 : row;
    const side1Col = direction === 'horizontal' ? col : col - 1;
    const side2Row = direction === 'horizontal' ? row + 1 : row;
    const side2Col = direction === 'horizontal' ? col : col + 1;

    if ((side1Row >= 0 && side1Row < rows && side1Col >= 0 && side1Col < cols &&
         grid[side1Row][side1Col] !== '') ||
        (side2Row >= 0 && side2Row < rows && side2Col >= 0 && side2Col < cols &&
         grid[side2Row][side2Col] !== '')) {
      return false;
    }
  }

  return true;
};

export const placeWord = (
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: 'horizontal' | 'vertical'
): void => {
  for (let i = 0; i < word.length; i++) {
    const row = direction === 'horizontal' ? startRow : startRow + i;
    const col = direction === 'horizontal' ? startCol + i : startCol;
    grid[row][col] = word[i];
  }
};

export const countIntersections = (
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: 'horizontal' | 'vertical'
): number => {
  let intersections = 0;

  for (let i = 0; i < word.length; i++) {
    const row = direction === 'horizontal' ? startRow : startRow + i;
    const col = direction === 'horizontal' ? startCol + i : startCol;

    // Check if this cell was already filled (intersection)
    if (grid[row][col] === word[i]) {
      intersections++;
    }
  }

  return intersections;
};

export const findEmptyPlacement = (
  grid: string[][],
  word: string,
  existingWords: PlacedWord[],
  rows: number,
  cols: number
): { startRow: number; startCol: number; direction: 'horizontal' | 'vertical' } | null => {
  // Try horizontal placement
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= cols - word.length; col++) {
      const hasSpaceBefore = col === 0 || grid[row][col - 1] === '';
      const hasSpaceAfter = col + word.length === cols || grid[row][col + word.length] === '';

      if (hasSpaceBefore && hasSpaceAfter) {
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          if (grid[row][col + i] !== '' ||
              (row > 0 && grid[row - 1][col + i] !== '') ||
              (row < rows - 1 && grid[row + 1][col + i] !== '')) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          return { startRow: row, startCol: col, direction: 'horizontal' };
        }
      }
    }
  }

  // Try vertical placement
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row <= rows - word.length; row++) {
      const hasSpaceBefore = row === 0 || grid[row - 1][col] === '';
      const hasSpaceAfter = row + word.length === rows || grid[row + word.length][col] === '';

      if (hasSpaceBefore && hasSpaceAfter) {
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          if (grid[row + i][col] !== '' ||
              (col > 0 && grid[row + i][col - 1] !== '') ||
              (col < cols - 1 && grid[row + i][col + 1] !== '')) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          return { startRow: row, startCol: col, direction: 'vertical' };
        }
      }
    }
  }

  return null;
};

export const tryPlaceWord = (
  grid: string[][],
  wordClue: WordClue,
  existingWords: PlacedWord[],
  rows: number,
  cols: number
): Omit<PlacedWord, 'number'> | null => {
  const word = wordClue.word;

  // Try to place word intersecting with existing words
  for (const existingWord of existingWords) {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];

      // Check each position in existing word for matching letter
      for (let j = 0; j < existingWord.word.length; j++) {
        if (existingWord.word[j] === letter) {
          // Calculate potential position
          let startRow: number;
          let startCol: number;
          let direction: 'horizontal' | 'vertical';

          if (existingWord.direction === 'horizontal') {
            // Place new word vertically
            direction = 'vertical';
            startRow = existingWord.start.row - i;
            startCol = existingWord.start.col + j;
          } else {
            // Place new word horizontally
            direction = 'horizontal';
            startRow = existingWord.start.row + j;
            startCol = existingWord.start.col - i;
          }

          // Check if placement is valid
          if (canPlaceWord(grid, word, startRow, startCol, direction, rows, cols)) {
            // Count intersections
            const intersections = countIntersections(grid, word, startRow, startCol, direction);

            placeWord(grid, word, startRow, startCol, direction);
            return {
              word: word,
              clue: wordClue.clue,
              start: { row: startRow, col: startCol },
              direction,
              intersections
            };
          }
        }
      }
    }
  }

  // If no intersection found, try to place in empty space
  const emptyPlacement = findEmptyPlacement(grid, word, existingWords, rows, cols);
  if (emptyPlacement) {
    const { startRow, startCol, direction } = emptyPlacement;
    const intersections = countIntersections(grid, word, startRow, startCol, direction);

    placeWord(grid, word, startRow, startCol, direction);
    return {
      word: word,
      clue: wordClue.clue,
      start: { row: startRow, col: startCol },
      direction,
      intersections
    };
  }

  return null;
};

export const generateCrossword = (
  wordList: WordClue[],
  rows: number,
  cols: number
): { grid: string[][]; placedWords: PlacedWord[] } => {
  // Sort words by length (longest first) for better placement
  const sortedWords = [...wordList].sort((a, b) => b.word.length - a.word.length);

  // Initialize empty grid
  const grid: string[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(''));

  const placedWords: PlacedWord[] = [];

  // Place first word in the center horizontally
  if (sortedWords.length > 0) {
    const firstWord = sortedWords[0];
    const startCol = Math.floor((cols - firstWord.word.length) / 2);
    const startRow = Math.floor(rows / 2);

    if (canPlaceWord(grid, firstWord.word, startRow, startCol, 'horizontal', rows, cols)) {
      placeWord(grid, firstWord.word, startRow, startCol, 'horizontal');
      placedWords.push({
        word: firstWord.word,
        clue: firstWord.clue,
        start: { row: startRow, col: startCol },
        direction: 'horizontal',
        intersections: 0,
        number: 1
      });
    }
  }

  // Try to place remaining words
  let wordNumber = 2;
  for (let i = 1; i < sortedWords.length; i++) {
    const wordClue = sortedWords[i];
    const placed = tryPlaceWord(grid, wordClue, placedWords, rows, cols);

    if (placed) {
      placedWords.push({
        ...placed,
        number: wordNumber
      });
      wordNumber++;
    }
  }

  return { grid, placedWords };
};