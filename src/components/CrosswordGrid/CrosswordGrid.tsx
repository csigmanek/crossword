import React from 'react';
import { type PlacedWord, type SolutionWordConfig } from '../../types';
// import './CrosswordGrid.css';

interface CrosswordGridProps {
  grid: string[][];
  placedWords: PlacedWord[];
  gridRows: number;
  gridCols: number;
  previewMode?: boolean;
  solutionWord?: SolutionWordConfig | null;
}

export const CrosswordGrid: React.FC<CrosswordGridProps> = ({
  grid,
  placedWords,
  gridRows,
  gridCols,
  previewMode = false,
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
    letter: string | null;
  } => {
    if (!solutionWord?.letters) return { isSolution: false, position: null, letter: null };
    
    const letterInfo = solutionWord.letters.find(letter => 
      letter.row === row && letter.col === col
    );
    
    if (letterInfo) {
      return {
        isSolution: true,
        position: letterInfo.solutionLetterPosition,
        letter: solutionWord.word[letterInfo.solutionLetterPosition - 1]
      };
    }
    
    return { isSolution: false, position: null, letter: null };
  };

  return (
    <div className="crossword-grid-wrapper">
      <div 
        className="crossword-grid" 
        style={{ 
          '--grid-rows': gridRows,
          '--grid-cols': gridCols
        } as React.CSSProperties}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {row.map((cell, colIndex) => {
              const cellNumber = getCellNumber(rowIndex, colIndex);
              const hasWord = cell !== '';
              const { isSolution, position } = getSolutionLetterInfo(rowIndex, colIndex);
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`grid-cell ${hasWord ? 'filled' : 'empty'} ${previewMode ? 'preview-mode' : ''} ${isSolution ? 'solution-letter' : ''}`}
                  title={`Position: [${rowIndex}, ${colIndex}]${isSolution ? ` (Solution position ${position})` : ''}`}
                >
                  {cellNumber && (
                    <div className="cell-number">{cellNumber}</div>
                  )}
                  {!previewMode && cell && (
                    <>
                      <span className="cell-letter">{cell}</span>
                      {isSolution && position && (
                        <div className="solution-circle">
                          <span className="solution-number">{position}</span>
                        </div>
                      )}
                    </>
                  )}
                  {previewMode && isSolution && position && (
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
          <h4>Solution Word: {solutionWord.word}</h4>
          {solutionWord.description && (
            <p className="solution-theme">{solutionWord.description}</p>
          )}
          <p className="solution-instruction">
            Circled letters (with numbers) spell out the solution word in order
          </p>
        </div>
      )}
    </div>
  );
};