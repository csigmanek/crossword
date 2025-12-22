import React from 'react';
import { type PlacedWord } from '../../types';
// import './CrosswordGrid.css';

interface CrosswordGridProps {
  grid: string[][];
  placedWords: PlacedWord[];
  gridRows: number;
  gridCols: number;
}

export const CrosswordGrid: React.FC<CrosswordGridProps> = ({
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
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`grid-cell ${cell ? 'filled' : 'empty'}`}
                  title={`Position: [${rowIndex}, ${colIndex}]`}
                >
                  {cellNumber && (
                    <div className="cell-number">{cellNumber}</div>
                  )}
                  {cell && <span className="cell-letter">{cell}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};