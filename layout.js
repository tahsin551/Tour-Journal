/* layout.js — builds a fixed custom layout:
   Row 1: 2 columns
   Row 2: 2 columns
   Row 3: 1 box spanning both columns
   Still uses the same photo-box logic as the main page (cell.js)
*/

const grid = document.getElementById('grid');
const visList = document.getElementById('visList');

window.onCellsChanged = ()=> rebuildVisList(visList);

function buildLayout(){
  grid.innerHTML = '';

  // Row 1: 2 boxes
  grid.appendChild(createPhotoCell());
  grid.appendChild(createPhotoCell());

  // Row 2: 2 boxes
  grid.appendChild(createPhotoCell());
  grid.appendChild(createPhotoCell());

  // Row 3: 1 box spanning both columns
  const wideCell = createPhotoCell();
  wideCell.classList.add('span-2');
  wideCell.querySelector('.photo-frame').style.height = '220px';
  grid.appendChild(wideCell);

  rebuildVisList(visList);
}

buildLayout();

document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(!confirm('Clear the whole page and start over?')) return;
  buildLayout();
  document.getElementById('dayTitle').textContent = 'DAY 01';
});

bindPdfExport(
  document.getElementById('savePdfBtn'),
  document.getElementById('page'),
  document.getElementById('dayTitle'),
  'field_journal_custom'
);
