import type { WordClue } from '../types';

export const parseCsvContent = (content: string): WordClue[] => {
  const wordClues: WordClue[] = [];
  const lines = content.split(/\r\n|\n|\r/);
  
  if (lines.length === 0) {
    return wordClues;
  }

  // Function to detect the most likely separator
  const detectSeparator = (firstFewLines: string[]): string => {
    // Count occurrences of potential separators in the content
    let commaCount = 0;
    let semicolonCount = 0;
    let tabCount = 0;
    
    const sampleLines = firstFewLines.slice(0, Math.min(10, firstFewLines.length));
    
    sampleLines.forEach(line => {
      if (line.trim()) {
        commaCount += (line.match(/,/g) || []).length;
        semicolonCount += (line.match(/;/g) || []).length;
        tabCount += (line.match(/\t/g) || []).length;
      }
    });
    
    // If there are tabs, it's likely TSV (tab-separated values)
    if (tabCount > commaCount && tabCount > semicolonCount) {
      return '\t';
    }
    
    // If there are more semicolons than commas, use semicolon
    if (semicolonCount > commaCount) {
      return ';';
    }
    
    // Default to comma
    return ',';
  };

  // Detect the separator from the first few lines
  const separator = detectSeparator(lines);
  
  console.log(`Detected separator: ${separator === '\t' ? 'TAB' : separator}`);

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    try {
      // Handle quoted values (e.g., "word, with comma", "clue")
      const parts: string[] = [];
      let currentPart = '';
      let insideQuotes = false;
      let escapeNext = false;

      for (let i = 0; i < trimmedLine.length; i++) {
        const char = trimmedLine[i];
        
        if (escapeNext) {
          currentPart += char;
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          escapeNext = true;
          continue;
        }

        if (char === '"') {
          insideQuotes = !insideQuotes;
          continue;
        }

        if (char === separator && !insideQuotes) {
          parts.push(currentPart.trim());
          currentPart = '';
          continue;
        }

        currentPart += char;
      }
      
      // Add the last part
      parts.push(currentPart.trim());

      // Remove surrounding quotes from each part
      const cleanedParts = parts.map(part => 
        part.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
      );

      // If we have at least one part (the word)
      if (cleanedParts.length >= 1 && cleanedParts[0]) {
        const word = cleanedParts[0].toUpperCase();
        
        // Use the rest of the parts as the clue (join with the original separator)
        // Or if only one part, use default clue
        let clue: string;
        if (cleanedParts.length >= 2) {
          // Join remaining parts with comma (standard for CSV output)
          clue = cleanedParts.slice(1).join(', ');
        } else {
          clue = `Clue for ${word}`;
        }

        if (word && isValidWord(word)) {
          wordClues.push({ word, clue });
        } else if (word) {
          console.warn(`Invalid word on line ${lineIndex + 1}: "${word}"`);
        }
      }
    } catch (error) {
      console.error(`Error parsing line ${lineIndex + 1}: "${trimmedLine}"`, error);
      // Skip invalid lines
    }
  });

  // Remove duplicates (keep first occurrence)
  const uniqueWords = new Set<string>();
  const uniqueWordClues = wordClues.filter(item => {
    if (uniqueWords.has(item.word)) {
      return false;
    }
    uniqueWords.add(item.word);
    return true;
  });

  return uniqueWordClues;
};

export const isValidWord = (word: string): boolean => {
  // Allow letters, hyphens, and apostrophes (common in crosswords)
  // Examples: "E-MAIL", "O'BRIEN", "RAIN-COAT"
  return /^[A-Z\-']+$/i.test(word);
};

export const downloadSampleCsv = (): void => {
  const sampleWords = [
    'CROSSWORD,Game where you fill in words based on clues',
    'PUZZLE,Brain teaser or problem to solve',
    'GENERATOR,Tool that creates something automatically',
    'REACT,JavaScript library for building user interfaces',
    'TYPESCRIPT,JavaScript with syntax for types',
    'JAVASCRIPT,Programming language for the web',
    'ALGORITHM,Step-by-step procedure for calculations',
    'E-MAIL,Electronic mail (with hyphen)',
    "O'BRIEN,Common Irish surname",
    "RAIN-COAT,Waterproof jacket for rainy weather"
  ];
  const csvContent = sampleWords.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'crossword_words_sample.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Alternative version with semicolon separator
export const downloadSampleSemicolonCsv = (): void => {
  const sampleWords = [
    'CROSSWORD;Game where you fill in words based on clues',
    'PUZZLE;Brain teaser or problem to solve',
    'GENERATOR;Tool that creates something automatically',
    'REACT;JavaScript library for building user interfaces',
    'TYPESCRIPT;JavaScript with syntax for types',
    'JAVASCRIPT;Programming language for the web',
    'ALGORITHM;Step-by-step procedure for calculations'
  ];
  const csvContent = sampleWords.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'crossword_words_sample_semicolon.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportWordsToCsv = (words: WordClue[], useSemicolon: boolean = false): string => {
  if (words.length === 0) {
    throw new Error('No words to export');
  }
  
  const separator = useSemicolon ? ';' : ',';
  
  const csvContent = words.map(w => {
    // Escape quotes in the clue
    const escapedClue = w.clue.replace(/"/g, '""');
    // If clue contains the separator or quotes, wrap in quotes
    const formattedClue = w.clue.includes(separator) || w.clue.includes('"') 
      ? `"${escapedClue}"` 
      : w.clue;
    
    return `${w.word}${separator}${formattedClue}`;
  }).join('\n');
  
  return csvContent;
};

// Helper function to export with a specific separator
export const exportWordsWithSeparator = (
  words: WordClue[], 
  separator: string = ','
): string => {
  if (words.length === 0) {
    throw new Error('No words to export');
  }
  
  const csvContent = words.map(w => {
    // Escape quotes in the clue
    const escapedClue = w.clue.replace(/"/g, '""');
    // If clue contains the separator or quotes, wrap in quotes
    const formattedClue = w.clue.includes(separator) || w.clue.includes('"') 
      ? `"${escapedClue}"` 
      : w.clue;
    
    return `${w.word}${separator}${formattedClue}`;
  }).join('\n');
  
  return csvContent;
};

// New function to analyze CSV structure
export const analyzeCsvStructure = (content: string): {
  separator: string;
  lineCount: number;
  validLines: number;
  sampleLines: string[];
} => {
  const lines = content.split(/\r\n|\n|\r/).filter(line => line.trim());
  
  if (lines.length === 0) {
    return { separator: ',', lineCount: 0, validLines: 0, sampleLines: [] };
  }

  // Detect separator
  let commaCount = 0;
  let semicolonCount = 0;
  let tabCount = 0;
  
  lines.slice(0, Math.min(10, lines.length)).forEach(line => {
    commaCount += (line.match(/,/g) || []).length;
    semicolonCount += (line.match(/;/g) || []).length;
    tabCount += (line.match(/\t/g) || []).length;
  });
  
  let detectedSeparator = ',';
  if (tabCount > commaCount && tabCount > semicolonCount) {
    detectedSeparator = '\t';
  } else if (semicolonCount > commaCount) {
    detectedSeparator = ';';
  }
  
  // Count valid lines
  let validLines = 0;
  lines.forEach(line => {
    if (line.trim()) {
      const parts = line.split(detectedSeparator);
      if (parts.length >= 1 && isValidWord(parts[0].trim().toUpperCase())) {
        validLines++;
      }
    }
  });
  
  return {
    separator: detectedSeparator,
    lineCount: lines.length,
    validLines,
    sampleLines: lines.slice(0, 3)
  };
};