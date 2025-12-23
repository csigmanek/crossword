import type { WordClue, PlacedWord, SolutionWordConfig } from '../types';

// Enhanced word placement algorithm with better intersection logic
export const generateCrossword = (
  wordList: WordClue[],
  rows: number,
  cols: number,
  solutionWord?: SolutionWordConfig
): { 
  grid: string[][]; 
  placedWords: PlacedWord[];
  solutionWord?: SolutionWordConfig;
} => {
  // Sort words by intersection potential first, then length
  const sortedWords = sortWordsByIntersectionPotential(wordList);
  
  // Initialize empty grid
  const grid: string[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(''));

  const placedWords: PlacedWord[] = [];

  if (sortedWords.length === 0) {
    return { grid, placedWords };
  }

  // Place first word in the center (choose direction based on length vs grid)
  const firstWord = sortedWords[0];
  let firstWordDirection: 'horizontal' | 'vertical';
  let startRow: number, startCol: number;

  // Decide best direction for first word based on grid proportions
  if (rows >= cols) {
    firstWordDirection = 'vertical';
    startRow = Math.floor((rows - firstWord.word.length) / 2);
    startCol = Math.floor(cols / 2);
  } else {
    firstWordDirection = 'horizontal';
    startRow = Math.floor(rows / 2);
    startCol = Math.floor((cols - firstWord.word.length) / 2);
  }

  // Adjust if word doesn't fit
  if (firstWordDirection === 'horizontal' && startCol + firstWord.word.length > cols) {
    startCol = cols - firstWord.word.length;
  }
  if (firstWordDirection === 'vertical' && startRow + firstWord.word.length > rows) {
    startRow = rows - firstWord.word.length;
  }

  if (startCol < 0) startCol = 0;
  if (startRow < 0) startRow = 0;

  placeWord(grid, firstWord.word, startRow, startCol, firstWordDirection);
  placedWords.push({
    word: firstWord.word,
    clue: firstWord.clue,
    start: { row: startRow, col: startCol },
    direction: firstWordDirection,
    intersections: 0,
    number: 1
  });

  // Try to place remaining words with enhanced intersection logic
  let wordNumber = 2;
  for (let i = 1; i < sortedWords.length; i++) {
    const wordClue = sortedWords[i];
    
    // Try to find best placement with multiple intersections
    const bestPlacement = findBestPlacement(
      grid, 
      wordClue, 
      placedWords, 
      rows, 
      cols
    );
    
    if (bestPlacement) {
      const { startRow, startCol, direction, intersections } = bestPlacement;
      placeWord(grid, wordClue.word, startRow, startCol, direction);
      
      placedWords.push({
        word: wordClue.word,
        clue: wordClue.clue,
        start: { row: startRow, col: startCol },
        direction,
        intersections,
        number: wordNumber
      });
      wordNumber++;
    } else {
      // Try fallback placement (no intersections)
      const fallbackPlacement = findFallbackPlacement(grid, wordClue.word, rows, cols);
      if (fallbackPlacement) {
        const { startRow, startCol, direction } = fallbackPlacement;
        placeWord(grid, wordClue.word, startRow, startCol, direction);
        
        placedWords.push({
          word: wordClue.word,
          clue: wordClue.clue,
          start: { row: startRow, col: startCol },
          direction,
          intersections: 0,
          number: wordNumber
        });
        wordNumber++;
      }
    }
  }

  // Try to optimize the grid by repositioning words to create more intersections
  const optimized = optimizeCrossword(grid, placedWords, rows, cols);
  
  // If solution word exists, try to assign its letters to placed words
  if (solutionWord && solutionWord.word.length > 0) {
    const updatedSolutionWord = assignSolutionLetters(
      solutionWord,
      optimized.placedWords,
      optimized.grid
    );
    return { 
      grid: optimized.grid, 
      placedWords: optimized.placedWords, 
      solutionWord: updatedSolutionWord 
    };
  }
  
  return { grid: optimized.grid, placedWords: optimized.placedWords };
};

// Sort words by their potential for intersections
const sortWordsByIntersectionPotential = (wordList: WordClue[]): WordClue[] => {
  // Calculate intersection score for each word
  const scoredWords = wordList.map(wordClue => {
    const word = wordClue.word;
    let score = 0;
    
    // Words with common letters (vowels and common consonants) score higher
    const commonLetters = ['E', 'A', 'R', 'I', 'O', 'T', 'N', 'S', 'L', 'C'];
    
    // Score based on common letters
    for (const letter of word) {
      if (commonLetters.includes(letter)) {
        score += 2;
      } else {
        score += 1;
      }
    }
    
    // Longer words get bonus
    score += word.length * 0.5;
    
    // Words with repeating letters get penalty (harder to intersect)
    const uniqueLetters = new Set(word).size;
    score += (uniqueLetters / word.length) * 3;
    
    return { wordClue, score };
  });
  
  // Sort by score descending
  scoredWords.sort((a, b) => b.score - a.score);
  
  return scoredWords.map(item => item.wordClue);
};

// Find the best placement for a word (maximizing intersections)
const findBestPlacement = (
  grid: string[][],
  wordClue: WordClue,
  existingWords: PlacedWord[],
  rows: number,
  cols: number
): { startRow: number; startCol: number; direction: 'horizontal' | 'vertical'; intersections: number } | null => {
  const word = wordClue.word;
  let bestPlacement: any = null;
  let bestScore = -1;
  
  // For each existing word, try to place the new word intersecting with it
  for (const existingWord of existingWords) {
    // Try each letter of new word with each letter of existing word
    for (let i = 0; i < word.length; i++) {
      const newWordLetter = word[i];
      
      for (let j = 0; j < existingWord.word.length; j++) {
        if (existingWord.word[j] === newWordLetter) {
          // Calculate potential placements
          const placements = calculatePlacements(
            existingWord, 
            word, 
            i, 
            j, 
            rows, 
            cols
          );
          
          for (const placement of placements) {
            if (canPlaceWord(grid, word, placement.startRow, placement.startCol, placement.direction, rows, cols)) {
              // Calculate intersection score
              const intersections = countIntersections(grid, word, placement.startRow, placement.startCol, placement.direction);
              
              // Additional score factors
              let score = intersections * 10;
              
              // Bonus for creating multiple intersections
              const totalIntersections = countAllIntersections(grid, word, placement.startRow, placement.startCol, placement.direction, existingWords);
              score += totalIntersections * 5;
              
              // Bonus for creating cross patterns (words crossing at right angles)
              if (createsCrossPattern(grid, word, placement.startRow, placement.startCol, placement.direction)) {
                score += 15;
              }
              
              // Bonus for connecting to multiple existing words
              const connectedWords = countConnectedWords(grid, word, placement.startRow, placement.startCol, placement.direction, existingWords);
              score += connectedWords * 8;
              
              // Penalty for being too close to edge
              const edgeDistance = Math.min(
                placement.startRow,
                rows - placement.startRow - (placement.direction === 'vertical' ? word.length : 0),
                placement.startCol,
                cols - placement.startCol - (placement.direction === 'horizontal' ? word.length : 0)
              );
              score += edgeDistance * 0.5;
              
              if (score > bestScore) {
                bestScore = score;
                bestPlacement = {
                  startRow: placement.startRow,
                  startCol: placement.startCol,
                  direction: placement.direction,
                  intersections
                };
              }
            }
          }
        }
      }
    }
  }
  
  return bestPlacement;
};

// Calculate all possible placements for a word intersecting at given positions
const calculatePlacements = (
  existingWord: PlacedWord,
  newWord: string,
  newWordIndex: number,
  existingWordIndex: number,
  rows: number,
  cols: number
): Array<{startRow: number; startCol: number; direction: 'horizontal' | 'vertical'}> => {
  const placements = [];
  
  if (existingWord.direction === 'horizontal') {
    // Place new word vertically
    const startRow = existingWord.start.row - newWordIndex;
    const startCol = existingWord.start.col + existingWordIndex;
    placements.push({ startRow, startCol, direction: 'vertical' as const });
    
    // Try alternative positions (shifted)
    if (startRow > 0) {
      placements.push({ startRow: startRow - 1, startCol, direction: 'vertical' as const });
    }
    if (startRow + newWord.length < rows) {
      placements.push({ startRow: startRow + 1, startCol, direction: 'vertical' as const });
    }
  } else {
    // Place new word horizontally
    const startRow = existingWord.start.row + existingWordIndex;
    const startCol = existingWord.start.col - newWordIndex;
    placements.push({ startRow, startCol, direction: 'horizontal' as const });
    
    // Try alternative positions (shifted)
    if (startCol > 0) {
      placements.push({ startRow, startCol: startCol - 1, direction: 'horizontal' as const });
    }
    if (startCol + newWord.length < cols) {
      placements.push({ startRow, startCol: startCol + 1, direction: 'horizontal' as const });
    }
  }
  
  return placements.filter(p => 
    p.startRow >= 0 && 
    p.startCol >= 0 &&
    (p.direction === 'horizontal' ? p.startCol + newWord.length <= cols : p.startRow + newWord.length <= rows)
  );
};

// Check if placement creates a cross pattern (word crossing another at right angle)
const createsCrossPattern = (
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: 'horizontal' | 'vertical'
): boolean => {
  // For each position in the word, check if it creates a crossing
  for (let i = 0; i < word.length; i++) {
    const row = direction === 'horizontal' ? startRow : startRow + i;
    const col = direction === 'horizontal' ? startCol + i : startCol;
    
    // If this cell is already filled (intersection), check if it's part of a proper cross
    if (grid[row][col] !== '') {
      // Check if there's a word perpendicular at this position
      if (direction === 'horizontal') {
        if ((row > 0 && grid[row - 1][col] !== '') || (row < grid.length - 1 && grid[row + 1][col] !== '')) {
          return true;
        }
      } else {
        if ((col > 0 && grid[row][col - 1] !== '') || (col < grid[0].length - 1 && grid[row][col + 1] !== '')) {
          return true;
        }
      }
    }
  }
  return false;
};

// Count all intersections (with all words, not just the one being attached to)
const countAllIntersections = (
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: 'horizontal' | 'vertical',
  existingWords: PlacedWord[]
): number => {
  let totalIntersections = 0;
  
  for (let i = 0; i < word.length; i++) {
    const row = direction === 'horizontal' ? startRow : startRow + i;
    const col = direction === 'horizontal' ? startCol + i : startCol;
    
    if (grid[row][col] !== '') {
      totalIntersections++;
      
      // Check if this intersection connects to multiple words
      const intersectingWords = existingWords.filter(existingWord => {
        if (existingWord.direction === 'horizontal') {
          return existingWord.start.row === row && 
                 col >= existingWord.start.col && 
                 col < existingWord.start.col + existingWord.word.length;
        } else {
          return existingWord.start.col === col && 
                 row >= existingWord.start.row && 
                 row < existingWord.start.row + existingWord.word.length;
        }
      });
      
      if (intersectingWords.length > 1) {
        totalIntersections += intersectingWords.length - 1; // Bonus for multiple connections
      }
    }
  }
  
  return totalIntersections;
};

// Count how many different words are connected by this placement
const countConnectedWords = (
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: 'horizontal' | 'vertical',
  existingWords: PlacedWord[]
): number => {
  const connectedWordIds = new Set<number>();
  
  for (let i = 0; i < word.length; i++) {
    const row = direction === 'horizontal' ? startRow : startRow + i;
    const col = direction === 'horizontal' ? startCol + i : startCol;
    
    if (grid[row][col] !== '') {
      // Find which existing word(s) are at this position
      existingWords.forEach((existingWord, index) => {
        if (existingWord.direction === 'horizontal') {
          if (existingWord.start.row === row && 
              col >= existingWord.start.col && 
              col < existingWord.start.col + existingWord.word.length) {
            connectedWordIds.add(index);
          }
        } else {
          if (existingWord.start.col === col && 
              row >= existingWord.start.row && 
              row < existingWord.start.row + existingWord.word.length) {
            connectedWordIds.add(index);
          }
        }
      });
    }
  }
  
  return connectedWordIds.size;
};

// Find fallback placement (no intersections, just empty space)
const findFallbackPlacement = (
  grid: string[][],
  word: string,
  rows: number,
  cols: number
): { startRow: number; startCol: number; direction: 'horizontal' | 'vertical' } | null => {
  // Try to find placement near existing words to encourage future intersections
  const existingCells: Array<{row: number; col: number}> = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] !== '') {
        existingCells.push({ row, col });
      }
    }
  }
  
  // Sort existing cells by density (areas with more words)
  existingCells.sort((a, b) => {
    const densityA = countNeighbors(grid, a.row, a.col, rows, cols);
    const densityB = countNeighbors(grid, b.row, b.col, rows, cols);
    return densityB - densityA; // Higher density first
  });
  
  // Try to place near dense areas
  for (const cell of existingCells) {
    // Try horizontal placement to the right
    if (cell.col + word.length <= cols) {
      const startRow = cell.row;
      const startCol = cell.col + 2; // Leave one cell gap
      
      if (startCol >= 0 && startCol + word.length <= cols) {
        if (canPlaceWord(grid, word, startRow, startCol, 'horizontal', rows, cols, false)) {
          return { startRow, startCol, direction: 'horizontal' };
        }
      }
    }
    
    // Try vertical placement below
    if (cell.row + word.length <= rows) {
      const startRow = cell.row + 2; // Leave one cell gap
      const startCol = cell.col;
      
      if (startRow >= 0 && startRow + word.length <= rows) {
        if (canPlaceWord(grid, word, startRow, startCol, 'vertical', rows, cols, false)) {
          return { startRow, startCol, direction: 'vertical' };
        }
      }
    }
  }
  
  // If no placement near existing words, try anywhere
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= cols - word.length; col++) {
      if (canPlaceWord(grid, word, row, col, 'horizontal', rows, cols, false)) {
        return { startRow: row, startCol: col, direction: 'horizontal' };
      }
    }
  }
  
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row <= rows - word.length; row++) {
      if (canPlaceWord(grid, word, row, col, 'vertical', rows, cols, false)) {
        return { startRow: row, startCol: col, direction: 'vertical' };
      }
    }
  }
  
  return null;
};

// Count neighboring filled cells
const countNeighbors = (
  grid: string[][],
  row: number,
  col: number,
  rows: number,
  cols: number
): number => {
  let count = 0;
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];
  
  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    
    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
      if (grid[newRow][newCol] !== '') {
        count++;
      }
    }
  }
  
  return count;
};

// Enhanced canPlaceWord with option to require intersections
const canPlaceWord = (
  grid: string[][], 
  word: string, 
  startRow: number, 
  startCol: number, 
  direction: 'horizontal' | 'vertical',
  rows: number,
  cols: number,
  requireIntersection: boolean = true
): boolean => {
  // Check bounds
  if (direction === 'horizontal') {
    if (startCol < 0 || startCol + word.length > cols) return false;
    if (startRow < 0 || startRow >= rows) return false;
  } else {
    if (startRow < 0 || startRow + word.length > rows) return false;
    if (startCol < 0 || startCol >= cols) return false;
  }
  
  let hasIntersection = false;
  
  // Check cells
  for (let i = 0; i < word.length; i++) {
    const row = direction === 'horizontal' ? startRow : startRow + i;
    const col = direction === 'horizontal' ? startCol + i : startCol;
    const cell = grid[row][col];
    
    // Cell must be empty or contain matching letter
    if (cell !== '' && cell !== word[i]) {
      return false;
    }
    
    // Track if we have an intersection
    if (cell !== '' && cell === word[i]) {
      hasIntersection = true;
    }
    
    // Check adjacent cells (must not create unintended connections)
    if (!checkAdjacentCells(grid, row, col, direction, i, word.length, rows, cols)) {
      return false;
    }
  }
  
  // If intersection is required, check that we have at least one
  if (requireIntersection && !hasIntersection) {
    return false;
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
    
    if (grid[row][col] === word[i]) {
      intersections++;
    }
  }
  
  return intersections;
};

// Optimization function to reposition words for better intersections
const optimizeCrossword = (
  grid: string[][],
  placedWords: PlacedWord[],
  rows: number,
  cols: number
): { grid: string[][]; placedWords: PlacedWord[] } => {
  const newGrid = JSON.parse(JSON.stringify(grid)) as string[][];
  const newPlacedWords = JSON.parse(JSON.stringify(placedWords)) as PlacedWord[];
  
  // Try to improve each word's position
  for (let i = 0; i < newPlacedWords.length; i++) {
    const word = newPlacedWords[i];
    
    // Skip if word already has good intersections
    if (word.intersections >= Math.min(2, word.word.length / 2)) {
      continue;
    }
    
    // Create a temporary grid without this word to test new placements
    const otherWords = newPlacedWords.filter((_, idx) => idx !== i);
    const tempGrid = Array(rows).fill(null).map(() => Array(cols).fill(''));
    
    // Place all other words in the temporary grid
    for (const otherWord of otherWords) {
      placeWord(tempGrid, otherWord.word, otherWord.start.row, otherWord.start.col, otherWord.direction);
    }
    
    // Try to find a better placement
    const betterPlacement = findBetterPlacement(
      tempGrid,
      { word: word.word, clue: word.clue },
      otherWords,
      rows,
      cols,
      word.intersections
    );
    
    if (betterPlacement) {
      // Place the word in the better position
      placeWord(tempGrid, word.word, betterPlacement.startRow, betterPlacement.startCol, betterPlacement.direction);
      
      // Update the word's position and intersection count in newPlacedWords
      newPlacedWords[i] = {
        ...word,
        start: { row: betterPlacement.startRow, col: betterPlacement.startCol },
        direction: betterPlacement.direction,
        intersections: betterPlacement.intersections
      };
      
      // Update the main grid
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          newGrid[r][c] = tempGrid[r][c];
        }
      }
    }
  }
  
  return { grid: newGrid, placedWords: newPlacedWords };
};

// Find a better placement for a word
const findBetterPlacement = (
  grid: string[][],
  wordClue: WordClue,
  existingWords: PlacedWord[],
  rows: number,
  cols: number,
  currentIntersections: number
): { startRow: number; startCol: number; direction: 'horizontal' | 'vertical'; intersections: number } | null => {
  const word = wordClue.word;
  let bestPlacement: any = null;
  let bestIntersections = currentIntersections;
  
  // Try to place intersecting with each existing word
  for (const existingWord of existingWords) {
    for (let i = 0; i < word.length; i++) {
      const newWordLetter = word[i];
      
      for (let j = 0; j < existingWord.word.length; j++) {
        if (existingWord.word[j] === newWordLetter) {
          // Calculate potential placement
          let startRow: number, startCol: number, direction: 'horizontal' | 'vertical';
          
          if (existingWord.direction === 'horizontal') {
            direction = 'vertical';
            startRow = existingWord.start.row - i;
            startCol = existingWord.start.col + j;
          } else {
            direction = 'horizontal';
            startRow = existingWord.start.row + j;
            startCol = existingWord.start.col - i;
          }
          
          if (canPlaceWord(grid, word, startRow, startCol, direction, rows, cols, true)) {
            const intersections = countIntersections(grid, word, startRow, startCol, direction);
            
            if (intersections > bestIntersections) {
              bestIntersections = intersections;
              bestPlacement = { startRow, startCol, direction, intersections };
            }
          }
        }
      }
    }
  }
  
  return bestPlacement;
};

// New function to assign solution letters to placed words with better distribution
const assignSolutionLetters = (
  solutionWord: SolutionWordConfig,
  placedWords: PlacedWord[],
  grid: string[][]
): SolutionWordConfig => {
  const solutionLetters = solutionWord.word.split('');
  const updatedLetters: SolutionWordConfig['letters'] = [];
  const usedPositions = new Set<string>();
  const wordUsageCount = new Map<number, number>();
  const maxLettersPerWord = Math.ceil(solutionLetters.length / Math.max(1, placedWords.length / 2));
  
  // Initialize usage count for each word
  placedWords.forEach((_, index) => {
    wordUsageCount.set(index, 0);
  });

  // Try to assign each solution letter to a word
  for (let solutionLetterIndex = 0; solutionLetterIndex < solutionLetters.length; solutionLetterIndex++) {
    const targetLetter = solutionLetters[solutionLetterIndex];
    let assigned = false;
    
    // First, try to find words that haven't been used yet or have minimal usage
    const candidates: Array<{
      wordIndex: number;
      letterIndex: number;
      row: number;
      col: number;
      currentUsage: number;
    }> = [];
    
    // Collect all possible candidates
    for (let wordIndex = 0; wordIndex < placedWords.length; wordIndex++) {
      const placedWord = placedWords[wordIndex];
      const currentUsage = wordUsageCount.get(wordIndex) || 0;
      
      // Skip if this word already has too many solution letters
      if (currentUsage >= maxLettersPerWord) {
        continue;
      }
      
      // Check each letter in the word
      for (let letterIndex = 0; letterIndex < placedWord.word.length; letterIndex++) {
        if (placedWord.word[letterIndex] === targetLetter) {
          // Calculate grid position
          let row: number, col: number;
          if (placedWord.direction === 'horizontal') {
            row = placedWord.start.row;
            col = placedWord.start.col + letterIndex;
          } else {
            row = placedWord.start.row + letterIndex;
            col = placedWord.start.col;
          }
          
          const positionKey = `${row},${col}`;
          
          // Ensure we don't reuse the same position
          if (!usedPositions.has(positionKey)) {
            candidates.push({
              wordIndex,
              letterIndex,
              row,
              col,
              currentUsage
            });
          }
        }
      }
    }
    
    // Sort candidates by:
    // 1. Words with fewer solution letters used (spread them out)
    // 2. Words that are longer (more opportunities for other letters)
    // 3. Random tie-breaker
    candidates.sort((a, b) => {
      if (a.currentUsage !== b.currentUsage) {
        return a.currentUsage - b.currentUsage;
      }
      
      // Prefer longer words
      const aWordLength = placedWords[a.wordIndex].word.length;
      const bWordLength = placedWords[b.wordIndex].word.length;
      if (aWordLength !== bWordLength) {
        return bWordLength - aWordLength;
      }
      
      // Random tie-breaker
      return Math.random() - 0.5;
    });
    
    // Try to assign to the best candidate
    for (const candidate of candidates) {
      const positionKey = `${candidate.row},${candidate.col}`;
      
      if (!usedPositions.has(positionKey)) {
        updatedLetters.push({
          wordIndex: candidate.wordIndex,
          letterIndex: candidate.letterIndex,
          row: candidate.row,
          col: candidate.col,
          solutionLetterPosition: solutionLetterIndex + 1 // 1-based position
        });
        
        usedPositions.add(positionKey);
        wordUsageCount.set(candidate.wordIndex, (wordUsageCount.get(candidate.wordIndex) || 0) + 1);
        assigned = true;
        break;
      }
    }
    
    // If no match found, try again with relaxed constraints
    if (!assigned) {
      // Second pass: allow words that already have max letters
      for (let wordIndex = 0; wordIndex < placedWords.length; wordIndex++) {
        const placedWord = placedWords[wordIndex];
        
        for (let letterIndex = 0; letterIndex < placedWord.word.length; letterIndex++) {
          if (placedWord.word[letterIndex] === targetLetter) {
            // Calculate grid position
            let row: number, col: number;
            if (placedWord.direction === 'horizontal') {
              row = placedWord.start.row;
              col = placedWord.start.col + letterIndex;
            } else {
              row = placedWord.start.row + letterIndex;
              col = placedWord.start.col;
            }
            
            const positionKey = `${row},${col}`;
            
            if (!usedPositions.has(positionKey)) {
              updatedLetters.push({
                wordIndex,
                letterIndex,
                row,
                col,
                solutionLetterPosition: solutionLetterIndex + 1
              });
              
              usedPositions.add(positionKey);
              wordUsageCount.set(wordIndex, (wordUsageCount.get(wordIndex) || 0) + 1);
              assigned = true;
              break;
            }
          }
        }
        if (assigned) break;
      }
    }
    
    // If still no match found, keep the letter without position
    if (!assigned) {
      console.warn(`Could not assign solution letter "${targetLetter}" (position ${solutionLetterIndex + 1}) to any word`);
      updatedLetters.push({
        wordIndex: -1,
        letterIndex: -1,
        solutionLetterPosition: solutionLetterIndex + 1
      });
    }
  }
  
  // Verify distribution
  const usageStats = Array.from(wordUsageCount.entries())
    .filter(([_, count]) => count > 0)
    .map(([wordIndex, count]) => ({
      word: placedWords[wordIndex].word,
      count
    }));
  
  console.log('Solution letter distribution:', usageStats);
  
  return {
    ...solutionWord,
    letters: updatedLetters
  };
};

// Utility function to calculate crossword quality score
export const calculateCrosswordQuality = (
  placedWords: PlacedWord[],
  totalWords: number
): {
  placementRate: number;
  avgIntersections: number;
  density: number;
  connectivity: number;
} => {
  if (placedWords.length === 0) {
    return { placementRate: 0, avgIntersections: 0, density: 0, connectivity: 0 };
  }
  
  const totalIntersections = placedWords.reduce((sum, word) => sum + word.intersections, 0);
  const avgIntersections = totalIntersections / placedWords.length;
  
  // Calculate connectivity (percentage of words that intersect with at least one other word)
  const connectedWords = placedWords.filter(word => word.intersections > 0).length;
  const connectivity = connectedWords / placedWords.length;
  
  return {
    placementRate: placedWords.length / totalWords,
    avgIntersections,
    density: totalIntersections / placedWords.length,
    connectivity
  };
};

// New helper function to validate the grid - checks that all placed words appear correctly
export const validateGrid = (
  grid: string[][],
  placedWords: PlacedWord[]
): boolean => {
  for (const word of placedWords) {
    for (let i = 0; i < word.word.length; i++) {
      const row = word.direction === 'horizontal' ? word.start.row : word.start.row + i;
      const col = word.direction === 'horizontal' ? word.start.col + i : word.start.col;
      
      // Check if cell is empty or contains wrong letter
      if (grid[row][col] !== word.word[i]) {
        console.error(`Validation failed: Word "${word.word}" at position [${row},${col}] should be "${word.word[i]}" but found "${grid[row][col]}"`);
        return false;
      }
    }
  }
  return true;
};