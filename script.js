const grid = document.getElementById('grid');
const visList = document.getElementById('visList');
let cellCounter = 0;
let rowCounter = 0;

function makeCell(){
  cellCounter++;
  const id = 'cell-' + cellCounter;
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.dataset.id = id;

  cell.innerHTML = `
    <div class="cell-actions">
      <button title="Delete this box" class="del-cell">✕</button>
    </div>
    <div class="photo-frame">
      <label class="photo-frame-label">
        <input type="file" accept="image/*" class="file-input">
        <span class="placeholder">Click to upload photo</span>
      </label>
      <button type="button" class="resize-btn" title="Resize image box">↔</button>
      <span class="resize-handle" aria-hidden="true"></span>
    </div>
    <div class="caption" contenteditable="true" data-placeholder="Caption / scientific name"></div>
    <div class="cell-toolbar">
      <button class="fmt-btn" data-cmd="bold" title="Bold"><b>B</b></button>
      <button class="fmt-btn" data-cmd="italic" title="Italic (use for scientific names)"><i>I</i></button>
      <button class="fmt-btn" data-cmd="underline" title="Underline"><u>U</u></button>
    </div>
    
  `;

  const frame = cell.querySelector('.photo-frame');
  const resizeHandle = cell.querySelector('.resize-handle');
  const resizeButton = cell.querySelector('.resize-btn');

  function enableResize(){
    if(!resizeHandle || !resizeButton) return;

    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    const stopResize = ()=>{
      if(!isResizing) return;
      isResizing = false;
      resizeButton.classList.remove('is-active');
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    const getPoint = (e)=>{
      if(e.touches && e.touches.length){
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if(e.changedTouches && e.changedTouches.length){
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    };

    const beginResize = (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const point = getPoint(e);
      isResizing = true;
      resizeButton.classList.add('is-active');
      startX = point.x;
      startY = point.y;
      frame.style.aspectRatio = 'auto';
      const rect = frame.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'nwse-resize';
    };

    resizeHandle.addEventListener('mousedown', beginResize);
    resizeButton.addEventListener('mousedown', beginResize);
    resizeButton.addEventListener('touchstart', beginResize, {passive:false});

    const moveResize = (e)=>{
      if(!isResizing) return;
      e.preventDefault();
      const point = getPoint(e);
      const nextWidth = Math.max(140, startWidth + (point.x - startX));
      const nextHeight = Math.max(120, startHeight + (point.y - startY));
      const cell = frame.closest('.cell');
      frame.style.aspectRatio = '4 / 3';
      cell.style.width = `${nextWidth}px`;
      cell.style.height = `${nextHeight + 70}px`;
    };

    document.addEventListener('mousemove', moveResize);
    document.addEventListener('touchmove', moveResize, {passive:false});
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchend', stopResize);
    document.addEventListener('touchcancel', stopResize);
  }

  enableResize();

  function handleFile(file){
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e)=>{
      const label = frame.querySelector('.photo-frame-label');
      if(label) label.remove();

      let img = frame.querySelector('img');
      if(!img){
        img = document.createElement('img');
        frame.prepend(img);
      }

      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  cell.querySelector('.file-input').addEventListener('change', (e)=>{
    handleFile(e.target.files[0]);
  });

  const caption = cell.querySelector('.caption');
  const formatButtons = cell.querySelectorAll('.fmt-btn');

  function getTagName(command){
    return command === 'bold' ? 'strong' : command === 'italic' ? 'em' : 'u';
  }

  function insertStyledText(text){
    const selection = window.getSelection();
    if(!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    if(!range || !caption.contains(range.commonAncestorContainer)) return;

    const wrapper = document.createElement(getTagName(caption.dataset.activeFormat));
    wrapper.textContent = text;
    range.insertNode(wrapper);

    const newRange = document.createRange();
    newRange.setStartAfter(wrapper);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  caption.addEventListener('keydown', (e)=>{
    const activeFormat = caption.dataset.activeFormat;
    if(!activeFormat || e.ctrlKey || e.metaKey || e.altKey) return;

    if(e.key === 'Enter'){
      e.preventDefault();
      insertStyledText('\n');
      return;
    }

    if(e.key.length === 1){
      e.preventDefault();
      insertStyledText(e.key);
    }
  });

  formatButtons.forEach(btn=>{
    btn.addEventListener('mousedown', (e)=>{
      e.preventDefault();
      const command = btn.dataset.cmd;
      const isActive = btn.classList.contains('active');

      formatButtons.forEach(otherBtn => otherBtn.classList.remove('active'));
      caption.dataset.activeFormat = isActive ? '' : command;
      caption.focus();

      if(!isActive){
        btn.classList.add('active');
      }

      const selection = window.getSelection();
      if(selection && selection.rangeCount && !selection.isCollapsed){
        const range = selection.getRangeAt(0);
        const wrapper = document.createElement(getTagName(command));
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(wrapper);
        selection.addRange(newRange);
      }
    });
  });

  cell.querySelector('.del-cell').addEventListener('click', ()=>{
    cell.remove();
    rebuildVisList();
  });

  return cell;
}

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
      <button class="toggle-row" data-target="${rowId}">Hide row</button>
      <button class="del-row danger" data-target="${rowId}">Delete row</button>
    </span>
  `;

  const cellsHolder = document.createElement('div');
  cellsHolder.className = 'row-cells';
  cellsHolder.dataset.parent = rowId;

  for(let i=0;i<3;i++){
    cellsHolder.appendChild(makeCell());
  }

  rowWrap.appendChild(controls);
  rowWrap.appendChild(cellsHolder);
  return rowWrap;
}

function addRow(){
  const row = makeRow();
  grid.appendChild(row);
  bindRowButtons(row);
  rebuildVisList();
}

function bindRowButtons(row){
  const toggleBtn = row.querySelector('.toggle-row');
  const delBtn = row.querySelector('.del-row');
  toggleBtn.addEventListener('click', ()=>{
    const cellsHolder = row.querySelector('.row-cells');
    const isHidden = cellsHolder.classList.toggle('hidden-row-cells');
    cellsHolder.querySelectorAll('.cell').forEach(c=> c.classList.toggle('hidden-cell', isHidden));
    toggleBtn.textContent = isHidden ? 'Show row' : 'Hide row';
    rebuildVisList();
  });
  delBtn.addEventListener('click', ()=>{
    row.remove();
    rebuildVisList();
  });
}

function rebuildVisList(){
  visList.innerHTML = '';
  document.querySelectorAll('.cell').forEach((cell, idx)=>{
    const id = cell.dataset.id;
    const isHidden = cell.classList.contains('hidden-cell');
    const wrap = document.createElement('label');
    wrap.innerHTML = `<input type="checkbox" data-target="${id}" ${isHidden ? '' : 'checked'}> Box ${idx+1}`;
    visList.appendChild(wrap);
  });
  visList.querySelectorAll('input[type=checkbox]').forEach(chk=>{
    chk.addEventListener('change', ()=>{
      const cell = document.querySelector(`.cell[data-id="${chk.dataset.target}"]`);
      if(cell) cell.classList.toggle('hidden-cell', !chk.checked);
    });
  });
}

// init with 3 rows x 3 columns
for(let r=0;r<3;r++){ addRow(); }

document.getElementById('addRowBtn').addEventListener('click', addRow);

document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(!confirm('Clear the whole page and start over?')) return;
  grid.innerHTML = '';
  rowCounter = 0;
  cellCounter = 0;
  for(let r=0;r<3;r++){ addRow(); }
  document.getElementById('dayTitle').textContent = 'DAY 01';
});

document.getElementById('savePdfBtn').addEventListener('click', async ()=>{
  const pageEl = document.getElementById('page');
  pageEl.classList.add('capturing');

  // Auto-hide any box that has no photo AND no caption text —
  // these count as "unused" and are left out of the PDF automatically.
  const autoHidden = [];
  document.querySelectorAll('.cell').forEach(cell=>{
    if(cell.classList.contains('hidden-cell')) return; // already hidden by the user's own checkbox
    const hasImg = !!cell.querySelector('.photo-frame img');
    const captionEl = cell.querySelector('.caption');
    const captionText = captionEl.textContent.replace(/\u200B/g, '').trim();
    captionEl.classList.toggle('empty-caption', !captionText);

    const shouldHide = !hasImg && !captionText;
    if(shouldHide){
      cell.classList.add('auto-hidden-cell');
      autoHidden.push(cell);
    }
  });

 const canvas = await html2canvas(pageEl,{
    scale:window.devicePixelRatio,
    useCORS:true,
    backgroundColor:"#fff",

    width:pageEl.offsetWidth,
    height:pageEl.offsetHeight,

    scrollX:0,
    scrollY:0,

    removeContainer:false
});
  pageEl.classList.remove('capturing');
  document.querySelectorAll('.caption').forEach(caption => caption.classList.remove('empty-caption'));
  autoHidden.forEach(cell => cell.classList.remove('auto-hidden-cell'));

  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

  const titleText = document.getElementById('dayTitle').textContent.trim().replace(/\s+/g,'_') || 'field_journal';
  pdf.save(titleText + '.pdf');
});

rebuildVisList();
