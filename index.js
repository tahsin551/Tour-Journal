/* index.js — builds the dynamic "add row" 3-column grid, using cell.js for each box */

const grid = document.getElementById('grid');
const visList = document.getElementById('visList');
let rowCounter = 0;

window.onCellsChanged = ()=> rebuildVisList(visList);

function makeRow(){
  rowCounter++;
  const rowId = 'row-' + rowCounter;
  const rowWrap = document.createElement('div');
  rowWrap.className = 'row-block';
  rowWrap.dataset.id = rowId;

  const controls = document.createElement('div');
  controls.className = 'row-controls';
  controls.innerHTML = `
    <span>Row</span>
    <span>
      <button type="button" class="toggle-row">Hide row</button>
      <button type="button" class="del-row danger">Delete row</button>
    </span>
  `;

  const cellsHolder = document.createElement('div');
  cellsHolder.className = 'row-cells';

  for(let i=0;i<3;i++){
    cellsHolder.appendChild(createPhotoCell());
  }

  rowWrap.appendChild(controls);
  rowWrap.appendChild(cellsHolder);

  controls.querySelector('.toggle-row').addEventListener('click', (e)=>{
    const isHidden = cellsHolder.classList.toggle('hidden-row-cells');
    cellsHolder.querySelectorAll('.cell').forEach(c => c.classList.toggle('hidden-cell', isHidden));
    e.target.textContent = isHidden ? 'Show row' : 'Hide row';
    rebuildVisList(visList);
  });
  controls.querySelector('.del-row').addEventListener('click', ()=>{
    rowWrap.remove();
    rebuildVisList(visList);
  });

  return rowWrap;
}

function addRow(){
  grid.appendChild(makeRow());
  rebuildVisList(visList);
}

// init with 3 rows x 3 columns
for(let r=0;r<3;r++){ addRow(); }

document.getElementById('addRowBtn').addEventListener('click', addRow);

document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(!confirm('Clear the whole page and start over?')) return;
  grid.innerHTML = '';
  rowCounter = 0;
  for(let r=0;r<3;r++){ addRow(); }
  document.getElementById('dayTitle').textContent = 'DAY 01';
});

bindPdfExport(
  document.getElementById('savePdfBtn'),
  document.getElementById('page'),
  document.getElementById('dayTitle'),
  'field_journal'
);
