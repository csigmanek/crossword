import React, { useState } from 'react';
import type { PlacedWord } from '../../types';
// import './CluesTable.css';

interface CluesTableProps {
  acrossWords: PlacedWord[];
  downWords: PlacedWord[];
  onClueUpdate: (wordNumber: number, newClue: string) => void;
}

export const CluesTable: React.FC<CluesTableProps> = ({
  acrossWords,
  downWords,
  onClueUpdate
}) => {
  const [editingClue, setEditingClue] = useState<{ 
    number: number; 
    type: 'across' | 'down' 
  } | null>(null);

  const handleClueClick = (wordNumber: number, type: 'across' | 'down') => {
    setEditingClue({ number: wordNumber, type });
  };

  const handleClueUpdate = (wordNumber: number, newClue: string) => {
    onClueUpdate(wordNumber, newClue);
    setEditingClue(null);
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    wordNumber: number,
    currentClue: string
  ) => {
    if (e.key === 'Enter') {
      handleClueUpdate(wordNumber, (e.target as HTMLInputElement).value || currentClue);
    } else if (e.key === 'Escape') {
      setEditingClue(null);
    }
  };

  return (
    <div className="clues-section">
      <div className="clues-column">
        <div className="clues-header">
          <h3>Across</h3>
          <span className="clues-count">({acrossWords.length})</span>
        </div>
        <div className="clues-table">
          {acrossWords.length === 0 ? (
            <div className="no-clues">
              No across words placed
            </div>
          ) : (
            acrossWords.map(word => (
              <div key={word.number} className="clue-row">
                <span className="clue-number">{word.number}.</span>
                <div className="clue-content">
                  <div className="clue-word-info">
                    <span className="clue-word">{word.word}</span>
                    <span className="clue-length">({word.word.length})</span>
                    <span className="clue-position">
                      [{word.start.row},{word.start.col}]
                    </span>
                  </div>
                  {editingClue?.number === word.number && editingClue?.type === 'across' ? (
                    <div className="clue-edit-container">
                      <input
                        type="text"
                        value={word.clue}
                        onChange={(e) => {
                          // Update immediately as user types
                          const updatedClue = e.target.value;
                          const wordToUpdate = acrossWords.find(w => w.number === word.number);
                          if (wordToUpdate) {
                            onClueUpdate(word.number, updatedClue);
                          }
                        }}
                        onBlur={() => setEditingClue(null)}
                        onKeyDown={(e) => handleKeyPress(e, word.number, word.clue)}
                        className="clue-input-edit"
                        autoFocus
                        placeholder="Enter clue..."
                      />
                      <div className="clue-edit-hint">
                        Press Enter to save, Esc to cancel
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="clue-text"
                      onClick={() => handleClueClick(word.number, 'across')}
                      title="Click to edit"
                    >
                      {word.clue}
                    </div>
                  )}
                  {word.intersections > 0 && (
                    <div className="clue-intersections">
                      {word.intersections} intersection{word.intersections !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="clues-column">
        <div className="clues-header">
          <h3>Down</h3>
          <span className="clues-count">({downWords.length})</span>
        </div>
        <div className="clues-table">
          {downWords.length === 0 ? (
            <div className="no-clues">
              No down words placed
            </div>
          ) : (
            downWords.map(word => (
              <div key={word.number} className="clue-row">
                <span className="clue-number">{word.number}.</span>
                <div className="clue-content">
                  <div className="clue-word-info">
                    <span className="clue-word">{word.word}</span>
                    <span className="clue-length">({word.word.length})</span>
                    <span className="clue-position">
                      [{word.start.row},{word.start.col}]
                    </span>
                  </div>
                  {editingClue?.number === word.number && editingClue?.type === 'down' ? (
                    <div className="clue-edit-container">
                      <input
                        type="text"
                        value={word.clue}
                        onChange={(e) => {
                          const updatedClue = e.target.value;
                          const wordToUpdate = downWords.find(w => w.number === word.number);
                          if (wordToUpdate) {
                            onClueUpdate(word.number, updatedClue);
                          }
                        }}
                        onBlur={() => setEditingClue(null)}
                        onKeyDown={(e) => handleKeyPress(e, word.number, word.clue)}
                        className="clue-input-edit"
                        autoFocus
                        placeholder="Enter clue..."
                      />
                      <div className="clue-edit-hint">
                        Press Enter to save, Esc to cancel
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="clue-text"
                      onClick={() => handleClueClick(word.number, 'down')}
                      title="Click to edit"
                    >
                      {word.clue}
                    </div>
                  )}
                  {word.intersections > 0 && (
                    <div className="clue-intersections">
                      {word.intersections} intersection{word.intersections !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};