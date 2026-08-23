// Documents Library Page Logic
let allDocuments = [];

async function initializePage() {
  if (!SCHOOL || !SCHOOL._id) {
    console.warn("No school loaded. Cannot load documents.");
    return;
  }

  const grid = $('docsGrid');
  if (!grid) return;
  grid.innerHTML = '<div style="text-align: center; grid-column: 1 / -1; padding: 40px; color: var(--muted);">દસ્તાવેજો લોડ થઈ રહ્યા છે...</div>';

  try {
    const res = await API.getMedia(SCHOOL._id);
    if (res.success && res.media) {
      allDocuments = res.media;
      filterDocuments();
    } else {
      grid.innerHTML = '<div style="text-align: center; grid-column: 1 / -1; padding: 40px; color: var(--muted);">કોઈ દસ્તાવેજો મળ્યા નથી.</div>';
    }
  } catch (error) {
    console.error('Failed to load documents:', error);
    grid.innerHTML = '<div style="text-align: center; grid-column: 1 / -1; padding: 40px; color: #dc2626; font-weight: bold;">❌ દસ્તાવેજો લોડ કરવામાં ક્ષતિ આવી છે.</div>';
  }
}

function renderDocuments(documents) {
  const grid = $('docsGrid');
  const countLabel = $('docCount');
  if (!grid) return;
  
  if (countLabel) {
    countLabel.textContent = `કુલ: ${documents.length} ફાઇલો`;
  }

  if (documents.length === 0) {
    grid.innerHTML = '<div style="text-align: center; grid-column: 1 / -1; padding: 40px; color: var(--muted);">ફિલ્ટર મુજબ કોઈ દસ્તાવેજો મળ્યા નથી.</div>';
    return;
  }

  grid.innerHTML = documents.map((item, idx) => {
    const isPdf = item.format === 'pdf' || item.fileName.toLowerCase().endsWith('.pdf');
    const isRaw = item.resourceType === 'raw';
    
    // Find checklist item details
    const parts = item.itemKey.split('-');
    const partNum = parseInt(parts[0]);
    const checkNum = parseInt(parts[1]);
    const checklistItem = ITEMS.find(x => x.part === partNum && x.no === checkNum);
    const itemTitleText = checklistItem ? `મુદ્દો ${checkNum}: ${checklistItem.title}` : `કી: ${item.itemKey}`;

    let previewHtml = '';
    if (isPdf && isRaw) {
      previewHtml = `
        <div class="doc-icon">📄</div>
      `;
    } else if (isPdf) {
      const previewUrl = item.fileUrl.replace(/\.pdf$/i, '.png');
      previewHtml = `
        <div style="position:relative; width:100%; height:90px; margin-bottom:10px;">
          <img class="doc-image-preview" style="margin-bottom:0;" src="${previewUrl}" alt="Preview">
          <span style="position:absolute; bottom:4px; left:4px; background:#dc2626; color:#fff; font-size:9px; font-weight:bold; padding:2px 4px; border-radius:4px; z-index:4;">PDF</span>
        </div>
      `;
    } else {
      previewHtml = `
        <img class="doc-image-preview" src="${item.fileUrl}" alt="Preview">
      `;
    }

    const dateStr = new Date(item.uploadedAt).toLocaleDateString('gu-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    return `
      <div class="doc-card" id="doc-card-${item._id}">
        ${previewHtml}
        <div class="doc-title" title="${escapeHtml(item.fileName)}">${escapeHtml(item.fileName)}</div>
        <div class="doc-meta">
          <div style="font-weight: bold; color: var(--primary); margin-bottom: 2px;">${escapeHtml(itemTitleText)}</div>
          <div>ભાગ ${partNum} | અપલોડ: ${dateStr}</div>
        </div>
        <div class="doc-actions noPrint">
          <a href="${item.fileUrl}" target="_blank" class="doc-btn-view">જુઓ ↗</a>
          <button class="doc-btn-del" onclick="deleteDoc('${item._id}')">ડીલીટ ❌</button>
        </div>
      </div>
    `;
  }).join('');
}

function filterDocuments() {
  const query = $('searchBox').value.trim().toLowerCase();
  const partFilter = $('partFilter').value;
  const typeFilter = $('typeFilter').value;

  const filtered = allDocuments.filter(doc => {
    // 1. Search Query
    const nameMatch = doc.fileName.toLowerCase().includes(query);

    // 2. Part Filter
    const parts = doc.itemKey.split('-');
    const docPart = parts[0];
    const partMatch = partFilter === 'all' || docPart === partFilter;

    // 3. Type Filter
    const isPdf = doc.format === 'pdf' || doc.resourceType === 'raw' || doc.fileName.toLowerCase().endsWith('.pdf');
    const typeMatch = typeFilter === 'all' || 
      (typeFilter === 'pdf' && isPdf) || 
      (typeFilter === 'image' && !isPdf);

    return nameMatch && partMatch && typeMatch;
  });

  renderDocuments(filtered);
}

async function deleteDoc(mediaId) {
  if (!confirm('શું તમે ખરેખર આ દસ્તાવેજ કાયમ માટે દૂર કરવા માંગો છો?')) return;

  showStatus('🧹 ફાઇલ દૂર થઈ રહી છે...', false, 0);

  try {
    const result = await API.deleteMedia(mediaId);
    if (result.success) {
      showStatus('✅ ફાઇલ સફળતાપૂર્વક દૂર કરવામાં આવી છે!', true);
      // Remove from memory list and re-render
      allDocuments = allDocuments.filter(doc => doc._id !== mediaId);
      filterDocuments();
    } else {
      alert(`ભૂલ: ${result.message}`);
      showStatus('❌ ફાઇલ દૂર કરી શકાઈ નથી.', false);
    }
  } catch (error) {
    console.error('File deletion error:', error);
    alert('સર્વર કનેક્શન સમસ્યા. ફાઇલ દૂર કરી શકાઈ નથી.');
    showStatus('❌ સર્વર કનેક્શન ભૂલ.', false);
  }
}
