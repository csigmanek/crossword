import React from 'react';
import { type PlacedWord } from '../../types';
import './CrosswordPreview.css';

interface CrosswordPreviewProps {
  grid: string[][];
  placedWords: PlacedWord[];
  gridRows: number;
  gridCols: number;
}

export const CrosswordPreview: React.FC<CrosswordPreviewProps> = ({
  grid,
  placedWords,
  gridRows,
  gridCols
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
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`preview-grid-cell ${hasWord ? 'has-word' : 'no-word'}`}
                >
                  {cellNumber && (
                    <div className="preview-cell-number">{cellNumber}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};