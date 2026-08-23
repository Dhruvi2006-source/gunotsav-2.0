// Shared navigation and header management for all Gunotsav 2.0 pages
async function loadSchoolHeaderDetails() {
  let udise = localStorage.getItem('gunotsav_selected_udise') || '24261610701';

  try {
    const res = await API.getSchool(udise);
    if (res.success) {
      SCHOOL = res.school;
    } else if (res.status === 404) {
      console.log('School not found. Registering default school details on backend...');
      const initRes = await API.saveSchool(DEFAULT_SCHOOL);
      if (initRes.success) {
        SCHOOL = initRes.school;
      }
    }
    localStorage.setItem('gunotsav_selected_udise', SCHOOL.udise);
    updateHeaderUI();
  } catch (error) {
    console.error('Failed to load school details in header:', error);
    const statusPill = $('autoSaveStatus');
    if (statusPill) {
      statusPill.textContent = '❌ કનેક્શન ત્રુટિ (ડેટાબેઝ)';
      statusPill.style.backgroundColor = '#dc2626';
    }
  }
}

function updateHeaderUI() {
  const elements = {
    schoolName: SCHOOL.name,
    udise: 'UDISE: ' + SCHOOL.udise,
    year: 'વર્ષ: ' + SCHOOL.year,
    location: SCHOOL.village + ' • ' + SCHOOL.taluka + ' • ' + SCHOOL.district,
    principal: 'આચાર્ય: ' + SCHOOL.principal,
    footerText: SCHOOL.name + ' • ગુણોત્સવ 2.0 • ' + SCHOOL.year
  };

  for (const [id, value] of Object.entries(elements)) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  const printHeader = $('printHeader');
  if (printHeader) {
    printHeader.innerHTML = `
      <h2>${SCHOOL.name}</h2>
      <p><b>UDISE:</b> ${SCHOOL.udise} | <b>વર્ષ:</b> ${SCHOOL.year}</p>
      <p><b>સ્થળ:</b> ${SCHOOL.village}, તા. ${SCHOOL.taluka}, જિ. ${SCHOOL.district}</p>
      <p><b>આચાર્યશ્રી:</b> ${SCHOOL.principal} (મો. ${SCHOOL.mobile})</p>
    `;
  }
}

function renderNavigationTabs(activeTab) {
  // Find where to append the tabs (e.g. inside header-top or below it)
  const header = document.querySelector('header');
  if (!header) return;

  // Check if tabs already exist
  let tabsContainer = $('navTabsContainer');
  if (!tabsContainer) {
    tabsContainer = document.createElement('div');
    tabsContainer.id = 'navTabsContainer';
    tabsContainer.className = 'nav-tabs noPrint';
    tabsContainer.style.display = 'flex';
    tabsContainer.style.gap = '10px';
    tabsContainer.style.marginTop = '12px';
    tabsContainer.style.flexWrap = 'wrap';

    // Insert before schoolbar
    const schoolbar = document.querySelector('.schoolbar');
    if (schoolbar) {
      header.insertBefore(tabsContainer, schoolbar);
    } else {
      header.appendChild(tabsContainer);
    }
  }

  const tabs = [
    { id: 'dashboard', label: '📊 ડેશબોર્ડ (મુદ્દાઓ)', url: '/index.html' },
    { id: 'school', label: '🏫 શાળાની માહિતી', url: '/pages/school.html' },
    { id: 'reports', label: '📝 અહેવાલોનો સારાંશ', url: '/pages/reports.html' },
    { id: 'documents', label: '📁 અપલોડ કરેલ દસ્તાવેજો', url: '/pages/documents.html' }
  ];

  tabsContainer.innerHTML = tabs.map(tab => `
    <a href="${tab.url}" class="nav-tab ${tab.id === activeTab ? 'active' : ''}">${tab.label}</a>
  `).join('');
}

// Bind to DOM Content Loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Determine active tab based on window location
  const path = window.location.pathname;
  let activeTab = 'dashboard';
  if (path.includes('/school.html')) {
    activeTab = 'school';
  } else if (path.includes('/reports.html')) {
    activeTab = 'reports';
  } else if (path.includes('/documents.html')) {
    activeTab = 'documents';
  }

  renderNavigationTabs(activeTab);
  
  // Update header buttons to navigate instead of showing modal (since school.html is now a separate page)
  const configBtn = document.querySelector('.config-btn');
  if (configBtn) {
    configBtn.onclick = (e) => {
      e.preventDefault();
      window.location.href = '/pages/school.html';
    };
  }

  // Load school info details into header
  await loadSchoolHeaderDetails();

  // If the page has defined its own custom page initializer, run it now
  if (typeof initializePage === 'function') {
    await initializePage();
  }
});
