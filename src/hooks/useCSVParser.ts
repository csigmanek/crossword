import { useState, useCallback } from 'react';
import type { WordClue } from '../types';
import {
  parseCsvContent,
  exportWordsToCsv,
  downloadSampleCsv,
  downloadSampleSemicolonCsv,
  exportWordsWithSeparator,
  analyzeCsvStructure,
  isValidWord
} from '../utils/csvParser';

export const useCSVParser = () => {
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [csvAnalysis, setCsvAnalysis] = useState<{
    separator: string;
    lineCount: number;
    validLines: number;
  } | null>(null);

  const handleCsvUpload = useCallback((
    file: File,
    existingWords: WordClue[],
    onSuccess: (newWords: WordClue[]) => void
  ) => {
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      setCsvError('Please upload a CSV or text file (.csv, .txt)');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Analyze the CSV structure first
        const analysis = analyzeCsvStructure(content);
        setCsvAnalysis(analysis);
        
        // Show analysis info
        console.log('CSV Analysis:', analysis);
        
        if (analysis.lineCount === 0) {
          setCsvError('File is empty');
          return;
        }
        
        if (analysis.validLines === 0) {
          setCsvError('No valid words found in the file');
          return;
        }
        
        // Parse the content
        const parsedWords = parseCsvContent(content);
        
        if (parsedWords.length === 0) {
          setCsvError('No valid words could be parsed from the file');
          return;
        }

        // Filter out duplicates with existing words
        const newWords = parsedWords.filter(wordClue => 
          !existingWords.some(w => w.word === wordClue.word)
        );
        
        if (newWords.length === 0) {
          setCsvError('All words in the file already exist in the list');
          return;
        }

        onSuccess(newWords);
        setCsvSuccess(`Added ${newWords.length} new word(s) from CSV (${analysis.separator === '\t' ? 'TAB' : analysis.separator} separated)`);
      } catch (error) {
        console.error('CSV parsing error:', error);
        setCsvError('Error parsing file. Please check the format.');
      }
    };

    reader.onerror = () => {
      setCsvError('Error reading file');
    };

    reader.readAsText(file);
  }, []);

  const handleExportWords = useCallback((words: WordClue[], useSemicolon: boolean = false) => {
    try {
      const csvContent = exportWordsToCsv(words, useSemicolon);
      const separatorText = useSemicolon ? 'semicolon' : 'comma';
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crossword_words_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCsvSuccess(`Exported ${words.length} words with clues (${separatorText} separated)`);
    } catch (error: any) {
      setCsvError(error.message || 'No words to export');
    }
  }, []);

  const handleExportWithSeparator = useCallback((words: WordClue[], separator: string = ',') => {
    try {
      const csvContent = exportWordsWithSeparator(words, separator);
      const separatorText = separator === '\t' ? 'TAB' : separator;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crossword_words_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCsvSuccess(`Exported ${words.length} words (${separatorText} separated)`);
    } catch (error: any) {
      setCsvError(error.message || 'No words to export');
    }
  }, []);

  const clearMessages = useCallback(() => {
    setCsvError(null);
    setCsvSuccess(null);
    setCsvAnalysis(null);
  }, []);

  return {
    csvError,
    csvSuccess,
    csvAnalysis,
    handleCsvUpload,
    handleExportWords,
    handleExportWithSeparator,
    downloadSampleCsv,
    downloadSampleSemicolonCsv,
    clearMessages,
    isValidWord,
  };
};