import React from 'react';
import { type WordClue } from '../../types';
// import './WordList.css';

interface WordListProps {
  words: WordClue[];
  onRemoveWord: (index: number) => void;
  onUpdateClue?: (index: number, clue: string) => void;
}

export const WordList: React.FC<WordListProps> = ({
  words,
  onRemoveWord,
  onUpdateClue
}) => {
  const totalLetters = words.reduce((sum, w) => sum + w.word.length, 0);
  const longestWord = words.reduce((max, w) => Math.max(max, w.word.length), 0);

  return (
    <div className="word-list-container">
      <div className="word-list-header">
        <h2>Word List ({words.length})</h2>
        <span className="word-list-subtitle">
          {words.length > 0 && `Total letters: ${totalLetters}`}
        </span>
      </div>
      
      {words.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p>No words added yet.</p>
          <p className="empty-state-hint">
            Add words manually or upload a CSV file to get started!
          </p>
        </div>
      ) : (
        <>
          <div className="word-list-scroll">
            <ul className="word-list">
              {words.map((item, index) => (
                <li key={index} className="word-item">
                  <div className="word-info">
                    <span className="word-text">{item.word}</span>
                    <span className="word-length">{item.word.length} letters</span>
                    {onUpdateClue ? (
                      <input
                        type="text"
                        value={item.clue}
                        onChange={(e) => onUpdateClue(index, e.target.value)}
                        className="word-clue-input"
                        placeholder="Enter clue..."
                      />
                    ) : (
                      <span className="word-clue">{item.clue}</span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveWord(index)}
                    className="btn-remove"
                    aria-label={`Remove ${item.word}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="word-list-stats">
            <div className="stat">
              <span className="stat-label">Total words:</span>
              <span className="stat-value">{words.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Longest word:</span>
              <span className="stat-value">{longestWord} letters</span>
            </div>
            <div className="stat">
              <span className="stat-label">Avg clue length:</span>
              <span className="stat-value">
                {Math.round(words.reduce((sum, w) => sum + w.clue.length, 0) / words.length)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};