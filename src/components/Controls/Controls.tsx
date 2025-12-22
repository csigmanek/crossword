import React from 'react';
// import './Controls.css';

interface ControlsProps {
  gridRows: number;
  gridCols: number;
  onGridRowsChange: (rows: number) => void;
  onGridColsChange: (cols: number) => void;
  onGenerate: () => void;
  onClearAll: () => void;
  isGenerating: boolean;
  hasWords: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  gridRows,
  gridCols,
  onGridRowsChange,
  onGridColsChange,
  onGenerate,
  onClearAll,
  isGenerating,
  hasWords
}) => {
  return (
    <div className="controls">
      <div className="grid-size-controls">
        <div className="grid-slider">
          <label htmlFor="gridRows">Rows: {gridRows}</label>
          <input
            type="range"
            id="gridRows"
            min="5"
            max="30"
            value={gridRows}
            onChange={(e) => onGridRowsChange(parseInt(e.target.value))}
            className="slider"
          />
        </div>
        <div className="grid-slider">
          <label htmlFor="gridCols">Columns: {gridCols}</label>
          <input
            type="range"
            id="gridCols"
            min="5"
            max="30"
            value={gridCols}
            onChange={(e) => onGridColsChange(parseInt(e.target.value))}
            className="slider"
          />
        </div>
        <div className="grid-info">
          Total cells: {gridRows} × {gridCols} = {gridRows * gridCols}
        </div>
      </div>

      <div className="action-buttons">
        <button
          onClick={onGenerate}
          className="btn btn-generate"
          disabled={!hasWords || isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner"></span>
              Generating...
            </>
          ) : (
            'Generate Crossword'
          )}
        </button>
        <button
          onClick={onClearAll}
          className="btn btn-clear"
          disabled={!hasWords}
        >
          Clear All
        </button>
      </div>
    </div>
  );
};