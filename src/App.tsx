import { useState, useRef } from 'react';
import { useCrossword } from './hooks/useCrossword';
import { useCSVParser } from './hooks/useCSVParser';
import { CrosswordGrid } from './components/CrosswordGrid/CrosswordGrid';
import { WordList } from './components/WordList/WordList';
import { Controls } from './components/Controls/Controls';
import { CluesTable } from './components/CluesTable/CluesTable';
import './App.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [clueValue, setClueValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    words,
    gridRows,
    gridCols,
    crosswordGrid,
    placedWords,
    generationStats,
    isGenerating,
    setGridRows,
    setGridCols,
    addWord,
    removeWord,
    updateWordClue,
    generateCrosswordPuzzle,
    clearAll,
  } = useCrossword();

  const {
    csvError,
    csvSuccess,
    handleCsvUpload,
    handleExportWords,
    downloadSampleCsv,
    clearMessages,
    isValidWord,
  } = useCSVParser();

  const handleAddWord = () => {
    if (isValidWord(inputValue)) {
      const success = addWord(inputValue, clueValue);
      if (success) {
        setInputValue('');
        setClueValue('');
        clearMessages();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddWord();
    }
  };

  const handleGenerate = () => {
    try {
      generateCrosswordPuzzle();
      clearMessages();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearMessages();
    handleCsvUpload(file, words, (newWords) => {
      // Add new words to the list
      newWords.forEach(wordClue => {
        addWord(wordClue.word, wordClue.clue);
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  const acrossWords = placedWords.filter(w => w.direction === 'horizontal')
    .sort((a, b) => a.number - b.number);
  const downWords = placedWords.filter(w => w.direction === 'vertical')
    .sort((a, b) => a.number - b.number);

  return (
    <div className="app">
      <header className="header">
        <h1>Crossword Generator</h1>
        <p className="subtitle">Enter words and clues • Smart crossword generation algorithm • CSV support</p>
      </header>

      <main className="main-content">
        <div className="input-section">
          <div className="csv-section">
            <div className="csv-buttons">
              <div className="csv-upload-group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCsvFileUpload}
                  accept=".csv,.txt"
                  className="csv-input"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="btn btn-csv">
                  📁 Upload CSV
                </label>
                <button
                  onClick={downloadSampleCsv}
                  className="btn btn-sample"
                >
                  📥 Download Sample CSV
                </button>
              </div>
              <button
                onClick={() => handleExportWords(words)}
                className="btn btn-export"
                disabled={words.length === 0}
              >
                📤 Export to CSV
              </button>
            </div>
            
            <div className="csv-info">
              <p className="csv-hint">
                CSV Format: word,clue (one per line). Second column is optional but recommended.
              </p>
              
              {(csvError || csvSuccess) && (
                <div className={`csv-message ${csvError ? 'error' : 'success'}`}>
                  {csvError || csvSuccess}
                </div>
              )}
            </div>
          </div>

          <div className="word-input-container">
            <div className="input-row">
              <div className="input-group">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value.toUpperCase());
                    clearMessages();
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Word (letters only)"
                  className="word-input"
                  maxLength={20}
                />
                <input
                  type="text"
                  value={clueValue}
                  onChange={(e) => setClueValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Clue (optional)"
                  className="clue-input"
                />
                <button 
                  onClick={handleAddWord}
                  className="btn btn-primary"
                  disabled={!inputValue.trim()}
                >
                  Add Word
                </button>
              </div>
            </div>
            <p className="input-hint">
              Press Enter or click "Add Word" to add to the list
            </p>
          </div>

          <Controls
            gridRows={gridRows}
            gridCols={gridCols}
            onGridRowsChange={setGridRows}
            onGridColsChange={setGridCols}
            onGenerate={handleGenerate}
            onClearAll={clearAll}
            isGenerating={isGenerating}
            hasWords={words.length > 0}
          />
        </div>

        <div className="content-section">
          <WordList
            words={words}
            onRemoveWord={removeWord}
            onUpdateClue={updateWordClue}
          />

          <div className="crossword-container">
            <div className="crossword-header">
              <h2>Crossword Grid</h2>
              {generationStats && (
                <div className="generation-stats">
                  <span className="stat-badge">Placed: {generationStats.placed}/{generationStats.total}</span>
                  <span className="stat-badge">Intersections: {generationStats.intersections}</span>
                  <span className="stat-badge">Grid: {gridRows}×{gridCols}</span>
                </div>
              )}
            </div>
            
            {crosswordGrid ? (
              <>
                <CrosswordGrid
                  grid={crosswordGrid}
                  placedWords={placedWords}
                  gridRows={gridRows}
                  gridCols={gridCols}
                />
                
                <CluesTable
                  acrossWords={acrossWords}
                  downWords={downWords}
                  onClueUpdate={(wordNumber, newClue) => {
                    const wordIndex = placedWords.findIndex(w => w.number === wordNumber);
                    if (wordIndex !== -1) {
                      const updatedWords = [...placedWords];
                      updatedWords[wordIndex].clue = newClue;
                      // Update the original words list as well
                      const originalWordIndex = words.findIndex(w => w.word === updatedWords[wordIndex].word);
                      if (originalWordIndex !== -1) {
                        updateWordClue(originalWordIndex, newClue);
                      }
                    }
                  }}
                />
              </>
            ) : (
              <div className="empty-crossword">
                <div className="placeholder">
                  <div className="placeholder-icon">🧩</div>
                  <p>Your generated crossword will appear here</p>
                  <p className="placeholder-hint">
                    {words.length > 0 
                      ? `Ready to generate crossword with ${words.length} words`
                      : 'Add words and click "Generate Crossword"'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Crossword Generator • Modular Architecture • Editable clues • CSV import/export</p>
      </footer>
    </div>
  );
}

export default App;