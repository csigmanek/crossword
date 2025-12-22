export interface Position {
  row: number;
  col: number;
}

export interface WordClue {
  word: string;
  clue: string;
}

export interface PlacedWord {
  word: string;
  clue: string;
  start: Position;
  direction: 'horizontal' | 'vertical';
  intersections: number;
  number: number;
}

export interface GenerationStats {
  placed: number;
  total: number;
  intersections: number;
  efficiency: number;
}

export interface CrosswordState {
  words: WordClue[];
  gridRows: number;
  gridCols: number;
  crosswordGrid: string[][] | null;
  placedWords: PlacedWord[];
  generationStats: GenerationStats | null;
}