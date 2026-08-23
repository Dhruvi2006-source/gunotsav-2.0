// Dashboard / Checklist Editor Page Logic
let drafts = {};
let tablesData = {};
let mediaData = {};
let isDirty = false;
let autoSaveTimer = null;

// Initialize Dashboard Data
async function initializePage() {
  if (!SCHOOL || !SCHOOL._id) {
    console.warn("No school loaded. Cannot initialize dashboard.");
    return;
  }

  updateAutoSaveStatusText('⚡ લોડ થઈ રહ્યું છે...', '#ea580c');

  try {
    // 1. Fetch item drafts and tables
    const itemsRes = await API.getItemData(SCHOOL._id);
    if (itemsRes.success) {
      itemsRes.items.forEach(item => {
        drafts[item.itemKey] = item.draftText;
        const idx = ITEMS.findIndex(x => keyFor(x.part, x.no) === item.itemKey);
        if (idx !== -1 && item.tableData) {
          tablesData[idx] = item.tableData;
        }
      });
    }

    // 2. Fetch media files
    const mediaRes = await API.getMedia(SCHOOL._id);
    if (mediaRes.success && mediaRes.media) {
      mediaRes.media.forEach(m => {
        const parts = m.itemKey.split('-');
        const partNum = parseInt(parts[0]);
        const checkNum = parseInt(parts[1]);
        const itemIdx = ITEMS.findIndex(x => x.part === partNum && x.no === checkNum);
        if (itemIdx !== -1) {
          if (!mediaData[itemIdx]) mediaData[itemIdx] = [];
          mediaData[itemIdx].push(m);
        }
      });
    }

    // Initialize default tables/drafts for items that don't have records yet
    ITEMS.forEach((x, i) => {
      if (x.table) {
        if (!tablesData[i]) {
          tablesData[i] = JSON.parse(JSON.stringify(x.table));
        }
      }
      let k = keyFor(x.part, x.no);
      if (drafts[k] === undefined) {
        drafts[k] = x.suggested;
      }
    });

    buildNav();
    render(0);
    updateAutoSaveStatusText('⚡ ઓટો સેવ સક્રિય', '#10b981');
  } catch (error) {
    console.error('Failed to load dashboard dataset:', error);
    updateAutoSaveStatusText('❌ લોડ કરવામાં ક્ષતિ!', '#dc2626');
  }
}

function keyFor(part, no) {
  return part + '-' + no;
}

function currentKey() {
  return keyFor(ITEMS[currentIndex].part, ITEMS[currentIndex].no);
}

// -------------------------------------------------------------
// Auto-Save Management
// -------------------------------------------------------------
async function saveCurrentItemToServer() {
  if (!SCHOOL || !SCHOOL._id) return;

  isDirty = false;
  updateAutoSaveStatusText('⚡ સેવ થઈ રહ્યું છે...', '#ea580c');

  try {
    const key = currentKey();
    const text = drafts[key] || '';
    const table = tablesData[currentIndex] || null;

    const result = await API.saveItemData(SCHOOL._id, key, text, table);

    if (result.success) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updateAutoSaveStatusText('⚡ ઓટો સેવ: ' + timeStr, '#10b981');
    } else {
      updateAutoSaveStatusText('❌ સેવ અસફળ!', '#dc2626');
    }
  } catch (error) {
    console.error('AutoSave Sync Error:', error);
    updateAutoSaveStatusText('❌ સર્વર ત્રુટિ (સાચવી શકાયું નથી)', '#dc2626');
  }
}

function triggerAutoSave() {
  isDirty = true;
  updateAutoSaveStatusText('⚡ ફેરફારો સાચવી રહ્યા છે...', '#ea580c');
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveCurrentItemToServer, 1500);
}

function updateAutoSaveStatusText(text, bgColor) {
  const pill = $('autoSaveStatus');
  if (pill) {
    pill.textContent = text;
    pill.style.backgroundColor = bgColor;
  }
}

// -------------------------------------------------------------
// Navigation & Checklist Rendering
// -------------------------------------------------------------
function buildNav() {
  const nav = $('nav');
  if (!nav) return;
  nav.innerHTML = '';
  [1, 2].forEach(p => {
    const title = document.createElement('div');
    title.className = 'part';
    title.textContent = p === 1 ? 'ભાગ ૧ — શાળા વ્યવસ્થાપન અને ભૌતિક સુવિધા (૩૯ મુદ્દા)' : 'ભાગ ૨ — શૈક્ષણિક પ્રક્રિયા અને પ્રવૃત્તિઓ (૩૫ મુદ્દા)';
    nav.appendChild(title);

    ITEMS.forEach((x, i) => {
      if (x.part !== p) return;
      const d = document.createElement('div');
      d.className = 'item';
      d.id = 'nav-' + i;
      d.innerHTML = '<span class="num">' + x.no + '</span><span>' + escapeHtml(x.title) + '</span>';
      d.onclick = () => render(i);
      nav.appendChild(d);
    });
  });
}

function render(i) {
  if (isDirty) {
    clearTimeout(autoSaveTimer);
    saveCurrentItemToServer();
  }

  currentIndex = i;
  const x = ITEMS[i];

  document.querySelectorAll('.item').forEach(e => e.classList.remove('active'));
  const n = $('nav-' + i);
  if (n) n.classList.add('active');

  $('partTag').textContent = 'ભાગ ' + x.part + ' • મુદ્દો ' + x.no;
  $('issueTitle').textContent = x.title;
  $('evidence').textContent = x.evidence;

  renderTable(i);
  renderMediaPreviews();

  if (drafts[currentKey()] === undefined) {
    drafts[currentKey()] = x.suggested;
  }

  $('myText').value = drafts[currentKey()];
  $('files').value = '';
  $('status').textContent = '';
  $('bar').style.width = '0%';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------------------------------------------------------------
// Dynamic Table Managers
// -------------------------------------------------------------
function renderTable(i) {
  const container = $('tableContainer');
  if (!container) return;
  container.innerHTML = '';
  const tData = tablesData[i];

  if (!tData) {
    container.innerHTML = '<div class="small" style="color:#dc2626;font-weight:bold;margin-bottom:10px;">આ કોઠો દૂર કરેલ છે. પાછો લાવવા ઉપરના બટન પર ક્લિક કરો (મૂળ કોઠો આવી જશે).</div>';
    return;
  }

  let html = '<table class="dyn-table"><thead><tr>';
  tData.headers.forEach((h, cIdx) => {
    html += `<th><input type="text" value="${escapeHtml(h)}" onchange="updateTableHeader(${i}, ${cIdx}, this.value)" title="હેડર બદલો"></th>`;
  });
  html += '</tr></thead><tbody>';

  tData.rows.forEach((row, rIdx) => {
    html += '<tr>';
    row.forEach((cell, cIdx) => {
      html += `<td><input type="text" value="${escapeHtml(cell)}" onchange="updateTableCell(${i}, ${rIdx}, ${cIdx}, this.value)"></td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function updateTableHeader(itemIdx, cIdx, val) {
  if (tablesData[itemIdx]) {
    tablesData[itemIdx].headers[cIdx] = val;
    triggerAutoSave();
  }
}

function updateTableCell(itemIdx, rIdx, cIdx, val) {
  if (tablesData[itemIdx] && tablesData[itemIdx].rows[rIdx]) {
    tablesData[itemIdx].rows[rIdx][cIdx] = val;
    triggerAutoSave();
  }
}

function addRow() {
  if (!tablesData[currentIndex]) {
    tablesData[currentIndex] = originalWordTables[currentIndex]
      ? JSON.parse(JSON.stringify(originalWordTables[currentIndex]))
      : { headers: ["ક્રમ", "વિગત", "માહિતી"], rows: [["", "", ""]] };
  }
  const tData = tablesData[currentIndex];
  const newRow = new Array(tData.headers.length).fill('');
  tData.rows.push(newRow);
  renderTable(currentIndex);
  triggerAutoSave();
}

function removeRow() {
  const tData = tablesData[currentIndex];
  if (tData && tData.rows.length > 0) {
    tData.rows.pop();
    renderTable(currentIndex);
    triggerAutoSave();
  }
}

function addCol() {
  if (!tablesData[currentIndex]) {
    tablesData[currentIndex] = originalWordTables[currentIndex]
      ? JSON.parse(JSON.stringify(originalWordTables[currentIndex]))
      : { headers: ["ક્રમ", "વિગત"], rows: [["", ""]] };
  }
  const tData = tablesData[currentIndex];
  tData.headers.push("નવી કોલમ");
  tData.rows.forEach(row => row.push(""));
  renderTable(currentIndex);
  triggerAutoSave();
}

function removeCol() {
  const tData = tablesData[currentIndex];
  if (tData && tData.headers.length > 1) {
    tData.headers.pop();
    tData.rows.forEach(row => row.pop());
    renderTable(currentIndex);
    triggerAutoSave();
  }
}

function toggleTable() {
  if (tablesData[currentIndex]) {
    delete tablesData[currentIndex];
  } else {
    if (originalWordTables[currentIndex]) {
      tablesData[currentIndex] = JSON.parse(JSON.stringify(originalWordTables[currentIndex]));
    } else {
      let x = ITEMS[currentIndex];
      tablesData[currentIndex] = x.table
        ? JSON.parse(JSON.stringify(x.table))
        : { headers: ["ક્રમ", "વિગત / મુદ્દો", "સંખ્યા / સ્થિતિ", "શેરો"], rows: [["", "", "", ""]] };
    }
  }
  renderTable(currentIndex);
  triggerAutoSave();
}

// -------------------------------------------------------------
// Media Upload & Previews
// -------------------------------------------------------------
async function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  if (!SCHOOL || !SCHOOL._id) {
    alert('શાળાની માહિતી લોડ થયેલ નથી. અપલોડ કરી શકાશે નહિ.');
    return;
  }

  const progressBar = $('bar');
  const statusLabel = $('status');

  progressBar.style.width = '10%';
  statusLabel.textContent = '🚀 ફાઇલ અપલોડ થઈ રહી છે...';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert(`ભૂલ: ${file.name} ફાઇલ સ્વીકાર્ય નથી. ફક્ત ઇમેજ અને PDF અપલોડ કરી શકાશે.`);
      continue;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(`ભૂલ: ${file.name} ૧૦ MB થી મોટી છે. નાની ફાઈલ પસંદ કરો.`);
      continue;
    }

    try {
      progressBar.style.width = '40%';
      statusLabel.textContent = `🚀 ${file.name} અપલોડ થઈ રહી છે...`;

      const result = await API.uploadMedia(SCHOOL._id, currentKey(), file);

      if (result.success) {
        if (!mediaData[currentIndex]) mediaData[currentIndex] = [];
        mediaData[currentIndex].push(result.media);
        progressBar.style.width = '80%';
        statusLabel.textContent = '✅ અપલોડ સફળ!';
      } else {
        alert(`અપલોડ નિષ્ફળ: ${result.message}`);
        statusLabel.textContent = '❌ અપલોડ અસફળ';
      }
    } catch (error) {
      console.error('Upload Error:', error);
      alert('સર્વર જોડાણ ક્ષતિ. ફાઇલ અપલોડ કરી શકાઈ નથી.');
      statusLabel.textContent = '❌ અપલોડ ક્ષતિ';
    }
  }

  progressBar.style.width = '100%';
  setTimeout(() => {
    progressBar.style.width = '0%';
    statusLabel.textContent = '';
  }, 2000);

  renderMediaPreviews();
}

function renderMediaPreviews() {
  const container = $('mediaPreviewContainer');
  if (!container) return;
  container.innerHTML = '';
  const printContainer = $('fullPagePrintContainer');
  if (printContainer) printContainer.innerHTML = '';

  const list = mediaData[currentIndex] || [];
  if (list.length === 0) {
    container.innerHTML = '<div class="small">કોઈ ફોટો કે PDF અપલોડ કરેલ નથી.</div>';
    return;
  }

  list.forEach((item, idx) => {
    const div = document.createElement('div');
    const isPdf = item.format === 'pdf' || item.fileName.toLowerCase().endsWith('.pdf');
    const isRaw = item.resourceType === 'raw';

    if (isPdf && isRaw) {
      // Fallback for legacy raw PDF files
      div.className = 'media-thumb pdf-thumb';
      div.title = 'પીડીએફ ખોલવા ક્લિક કરો';
      div.onclick = () => window.open(item.fileUrl, '_blank');
      div.innerHTML = `
        <div class="pdf-icon">📄</div>
        <div class="pdf-name">${escapeHtml(item.fileName)}</div>
        <button class="del-media" onclick="event.stopPropagation(); removeMedia('${item._id}', ${idx})">×</button>
      `;
    } else if (isPdf) {
      // Modern PDF preview using Cloudinary page-to-image conversion
      const previewUrl = item.fileUrl.replace(/\.pdf$/i, '.png');
      div.className = 'media-thumb';
      div.innerHTML = `
        <a href="${item.fileUrl}" target="_blank" title="${escapeHtml(item.fileName)}">
          <img src="${previewUrl}" alt="PDF Preview">
          <span style="position:absolute; bottom:4px; left:4px; background:#dc2626; color:#fff; font-size:9px; font-weight:bold; padding:2px 4px; border-radius:4px; z-index:4;">PDF</span>
        </a>
        <button class="del-media" onclick="removeMedia('${item._id}', ${idx})">×</button>
      `;
    } else {
      // Standard image file preview
      div.className = 'media-thumb';
      div.innerHTML = `
        <a href="${item.fileUrl}" target="_blank">
          <img src="${item.fileUrl}" alt="Media Preview">
        </a>
        <button class="del-media" onclick="removeMedia('${item._id}', ${idx})">×</button>
      `;
    }
    container.appendChild(div);

    if (printContainer) {
      const pDiv = document.createElement('div');
      pDiv.className = 'print-page-break';

      if (isPdf && isRaw) {
        pDiv.innerHTML = `
          <div class="print-page-header">
            <h4>${SCHOOL.name} (ગુણોત્સવ 2.0 - ભાગ ${ITEMS[currentIndex].part}, મુદ્દો ${ITEMS[currentIndex].no})</h4>
            <p>બિડાણ પુરાવો / વિધાન: ${escapeHtml(ITEMS[currentIndex].title)}</p>
          </div>
          <div class="print-pdf-box">
            <div style="font-size: 48px; color: #dc2626;">📄</div>
            <h3 style="margin: 10px 0; color: #1e3a8a;">પીડીએફ દસ્તાવેજ બિડાણ</h3>
            <p><b>ફાઇલનું નામ:</b> ${escapeHtml(item.fileName)}</p>
            <p style="font-size: 12px; color: #64748b; margin-top: 15px;">પીડીએફ દસ્તાવેજ ઓનલાઇન પોર્ટલ પર સુરક્ષિત રીતે સંગ્રહિત છે.</p>
          </div>
          <p style="margin-top:auto; font-size:11px; color:#64748b;">UDISE: ${SCHOOL.udise}</p>
        `;
      } else if (isPdf) {
        const previewUrl = item.fileUrl.replace(/\.pdf$/i, '.png');
        pDiv.innerHTML = `
          <div class="print-page-header">
            <h4>${SCHOOL.name} (ગુણોત્સવ 2.0 - ભાગ ${ITEMS[currentIndex].part}, મુદ્દો ${ITEMS[currentIndex].no})</h4>
            <p>બિડાણ પુરાવો / વિધાન: ${escapeHtml(ITEMS[currentIndex].title)}</p>
          </div>
          <img src="${previewUrl}" class="print-full-img" alt="Print Document">
          <p style="margin-top:6px;font-size:11px;color:#64748b;">UDISE: ${SCHOOL.udise}</p>
        `;
      } else {
        pDiv.innerHTML = `
          <div class="print-page-header">
            <h4>${SCHOOL.name} (ગુણોત્સવ 2.0 - ભાગ ${ITEMS[currentIndex].part}, મુદ્દો ${ITEMS[currentIndex].no})</h4>
            <p>બિડાણ પુરાવો / વિધાન: ${escapeHtml(ITEMS[currentIndex].title)}</p>
          </div>
          <img src="${item.fileUrl}" class="print-full-img" alt="Print Document">
          <p style="margin-top:6px;font-size:11px;color:#64748b;">UDISE: ${SCHOOL.udise}</p>
        `;
      }
      printContainer.appendChild(pDiv);
    }
  });
}

async function removeMedia(mediaId, idx) {
  if (!confirm('શું તમે ખરેખર આ ફાઇલ દૂર કરવા માંગો છો?')) return;

  const progressBar = $('bar');
  const statusLabel = $('status');
  progressBar.style.width = '30%';
  statusLabel.textContent = '🧹 ફાઇલ દૂર થઈ રહી છે...';

  try {
    const result = await API.deleteMedia(mediaId);

    if (result.success) {
      if (mediaData[currentIndex]) {
        mediaData[currentIndex].splice(idx, 1);
      }
      progressBar.style.width = '100%';
      statusLabel.textContent = '✅ ફાઇલ દૂર થઈ ગઈ!';
      renderMediaPreviews();
    } else {
      alert(`ફાઇલ દૂર કરવા અસમર્થ: ${result.message}`);
    }
  } catch (error) {
    console.error('File Delete Error:', error);
    alert('સર્વર કનેક્શન સમસ્યા. ફાઇલ દૂર કરી શકાઈ નથી.');
  }

  setTimeout(() => {
    progressBar.style.width = '0%';
    statusLabel.textContent = '';
  }, 2000);
}

// -------------------------------------------------------------
// Toolbar Actions
// -------------------------------------------------------------
function clearMyText() {
  if (confirm("શું તમે લખાણ સાફ કરવા માંગો છો?")) {
    $('myText').value = '';
    drafts[currentKey()] = '';
    triggerAutoSave();
  }
}

function copySuggested() {
  const textToCopy = $('myText').value;
  navigator.clipboard?.writeText(textToCopy);
  showStatus('📋 લખાણ ક્લિપબોર્ડમાં કૉપી થયું!', true);
}

async function saveCurrent() {
  if (!SCHOOL || !SCHOOL._id) {
    alert('શાળાની માહિતી લોડ થયેલ નથી.');
    return;
  }
  const text = $('myText').value.trim();
  drafts[currentKey()] = text;

  showStatus('💾 ફેરફારો સાચવી રહ્યા છે...', true);

  try {
    await saveCurrentItemToServer();
    showStatus('✅ ફેરફારો સાચવાઈ ગયા!', true);
  } catch (error) {
    showStatus('❌ ફેરફારો સાચવવામાં સમસ્યા આવી.', false);
  }
}

// Bind Text Area Input Changes
document.addEventListener('DOMContentLoaded', () => {
  const myText = $('myText');
  if (myText) {
    myText.addEventListener('input', () => {
      drafts[currentKey()] = myText.value;
      triggerAutoSave();
    });
  }
});
