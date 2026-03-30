(() => {
  // Seleção retangular principal: definida por anchorCell e (extentRow, extentCol)
  let anchorCell = null;
  let extentRow = -1;
  let extentCol = -1;

  // Células individuais adicionadas via Ctrl+drag
  const individualCells = new Set();

  // Estado de arrastar
  // dragMode: 'replace' | 'add' | 'remove'
  let isDragging = false;
  let dragMode = null;
  let dragTable = null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getTable(el) {
    let cur = el.parentElement;
    while (cur && cur.tagName !== 'TABLE') cur = cur.parentElement;
    return cur;
  }

  function clearHighlights() {
    document.querySelectorAll('.table-cell-selected, .table-cell-anchor').forEach(el => {
      el.classList.remove('table-cell-selected', 'table-cell-anchor');
    });
  }

  function clearSelection() {
    clearHighlights();
    individualCells.clear();
    anchorCell = null;
    extentRow = -1;
    extentCol = -1;
  }

  // Retorna todas as células do retângulo atual
  function getRectangleCells() {
    if (!anchorCell) return [];
    const table = getTable(anchorCell);
    if (!table) return [];

    const aRow = anchorCell.parentElement.rowIndex;
    const aCol = anchorCell.cellIndex;
    const eRow = extentRow >= 0 ? extentRow : aRow;
    const eCol = extentCol >= 0 ? extentCol : aCol;

    const cells = [];
    for (let r = Math.min(aRow, eRow); r <= Math.max(aRow, eRow); r++) {
      const row = table.rows[r];
      if (!row) continue;
      for (let c = Math.min(aCol, eCol); c <= Math.max(aCol, eCol); c++) {
        const cell = row.cells[c];
        if (cell) cells.push(cell);
      }
    }
    return cells;
  }

  // Congela o retângulo atual em células individuais e reseta o retângulo
  function freezeRectangle() {
    for (const cell of getRectangleCells()) individualCells.add(cell);
    anchorCell = null;
    extentRow = -1;
    extentCol = -1;
  }

  // Retorna union de todas as células selecionadas (retângulo + individuais)
  function getAllSelected() {
    const all = new Set(individualCells);
    for (const cell of getRectangleCells()) all.add(cell);
    return all;
  }

  // Verifica se uma célula já está selecionada (retângulo ou individual)
  function isCellSelected(cell) {
    if (individualCells.has(cell)) return true;
    if (!anchorCell) return false;
    if (getTable(cell) !== getTable(anchorCell)) return false;
    const aRow = anchorCell.parentElement.rowIndex;
    const aCol = anchorCell.cellIndex;
    const eRow = extentRow >= 0 ? extentRow : aRow;
    const eCol = extentCol >= 0 ? extentCol : aCol;
    const r = cell.parentElement.rowIndex;
    const c = cell.cellIndex;
    return r >= Math.min(aRow, eRow) && r <= Math.max(aRow, eRow) &&
           c >= Math.min(aCol, eCol) && c <= Math.max(aCol, eCol);
  }

  function applyHighlights() {
    clearHighlights();

    for (const cell of individualCells) {
      cell.classList.add('table-cell-selected');
    }

    if (anchorCell) {
      const table = getTable(anchorCell);
      if (table) {
        const aRow = anchorCell.parentElement.rowIndex;
        const aCol = anchorCell.cellIndex;
        const eRow = extentRow >= 0 ? extentRow : aRow;
        const eCol = extentCol >= 0 ? extentCol : aCol;

        for (let r = Math.min(aRow, eRow); r <= Math.max(aRow, eRow); r++) {
          const row = table.rows[r];
          if (!row) continue;
          for (let c = Math.min(aCol, eCol); c <= Math.max(aCol, eCol); c++) {
            const cell = row.cells[c];
            if (cell) cell.classList.add('table-cell-selected');
          }
        }
      }

      anchorCell.classList.remove('table-cell-selected');
      anchorCell.classList.add('table-cell-anchor');
    }
  }

  // ── Mouse ─────────────────────────────────────────────────────────────────

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;

    const cell = e.target.closest('td, th');
    if (!cell) {
      clearSelection();
      return;
    }

    const table = getTable(cell);
    if (!table) return;

    e.preventDefault();
    e.stopPropagation();

    if (isCellSelected(cell)) {
      // Célula já selecionada: entra em modo remoção (congela retângulo primeiro)
      freezeRectangle();
      individualCells.delete(cell);
      dragMode = 'remove';
    } else if (e.ctrlKey) {
      // Ctrl + célula nova: adiciona sem limpar seleção existente
      freezeRectangle();
      individualCells.add(cell);
      anchorCell = cell;
      extentRow = cell.parentElement.rowIndex;
      extentCol = cell.cellIndex;
      dragMode = 'add';
    } else {
      // Clique simples em célula nova: limpa tudo e inicia retângulo
      clearSelection();
      anchorCell = cell;
      extentRow = cell.parentElement.rowIndex;
      extentCol = cell.cellIndex;
      dragMode = 'replace';
    }

    isDragging = true;
    dragTable = table;

    applyHighlights();
  }, true);

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const cell = e.target.closest('td, th');
    if (!cell) return;

    const table = getTable(cell);
    if (table !== dragTable) return;

    if (dragMode === 'remove') {
      // Remove cada célula passada
      individualCells.delete(cell);
    } else if (dragMode === 'add') {
      // Pinta cada célula passada
      individualCells.add(cell);
      anchorCell = cell;
      extentRow = cell.parentElement.rowIndex;
      extentCol = cell.cellIndex;
    } else {
      // Expande o retângulo
      extentRow = cell.parentElement.rowIndex;
      extentCol = cell.cellIndex;
    }

    applyHighlights();
  }, true);

  document.addEventListener('mouseup', () => {
    isDragging = false;
    dragMode = null;
    dragTable = null;
  }, true);

  // ── Teclado ───────────────────────────────────────────────────────────────

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSelection();
      return;
    }

    const arrows = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'];
    if (!e.ctrlKey || !e.shiftKey || !arrows.includes(e.key) || !anchorCell) return;

    e.preventDefault();
    e.stopPropagation();

    const table = getTable(anchorCell);
    if (!table) return;

    const aRow = anchorCell.parentElement.rowIndex;
    const curExtRow = extentRow >= 0 ? extentRow : aRow;
    const curExtCol = extentCol >= 0 ? extentCol : anchorCell.cellIndex;

    if (e.key === 'ArrowDown') {
      extentRow = table.rows.length - 1;
      if (extentCol < 0) extentCol = curExtCol;
    } else if (e.key === 'ArrowUp') {
      extentRow = 0;
      if (extentCol < 0) extentCol = curExtCol;
    } else if (e.key === 'ArrowRight') {
      const minR = Math.min(aRow, curExtRow);
      const maxR = Math.max(aRow, curExtRow);
      let maxCols = 0;
      for (let r = minR; r <= maxR; r++) {
        if (table.rows[r]) maxCols = Math.max(maxCols, table.rows[r].cells.length);
      }
      extentCol = maxCols - 1;
      if (extentRow < 0) extentRow = curExtRow;
    } else if (e.key === 'ArrowLeft') {
      extentCol = 0;
      if (extentRow < 0) extentRow = curExtRow;
    }

    // Seta transforma tudo em retângulo puro
    individualCells.clear();
    applyHighlights();
  }, true);

  // ── Ctrl+C: copia células selecionadas como TSV ───────────────────────────

  document.addEventListener('copy', (e) => {
    const allCells = getAllSelected();
    if (allCells.size === 0) return;

    // Descobre a tabela e o bounding box
    let table = null;
    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;

    for (const cell of allCells) {
      const t = getTable(cell);
      if (!table) table = t;
      if (t !== table) continue; // ignora células de outras tabelas

      const r = cell.parentElement.rowIndex;
      const c = cell.cellIndex;
      if (r < minRow) minRow = r;
      if (r > maxRow) maxRow = r;
      if (c < minCol) minCol = c;
      if (c > maxCol) maxCol = c;
    }

    if (!table) return;

    // Constrói TSV: posições sem célula selecionada viram string vazia
    const lines = [];
    for (let r = minRow; r <= maxRow; r++) {
      const cols = [];
      for (let c = minCol; c <= maxCol; c++) {
        const row = table.rows[r];
        const cell = row ? row.cells[c] : null;
        cols.push(cell && allCells.has(cell) ? cell.innerText.trim() : '');
      }
      lines.push(cols.join('\t'));
    }

    e.preventDefault();
    e.clipboardData.setData('text/plain', lines.join('\n'));
  }, true);
})();
