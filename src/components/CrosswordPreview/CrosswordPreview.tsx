import React from 'react';
import { type PlacedWord, type SolutionWordConfig } from '../../types';
import './CrosswordPreview.css';

interface CrosswordPreviewProps {
  grid: string[][];
  placedWords: PlacedWord[];
  gridRows: number;
  gridCols: number;
  solutionWord?: SolutionWordConfig | null;
}

export const CrosswordPreview: React.FC<CrosswordPreviewProps> = ({
  grid,
  placedWords,
  gridRows,
  gridCols,
  solutionWord
}) => {
  const getCellNumber = (row: number, col: number): number | null => {
    if (!grid[row] || !grid[row][col]) return null;
    
    for (const word of placedWords) {
      if (word.start.row === row && word.start.col === col) {
        return word.number;
      }
    }
    return null;
  };

  const getSolutionLetterInfo = (row: number, col: number): { 
    isSolution: boolean; 
    position: number | null;
  } => {
    if (!solutionWord?.letters) return { isSolution: false, position: null };
    
    const letterInfo = solutionWord.letters.find(letter => 
      letter.row === row && letter.col === col
    );
    
    if (letterInfo) {
      return {
        isSolution: true,
        position: letterInfo.solutionLetterPosition
      };
    }
    
    return { isSolution: false, position: null };
  };

  const hasContent = grid.some(row => row.some(cell => cell !== ''));
  if (!hasContent) {
    return (
      <div className="crossword-preview-empty">
        <p>No crossword generated yet. Click "Generate Crossword" to create one.</p>
      </div>
    );
  }

  return (
    <div className="crossword-preview-wrapper traditional-crossword">
      <div 
        className="crossword-preview-grid" 
        style={{ 
          '--grid-rows': gridRows,
          '--grid-cols': gridCols
        } as React.CSSProperties}
      >
        {Array.from({ length: gridRows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="preview-grid-row">
            {Array.from({ length: gridCols }).map((_, colIndex) => {
              const cellNumber = getCellNumber(rowIndex, colIndex);
              const hasWord = grid[rowIndex] && grid[rowIndex][colIndex] !== '';
              const { isSolution, position } = getSolutionLetterInfo(rowIndex, colIndex);
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`preview-grid-cell ${hasWord ? 'has-word' : 'no-word'} ${isSolution ? 'solution-letter' : ''}`}
                >
                  {cellNumber && (
                    <div className="preview-cell-number">{cellNumber}</div>
                  )}
                  {isSolution && position && (
                    <div className="solution-circle">
                      <span className="solution-number">{position}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {solutionWord && (
        <div className="solution-word-display">
          <h4>Solution Word: {solutionWord.word.split('').map(() => '_').join(' ')}</h4>
        </div>
      )}
    </div>
  );
};