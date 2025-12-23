import { useState, useCallback } from 'react';
import type { WordClue, PlacedWord, GenerationStats, SolutionWordConfig } from '../types';
import { generateCrossword } from '../utils/crosswordGenerator';

export const useCrossword = () => {
  const [words, setWords] = useState<WordClue[]>([]);
  const [gridRows, setGridRows] = useState(15);
  const [gridCols, setGridCols] = useState(15);
  const [crosswordGrid, setCrosswordGrid] = useState<string[][] | null>(null);
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [generationStats, setGenerationStats] = useState<GenerationStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [solutionWord, setSolutionWord] = useState<SolutionWordConfig | null>(null);

  const addWord = useCallback((word: string, clue: string) => {
    const trimmedWord = word.trim().toUpperCase();
    const trimmedClue = clue.trim();
    
    if (trimmedWord && !words.some(w => w.word === trimmedWord)) {
      setWords(prev => [...prev, { word: trimmedWord, clue: trimmedClue || `Clue for ${trimmedWord}` }]);
      return true;
    }
    return false;
  }, [words]);

  const removeWord = useCallback((index: number) => {
    setWords(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateWordClue = useCallback((index: number, newClue: string) => {
    setWords(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], clue: newClue };
      return updated;
    });
  }, []);

  const generateCrosswordPuzzle = useCallback(() => {
    if (words.length === 0) {
      throw new Error('Please add some words first!');
    }

    setIsGenerating(true);
    
    try {
      const result = generateCrossword(words, gridRows, gridCols, solutionWord);
      setCrosswordGrid(result.grid);
      setPlacedWords(result.placedWords);
      
      if (result.solutionWord) {
        setSolutionWord(result.solutionWord);
      }
      
      // Calculate statistics
      const totalIntersections = result.placedWords.reduce(
        (sum, word) => sum + word.intersections, 0
      );
      const efficiency = result.placedWords.length > 0 
        ? Math.round((totalIntersections / result.placedWords.length) * 100) / 100
        : 0;
      
      setGenerationStats({
        placed: result.placedWords.length,
        total: words.length,
        intersections: totalIntersections,
        efficiency: efficiency
      });
      
      return result;
    } finally {
      setIsGenerating(false);
    }
  }, [words, gridRows, gridCols, solutionWord]);

  const clearAll = useCallback(() => {
    setWords([]);
    setCrosswordGrid(null);
    setPlacedWords([]);
    setGenerationStats(null);
    setSolutionWord(null);
  }, []);

  const setSolutionWordConfig = useCallback((config: SolutionWordConfig | null) => {
    setSolutionWord(config);
  }, []);

  return {
    // State
    words,
    gridRows,
    gridCols,
    crosswordGrid,
    placedWords,
    generationStats,
    isGenerating,
    solutionWord,
    
    // Setters
    setGridRows,
    setGridCols,
    setCrosswordGrid,
    setPlacedWords,
    
    // Actions
    addWord,
    removeWord,
    updateWordClue,
    generateCrosswordPuzzle,
    clearAll,
    setSolutionWordConfig,
  };
};