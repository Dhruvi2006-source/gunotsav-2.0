// Reports Summary Page Logic
async function initializePage() {
  if (!SCHOOL || !SCHOOL._id) {
    console.warn("No school loaded. Cannot load reports.");
    return;
  }

  const container = $('reportsContainer');
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">અહેવાલો લોડ થઈ રહ્યા છે...</div>';

  try {
    // 1. Fetch drafts and tables
    const itemsRes = await API.getItemData(SCHOOL._id);
    const draftsMap = {};
    const tablesMap = {};
    
    if (itemsRes.success) {
      itemsRes.items.forEach(item => {
        draftsMap[item.itemKey] = item.draftText;
        tablesMap[item.itemKey] = item.tableData;
      });
    }

    // 2. Fetch media files
    const mediaRes = await API.getMedia(SCHOOL._id);
    const mediaMap = {};
    if (mediaRes.success && mediaRes.media) {
      mediaRes.media.forEach(m => {
        if (!mediaMap[m.itemKey]) mediaMap[m.itemKey] = [];
        mediaMap[m.itemKey].push(m);
      });
    }

    // 3. Compile and render all 74 items
    let html = '';

    ITEMS.forEach((item, idx) => {
      const key = item.part + '-' + item.no;
      const text = draftsMap[key] !== undefined ? draftsMap[key] : item.suggested;
      const table = tablesMap[key] !== undefined ? tablesMap[key] : item.table;
      const filesList = mediaMap[key] || [];

      html += `
        <div class="report-item-card">
          <div class="report-item-header">
            <h4 class="report-item-title">મુદ્દો ${item.no}: ${escapeHtml(item.title)}</h4>
            <span class="tag">ભાગ ${item.part}</span>
          </div>
          
          <div class="report-item-draft">${escapeHtml(text) || '<span class="report-item-empty">કોઈ અહેવાલ લખેલ નથી.</span>'}</div>
          
          ${table ? renderStaticTable(table) : ''}
          
          ${filesList.length > 0 ? renderAttachedMedia(filesList) : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('Failed to render reports summary:', error);
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc2626; font-weight: bold;">❌ અહેવાલો લોડ કરવામાં ક્ષતિ આવી છે. કૃપા કરીને રીફ્રેશ કરો.</div>';
  }
}

function renderStaticTable(tData) {
  if (!tData || !tData.headers || tData.headers.length === 0) return '';
  
  let html = '<div class="table-container"><table class="dyn-table"><thead><tr>';
  tData.headers.forEach(h => {
    html += `<th>${escapeHtml(h)}</th>`;
  });
  html += '</tr></thead><tbody>';

  tData.rows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => {
      html += `<td>${escapeHtml(cell)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

function renderAttachedMedia(files) {
  let html = '<div class="media-preview-container noPrint" style="margin-top: 10px; font-size: 12px; display: flex; gap: 8px; flex-wrap: wrap;">';
  
  files.forEach(file => {
    const isPdf = file.format === 'pdf' || file.resourceType === 'raw' || file.fileName.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      html += `
        <div class="media-thumb pdf-thumb" style="width: 100px; height: 100px;" onclick="window.open('${file.fileUrl}', '_blank')">
          <div class="pdf-icon" style="font-size: 28px;">📄</div>
          <div class="pdf-name" style="font-size: 9px; max-height: 24px;">${escapeHtml(file.fileName)}</div>
        </div>
      `;
    } else {
      html += `
        <div class="media-thumb" style="width: 100px; height: 100px;">
          <a href="${file.fileUrl}" target="_blank">
            <img src="${file.fileUrl}" alt="Attachment" style="width: 100%; height: 100%; object-fit: cover;">
          </a>
        </div>
      `;
    }
  });

  html += '</div>';
  return html;
}
