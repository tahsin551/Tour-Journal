/* cell.js — shared by index.html and layout.html
   Creates one "photo box": image upload + caption + bold/italic/underline + resize + delete
*/

let cellCounter = 0;

function createPhotoCell(isCustom = false){
  cellCounter++;
  const id = 'cell-' + cellCounter;
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.dataset.id = id;

  cell.innerHTML = `
    <div class="cell-actions">
      <button type="button" title="Delete this box" class="del-cell">✕</button>
    </div>
    <div class="photo-frame" style="height: 290px;">
      <label class="photo-frame-label">
        <input type="file" accept="image/*" class="file-input">
        <span class="placeholder">Click to upload photo</span>
      </label>
      <button type="button" class="resize-btn" title="Drag to resize height">↕</button>
      <span class="resize-handle" aria-hidden="true"></span>
    </div>
    <div class="caption" contenteditable="true" data-placeholder="Caption / scientific name"></div>
    <div class="cell-toolbar">
      <button type="button" class="fmt-btn" data-cmd="bold" title="Bold"><b>B</b></button>
      <button type="button" class="fmt-btn" data-cmd="italic" title="Italic (use for scientific names)"><i>I</i></button>
      <button type="button" class="fmt-btn" data-cmd="underline" title="Underline"><u>U</u></button>
    </div>
  `;

  const frame = cell.querySelector('.photo-frame');
  const resizeHandle = cell.querySelector('.resize-handle');
  const resizeButton = cell.querySelector('.resize-btn');

  /* ---------- Resize (height only — width stays locked to the grid column) ---------- */
/* ---------- Resize (Width + Height) ---------- */
function enableResize(){
  let isResizing = false;
  let startX = 0, startY = 0;
  let startWidth = 0, startHeight = 0;

  const getPoint = (e) => {
    if(e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const beginResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    resizeButton.classList.add('is-active');
    const point = getPoint(e);
    startX = point.x;
    startY = point.y;
    startWidth = frame.getBoundingClientRect().width;
    startHeight = frame.getBoundingClientRect().height;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';
  };

  const moveResize = (e) => {
    if(!isResizing) return;
    e.preventDefault();
    const point = getPoint(e);
    
    const newWidth = Math.max(140, startWidth + (point.x - startX));
    const newHeight = Math.max(120, startHeight + (point.y - startY));
    
    frame.style.width = newWidth + 'px';
    frame.style.height = newHeight + 'px';
  };

  const stopResize = () => {
    if(!isResizing) return;
    isResizing = false;
    resizeButton.classList.remove('is-active');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  resizeButton.addEventListener('mousedown', beginResize);
  resizeButton.addEventListener('touchstart', beginResize, {passive:false});
  document.addEventListener('mousemove', moveResize);
  document.addEventListener('touchmove', moveResize, {passive:false});
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('touchend', stopResize);
  document.addEventListener('touchcancel', stopResize);
}
  enableResize();

  /* ---------- Photo upload ---------- */
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
      // Force reflow for better rendering
      img.style.opacity = '0.99';
      setTimeout(() => img.style.opacity = '1', 10);
    };
    reader.readAsDataURL(file);
  }
  cell.querySelector('.file-input').addEventListener('change', (e)=>{
    handleFile(e.target.files[0]);
  });

  /* ---------- Caption formatting ---------- */
  const caption = cell.querySelector('.caption');
  const formatButtons = cell.querySelectorAll('.fmt-btn');

  function refreshActiveStates(){
    formatButtons.forEach(btn=>{
      let active = false;
      try { active = document.queryCommandState(btn.dataset.cmd); } catch(err){ active = false; }
      btn.classList.toggle('active', active);
    });
  }

  formatButtons.forEach(btn=>{
    btn.addEventListener('mousedown', (e)=> e.preventDefault()); // keep caption focus/selection
    btn.addEventListener('click', ()=>{
      caption.focus();
      document.execCommand(btn.dataset.cmd, false, null);
      refreshActiveStates();
    });
  });

  caption.addEventListener('keyup', refreshActiveStates);
  caption.addEventListener('mouseup', refreshActiveStates);
  caption.addEventListener('focus', refreshActiveStates);

  // Captions are one line — Enter shouldn't create a new paragraph inside the box
  caption.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') e.preventDefault();
  });

  /* ---------- Delete box ---------- */
  cell.querySelector('.del-cell').addEventListener('click', ()=>{
    cell.remove();
    if(typeof window.onCellsChanged === 'function') window.onCellsChanged();
  });

  return cell;
}

/* ---------- Shared "hide/show boxes" checklist ---------- */
function rebuildVisList(visListEl){
  visListEl.innerHTML = '';
  document.querySelectorAll('.cell').forEach((cell, idx)=>{
    const id = cell.dataset.id;
    const isHidden = cell.classList.contains('hidden-cell');
    const wrap = document.createElement('label');
    wrap.innerHTML = `<input type="checkbox" data-target="${id}" ${isHidden ? '' : 'checked'}> Box ${idx+1}`;
    visListEl.appendChild(wrap);
  });
  visListEl.querySelectorAll('input[type=checkbox]').forEach(chk=>{
    chk.addEventListener('change', ()=>{
      const cell = document.querySelector(`.cell[data-id="${chk.dataset.target}"]`);
      if(cell) cell.classList.toggle('hidden-cell', !chk.checked);
    });
  });
}

/* ---------- Shared "Save as PDF" ---------- */
function bindPdfExport(buttonEl, pageEl, titleEl, defaultName){
  buttonEl.addEventListener('click', async ()=>{
    pageEl.classList.add('capturing');

    const autoHidden = [];
    document.querySelectorAll('.cell').forEach(cell=>{
      if(cell.classList.contains('hidden-cell')) return;
      const hasImg = !!cell.querySelector('.photo-frame img');
      const captionEl = cell.querySelector('.caption');
      const captionText = captionEl.textContent.replace(/\u200B/g, '').trim();
      captionEl.classList.toggle('empty-caption', !captionText);
      if(!hasImg && !captionText){
        cell.classList.add('auto-hidden-cell');
        autoHidden.push(cell);
      }
    });

    await new Promise(r => setTimeout(r, 50));

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#fff',
      width: pageEl.offsetWidth,
      height: pageEl.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      removeContainer: false,
      logging: false,
      allowTaint: true,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('img').forEach(img => {
          img.style.imageRendering = 'crisp-edges';
        });
      }
    });

    pageEl.classList.remove('capturing');
    document.querySelectorAll('.caption').forEach(c => c.classList.remove('empty-caption'));
    autoHidden.forEach(cell => cell.classList.remove('auto-hidden-cell'));

    const imgData = canvas.toDataURL('image/png', 1.0);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'pt', 
      format: 'a4',
      compress: true
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

    const titleText = (titleEl.textContent.trim().replace(/\s+/g, '_')) || defaultName;
    pdf.save(titleText + '.pdf');
  });
}