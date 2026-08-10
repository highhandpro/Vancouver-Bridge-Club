// State Management & Database Init
let db = {
  members: [],
  events: [],
  reservations: {}
};

// Player Session & Role Settings
let currentPlayer = null; // Holds the logged-in player object, or null for director
let userRole = 'player';   // 'player' or 'director'

// Application State Settings
let currentYear = 2026;
let currentMonth = 7; // August (0-indexed: January is 0, August is 7)
let currentEventId = null;
let activeTab = 'tab-calendar';

// Pagination for Member Directory
let rosterCurrentPage = 1;
const rosterItemsPerPage = 10;
let rosterFilteredMembers = [];

// Seat Assignment Popover State
let activeSeatTableIndex = null;
let activeSeatDirection = null; // 'north', 'south', 'east', 'west'

// Waitlist selection state
let selectedWaitlistPlayerIds = [];
let selectedPartnershipPlayerIds = [];

// PDFJS configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Init Application
window.addEventListener('DOMContentLoaded', () => {
  initDatabase();
  setupUserSession();
  setupTabNavigation();
  setupEventBindings();
  renderCalendar(currentYear, currentMonth);
  renderRoster();
  updateGlobalStats();
});

// Load Database from localStorage or defaults
function initDatabase() {
  const cachedDb = localStorage.getItem('bridge_host_db');
  if (cachedDb) {
    try {
      db = JSON.parse(cachedDb);
      if (!db.members) db.members = [];
      if (!db.events) db.events = [];
      if (!db.reservations) db.reservations = {};
    } catch (e) {
      console.error("Failed to parse cached database. Loading defaults.", e);
      loadDefaultDatabase();
    }
  } else {
    loadDefaultDatabase();
  }
}

function loadDefaultDatabase() {
  db.members = typeof PRELOADED_MEMBERS !== 'undefined' ? [...PRELOADED_MEMBERS] : [];
  db.events = typeof PRELOADED_EVENTS !== 'undefined' ? [...PRELOADED_EVENTS] : [];
  db.reservations = {};
  saveDatabase();
}

function saveDatabase() {
  localStorage.setItem('bridge_host_db', JSON.stringify(db));
  updateGlobalStats();
}

// User Login Session Coordination
function setupUserSession() {
  const cachedPlayerId = localStorage.getItem('bridge_player_id');
  const cachedRole = localStorage.getItem('bridge_role') || 'player';
  
  userRole = cachedRole;
  
  if (cachedPlayerId) {
    const player = db.members.find(m => m.id === parseInt(cachedPlayerId));
    if (player) {
      loginAsPlayer(player, false);
      return;
    }
  }
  
  if (userRole === 'director' && !cachedPlayerId) {
    loginAsDirector(false);
    return;
  }
  
  // If no cache, force login overlay
  showLoginOverlay(true);
}

function showLoginOverlay(show) {
  const overlay = document.getElementById('login-overlay');
  if (show) {
    overlay.style.display = 'flex';
    document.getElementById('login-name-search').value = '';
    document.getElementById('login-search-results').innerHTML = '';
  } else {
    overlay.style.display = 'none';
  }
}

function loginAsPlayer(player, saveToCache = true) {
  currentPlayer = player;
  userRole = 'player';
  
  if (saveToCache) {
    localStorage.setItem('bridge_player_id', player.id);
    localStorage.setItem('bridge_role', 'player');
  }
  
  // Set role attributes on HTML body
  document.body.setAttribute('data-role', 'player');
  document.getElementById('role-toggle-checkbox').checked = false;
  
  // Populate Sidebar Profile UI
  document.getElementById('user-display-name').innerText = player.name;
  document.getElementById('user-role-label').innerText = player.position || 'Club Player';
  document.getElementById('user-avatar-initials').innerText = getInitials(player.name);
  
  // Hide Director navigation panels
  document.querySelectorAll('.director-only').forEach(el => el.style.display = 'none');
  
  showLoginOverlay(false);
  
  // Force tab switches if current active tab is director-locked
  if (activeTab === 'tab-importer') {
    document.getElementById('btn-tab-calendar').click();
  }
  
  renderCalendar(currentYear, currentMonth);
  renderRoster();
  updateGlobalStats();
}

function loginAsDirector(saveToCache = true) {
  currentPlayer = null;
  userRole = 'director';
  
  if (saveToCache) {
    localStorage.removeItem('bridge_player_id');
    localStorage.setItem('bridge_role', 'director');
  }
  
  // Set role attribute on body
  document.body.setAttribute('data-role', 'director');
  document.getElementById('role-toggle-checkbox').checked = true;
  
  // Populate Director Sidebar Profile UI
  document.getElementById('user-display-name').innerText = 'Director Mode';
  document.getElementById('user-role-label').innerText = 'Game Director';
  document.getElementById('user-avatar-initials').innerText = 'DM';
  
  // Show Director panels
  document.querySelectorAll('.director-only').forEach(el => {
    // Check if it's table action headers or elements
    if (el.tagName === 'TR' || el.tagName === 'TH') {
      el.style.display = 'table-cell';
    } else {
      el.style.display = 'flex';
    }
  });
  
  showLoginOverlay(false);
  renderCalendar(currentYear, currentMonth);
  renderRoster();
  updateGlobalStats();
}

function logout() {
  localStorage.removeItem('bridge_player_id');
  localStorage.removeItem('bridge_role');
  currentPlayer = null;
  userRole = 'player';
  
  document.body.setAttribute('data-role', 'player');
  showLoginOverlay(true);
}

function updateGlobalStats() {
  document.getElementById('stat-total-members').innerText = db.members.length;
  
  let bookingCount = 0;
  Object.keys(db.reservations).forEach(eventId => {
    const res = db.reservations[eventId];
    if (res && res.tables) {
      res.tables.forEach(table => {
        if (table.north) bookingCount++;
        if (table.south) bookingCount++;
        if (table.east) bookingCount++;
        if (table.west) bookingCount++;
      });
    }
  });
  document.getElementById('stat-total-bookings').innerText = bookingCount;
}

// Tab Panels Coordination
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.nav-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Ensure player cannot access importer
      if (userRole === 'player' && targetTab === 'tab-importer') {
        return;
      }
      
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });
      document.getElementById(targetTab).classList.add('active');
      
      activeTab = targetTab;
      
      if (targetTab === 'tab-calendar') {
        renderCalendar(currentYear, currentMonth);
      } else if (targetTab === 'tab-roster') {
        renderRoster();
      }
    });
  });
}

// Global Event bindings
function setupEventBindings() {
  // Calendar Navigation
  document.getElementById('btn-prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
  });
  
  document.getElementById('btn-next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
  });
  
  // Global Search bar
  document.getElementById('global-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length > 0) {
      document.getElementById('btn-tab-roster').click();
      document.getElementById('roster-search').value = query;
      filterRoster();
    }
  });

  // Login Search
  document.getElementById('login-name-search').addEventListener('input', handleLoginSearch);
  
  // New Registration form inside Login Portal
  document.getElementById('form-login-register').addEventListener('submit', handleNewPlayerRegistration);
  
  // Switch tab in Login Portal
  document.getElementById('login-tab-btn-signin').addEventListener('click', () => {
    document.getElementById('login-tab-btn-signin').classList.add('active');
    document.getElementById('login-tab-btn-register').classList.remove('active');
    document.getElementById('login-pane-signin').classList.add('active');
    document.getElementById('login-pane-register').classList.remove('active');
  });
  document.getElementById('login-tab-btn-register').addEventListener('click', () => {
    document.getElementById('login-tab-btn-register').classList.add('active');
    document.getElementById('login-tab-btn-signin').classList.remove('active');
    document.getElementById('login-pane-register').classList.add('active');
    document.getElementById('login-pane-signin').classList.remove('active');
  });
  
  // Director bypass link
  document.getElementById('btn-login-director').addEventListener('click', () => {
    loginAsDirector(true);
  });
  
  // Sidebar user logout
  document.getElementById('btn-logout').addEventListener('click', logout);
  
  // Director controls slider checkbox switch
  document.getElementById('role-toggle-checkbox').addEventListener('change', (e) => {
    if (e.target.checked) {
      loginAsDirector(true);
    } else {
      // Re-login to cached player if exists, or show portal
      const cachedPlayerId = localStorage.getItem('bridge_player_id');
      if (cachedPlayerId) {
        const player = db.members.find(m => m.id === parseInt(cachedPlayerId));
        if (player) {
          loginAsPlayer(player, true);
          return;
        }
      }
      logout();
    }
  });

  // Roster filters
  document.getElementById('roster-search').addEventListener('input', filterRoster);
  document.getElementById('roster-filter-status').addEventListener('change', filterRoster);
  document.getElementById('roster-filter-position').addEventListener('change', filterRoster);
  
  // Pagination
  document.getElementById('btn-prev-page').addEventListener('click', () => {
    if (rosterCurrentPage > 1) {
      rosterCurrentPage--;
      renderRosterTable();
    }
  });
  document.getElementById('btn-next-page').addEventListener('click', () => {
    const maxPage = Math.ceil(rosterFilteredMembers.length / rosterItemsPerPage);
    if (rosterCurrentPage < maxPage) {
      rosterCurrentPage++;
      renderRosterTable();
    }
  });
  
  // Modal close buttons
  document.getElementById('btn-close-res-modal').addEventListener('click', () => toggleModal('modal-reservation', false));
  document.getElementById('btn-close-member-modal').addEventListener('click', () => toggleModal('modal-member-edit', false));
  document.getElementById('btn-cancel-member-modal').addEventListener('click', () => toggleModal('modal-member-edit', false));
  
  // Save Member profile (Director controls)
  document.getElementById('form-member-edit').addEventListener('submit', handleSaveMember);
  
  // New Member (Director controls)
  document.getElementById('btn-add-member').addEventListener('click', () => {
    document.getElementById('form-member-edit').reset();
    document.getElementById('edit-member-id').value = '';
    document.getElementById('member-modal-title').innerText = 'Add New Member';
    toggleModal('modal-member-edit', true);
  });
  
  setupModalTabs();
  
  // Seating
  document.getElementById('btn-add-seating-table').addEventListener('click', addSeatingTable);
  
  // Popover close
  document.getElementById('btn-close-popover').addEventListener('click', () => {
    document.getElementById('popover-seat-assign').style.display = 'none';
  });
  document.getElementById('popover-player-search').addEventListener('input', searchPopoverPlayers);
  
  // Popover quick player seating actions
  document.getElementById('btn-popover-book-self').addEventListener('click', bookSelfAtSeat);
  document.getElementById('btn-popover-book-partner').addEventListener('click', showPartnerSearchFlow);
  
  // Player Quick Actions in Booking Modal Banner
  document.getElementById('btn-player-quick-book').addEventListener('click', autoBookPlayer);
  document.getElementById('btn-player-partnership-desk').addEventListener('click', joinPartnershipDeskFlow);
  document.getElementById('btn-player-quick-cancel').addEventListener('click', cancelPlayerRegistration);
  
  // Waitlist
  document.getElementById('btn-add-to-waitlist').addEventListener('click', triggerAddToWaitlist);
  document.getElementById('btn-pair-players').addEventListener('click', pairSelectedPartnershipPlayers);
  
  // Director print/export
  document.getElementById('btn-print-seating-chart').addEventListener('click', () => {
    window.print();
  });
  document.getElementById('btn-export-seating-csv').addEventListener('click', exportSeatingToCSV);
  
  // System maintenance
  document.getElementById('btn-export-db').addEventListener('click', exportSystemDatabase);
  document.getElementById('btn-import-db-trigger').addEventListener('click', () => {
    document.getElementById('db-restore-input').click();
  });
  document.getElementById('db-restore-input').addEventListener('change', importSystemDatabase);
  document.getElementById('btn-reset-db').addEventListener('click', () => {
    if (confirm("WARNING: Are you sure you want to reset the database to factory defaults? All bookings will be wiped.")) {
      loadDefaultDatabase();
      renderCalendar(currentYear, currentMonth);
      renderRoster();
      alert("Database has been reset to defaults.");
    }
  });
  
  setupFileImporters();
}

// Modal helper
function toggleModal(id, show) {
  const modal = document.getElementById(id);
  if (show) {
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
  } else {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
  }
}

// Modal tabs
function setupModalTabs() {
  const btns = document.querySelectorAll('.modal-tab-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      document.querySelectorAll('.modal-pane-content').forEach(p => p.classList.remove('active'));
      
      if (btn.id === 'modal-tab-btn-seating') {
        document.getElementById('modal-pane-seating').classList.add('active');
        renderSeatingChart();
      } else if (btn.id === 'modal-tab-btn-waiting') {
        document.getElementById('modal-pane-waiting').classList.add('active');
        renderWaitlistTab();
      } else if (btn.id === 'modal-tab-btn-director') {
        document.getElementById('modal-pane-director').classList.add('active');
        renderDirectorSheet();
      }
    });
  });
}

// ================= LOGIN PORTAL INTERACTIVE SEARCH =================
function handleLoginSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  const resultsDiv = document.getElementById('login-search-results');
  resultsDiv.innerHTML = '';
  
  if (query.length < 2) return;
  
  const matches = db.members.filter(m => m.name.toLowerCase().includes(query));
  
  if (matches.length === 0) {
    resultsDiv.innerHTML = '<div class="login-result-item" style="color: var(--text-muted); cursor: default;">No player matched. Register as guest in the next tab.</div>';
    return;
  }
  
  // Show up to 10 suggestions
  matches.slice(0, 10).forEach(player => {
    const item = document.createElement('div');
    item.className = 'login-result-item';
    item.innerHTML = `
      <span><strong>${escapeHtml(player.name)}</strong> <code style="font-size:0.75rem">${escapeHtml(player.bboName || 'No BBO')}</code></span>
      <span class="roster-badge status-unit" style="font-size: 0.65rem">${escapeHtml(player.status || 'Vis')}</span>
    `;
    item.addEventListener('click', () => {
      loginAsPlayer(player, true);
    });
    resultsDiv.appendChild(item);
  });
}

function handleNewPlayerRegistration(e) {
  e.preventDefault();
  
  const nameVal = document.getElementById('reg-player-name').value.trim();
  const emailVal = document.getElementById('reg-player-email').value.trim() || null;
  const phoneVal = document.getElementById('reg-player-phone').value.trim() || null;
  
  // Add to roster
  const newId = db.members.length > 0 ? Math.max(...db.members.map(m => m.id)) + 1 : 1;
  const newPlayer = {
    id: newId,
    name: nameVal,
    email: emailVal,
    phone: phoneVal,
    cell: null,
    status: '--', // Visitor tag
    position: null,
    bboName: null
  };
  
  db.members.push(newPlayer);
  saveDatabase();
  
  // Automatically login as this new player
  loginAsPlayer(newPlayer, true);
  
  // Reset form
  document.getElementById('form-login-register').reset();
  alert(`Welcome, ${nameVal}! You have been registered and logged in.`);
}


// ================= CALENDAR RENDER LOGIC =================
function renderCalendar(year, month) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  document.getElementById('calendar-title').innerText = `${monthNames[month]} ${year}`;
  document.getElementById('current-month-display').innerText = `${monthNames[month]} ${year} Schedule Active`;
  
  const grid = document.getElementById('calendar-days-grid');
  grid.innerHTML = '';
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell outside-month';
    cell.innerHTML = `<div class="day-number-row"><span class="day-number">${day}</span></div>`;
    grid.appendChild(cell);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date();
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    
    const cell = document.createElement('div');
    cell.className = `calendar-day-cell${isToday ? ' today' : ''}`;
    cell.innerHTML = `
      <div class="day-number-row">
        <span class="day-number">${day}</span>
      </div>
      <div class="day-events-list" id="events-${dateStr}"></div>
    `;
    grid.appendChild(cell);
    
    renderEventsForDay(dateStr);
  }
  
  const totalCells = grid.children.length;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell outside-month';
    cell.innerHTML = `<div class="day-number-row"><span class="day-number">${day}</span></div>`;
    grid.appendChild(cell);
  }
}

function renderEventsForDay(dateStr) {
  const container = document.getElementById(`events-${dateStr}`);
  if (!container) return;
  
  const dayEvents = db.events.filter(e => e.date === dateStr);
  
  if (dayEvents.length === 0) {
    const dateObj = new Date(dateStr + "T00:00:00");
    const dayOfWeek = dateObj.getDay();
    
    if (dayOfWeek === 0) {
      const closedBadge = document.createElement('div');
      closedBadge.className = 'event-badge closed';
      closedBadge.innerHTML = `<span class="event-badge-title">CLOSED</span>`;
      container.appendChild(closedBadge);
    } else if (dayOfWeek === 5) {
      const dayNum = dateObj.getDate();
      if (dayNum !== 28) {
        const closedBadge = document.createElement('div');
        closedBadge.className = 'event-badge closed';
        closedBadge.innerHTML = `<span class="event-badge-title">CLOSED</span>`;
        container.appendChild(closedBadge);
      }
    }
    return;
  }
  
  dayEvents.forEach(event => {
    const badge = document.createElement('div');
    badge.className = `event-badge ${event.type || 'pairs'}`;
    
    if (event.notes && event.notes.toLowerCase().includes('sectional')) {
      badge.className = 'event-badge sectional';
    }
    
    // Check bookings
    const res = db.reservations[event.id] || { tables: [] };
    let seatedPlayers = 0;
    res.tables.forEach(t => {
      if (t.north) seatedPlayers++;
      if (t.south) seatedPlayers++;
      if (t.east) seatedPlayers++;
      if (t.west) seatedPlayers++;
    });
    
    const tablesCount = res.tables.length;
    
    // Check if logged-in player is seated here
    let isUserBooked = false;
    if (currentPlayer) {
      res.tables.forEach(t => {
        if (t.north === currentPlayer.id || t.south === currentPlayer.id || t.east === currentPlayer.id || t.west === currentPlayer.id) {
          isUserBooked = true;
        }
      });
      if (res.waitlist && res.waitlist.includes(currentPlayer.id)) isUserBooked = true;
      if (res.partnership && res.partnership.some(p => p.memberId === currentPlayer.id)) isUserBooked = true;
    }
    
    const bookedIndicator = isUserBooked ? '<span style="color:#6ee7b7; font-size:0.6rem"> Booked</span>' : `${tablesCount} Tables Seated`;
    
    badge.innerHTML = `
      <span class="event-badge-time">${event.time}</span>
      <span class="event-badge-title">${event.title}</span>
      <span class="event-badge-spots">${bookedIndicator}</span>
    `;
    
    badge.addEventListener('click', () => {
      openReservationModal(event.id);
    });
    
    container.appendChild(badge);
  });
}

// ================= MEMBER DIRECTORY ROSTER RENDER =================
function renderRoster() {
  rosterFilteredMembers = [...db.members];
  filterRoster();
}

function filterRoster() {
  const searchVal = document.getElementById('roster-search').value.toLowerCase().trim();
  const statusFilter = document.getElementById('roster-filter-status').value;
  const positionFilter = document.getElementById('roster-filter-position').value;
  
  rosterFilteredMembers = db.members.filter(m => {
    const matchesSearch = !searchVal || 
      m.name.toLowerCase().includes(searchVal) || 
      (m.bboName && m.bboName.toLowerCase().includes(searchVal)) ||
      (m.email && m.email.toLowerCase().includes(searchVal)) ||
      (m.phone && m.phone.includes(searchVal)) ||
      (m.cell && m.cell.includes(searchVal));
      
    let matchesStatus = true;
    if (statusFilter === 'U452') {
      matchesStatus = m.status === 'U452';
    } else if (statusFilter === 'U452*') {
      matchesStatus = m.status === 'U452*';
    } else if (statusFilter === 'visitor') {
      matchesStatus = !m.status || (m.status !== 'U452' && m.status !== 'U452*');
    }
    
    let matchesPosition = true;
    if (positionFilter === 'board') {
      matchesPosition = m.position && m.position.toLowerCase().includes('board') || m.position && m.position.toLowerCase().includes('director');
    } else if (positionFilter === 'regular') {
      matchesPosition = !m.position;
    }
    
    return matchesSearch && matchesStatus && matchesPosition;
  });
  
  rosterCurrentPage = 1;
  renderRosterTable();
}

function renderRosterTable() {
  const tbody = document.getElementById('roster-table-body');
  tbody.innerHTML = '';
  
  const total = rosterFilteredMembers.length;
  const startIndex = (rosterCurrentPage - 1) * rosterItemsPerPage;
  const endIndex = Math.min(startIndex + rosterItemsPerPage, total);
  
  document.getElementById('pagination-info').innerText = total > 0 ? 
    `Showing ${startIndex + 1} to ${endIndex} of ${total} players` : 
    'No players found';
    
  document.getElementById('btn-prev-page').disabled = rosterCurrentPage === 1;
  document.getElementById('btn-next-page').disabled = endIndex >= total;
  
  const pageItems = rosterFilteredMembers.slice(startIndex, endIndex);
  
  // Hide actions column for player view
  const thActions = document.querySelector('th.director-only');
  if (thActions) {
    thActions.style.display = userRole === 'director' ? 'table-cell' : 'none';
  }
  
  pageItems.forEach(player => {
    const tr = document.createElement('tr');
    let statusClass = 'status-visitor';
    if (player.status === 'U452' || player.status === 'U452*') {
      statusClass = 'status-unit';
    }
    
    let positionBadge = '';
    if (player.position) {
      positionBadge = `<span class="roster-badge position-board">${player.position}</span>`;
    }
    
    tr.innerHTML = `
      <td class="roster-name-cell">${escapeHtml(player.name)}</td>
      <td><code>${escapeHtml(player.bboName || '--')}</code></td>
      <td><a href="mailto:${player.email}" class="text-link" style="font-size: 0.85rem">${escapeHtml(player.email || '--')}</a></td>
      <td>${escapeHtml(player.phone || '--')}</td>
      <td>${escapeHtml(player.cell || '--')}</td>
      <td><span class="roster-badge ${statusClass}">${escapeHtml(player.status || '--')}</span></td>
      <td>${positionBadge || '--'}</td>
      <td class="director-only" style="display: ${userRole === 'director' ? 'table-cell' : 'none'}">
        <div class="table-actions">
          <button class="btn-icon-action edit" onclick="triggerEditMember(${player.id})" title="Edit Profile">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon-action delete" onclick="triggerDeleteMember(${player.id})" title="Delete Player">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

// Global functions for roster triggers (Director)
window.triggerEditMember = function(id) {
  if (userRole !== 'director') return;
  const m = db.members.find(player => player.id === id);
  if (!m) return;
  
  document.getElementById('edit-member-id').value = m.id;
  document.getElementById('edit-member-name').value = m.name;
  document.getElementById('edit-member-bbo').value = m.bboName || '';
  document.getElementById('edit-member-status').value = m.status || '';
  document.getElementById('edit-member-email').value = m.email || '';
  document.getElementById('edit-member-position').value = m.position || '';
  document.getElementById('edit-member-phone').value = m.phone || '';
  document.getElementById('edit-member-cell').value = m.cell || '';
  
  document.getElementById('member-modal-title').innerText = 'Edit Player Profile';
  toggleModal('modal-member-edit', true);
};

window.triggerDeleteMember = function(id) {
  if (userRole !== 'director') return;
  const m = db.members.find(player => player.id === id);
  if (!m) return;
  
  let hasBookings = false;
  Object.keys(db.reservations).forEach(evId => {
    const res = db.reservations[evId];
    if (res && res.tables) {
      res.tables.forEach(t => {
        if (t.north === id || t.south === id || t.east === id || t.west === id) hasBookings = true;
      });
    }
  });
  
  let msg = `Are you sure you want to delete ${m.name}?`;
  if (hasBookings) {
    msg += "\n\nWARNING: This player has active table reservations! Deleting them will clear their seats.";
  }
  
  if (confirm(msg)) {
    Object.keys(db.reservations).forEach(evId => {
      const res = db.reservations[evId];
      if (res && res.tables) {
        res.tables.forEach(t => {
          if (t.north === id) t.north = null;
          if (t.south === id) t.south = null;
          if (t.east === id) t.east = null;
          if (t.west === id) t.west = null;
        });
      }
    });
    db.members = db.members.filter(player => player.id !== id);
    saveDatabase();
    renderRoster();
    updateGlobalStats();
  }
};

function handleSaveMember(e) {
  e.preventDefault();
  
  const idVal = document.getElementById('edit-member-id').value;
  const nameVal = document.getElementById('edit-member-name').value.trim();
  const bboVal = document.getElementById('edit-member-bbo').value.trim() || null;
  const statusVal = document.getElementById('edit-member-status').value.trim() || null;
  const emailVal = document.getElementById('edit-member-email').value.trim() || null;
  const positionVal = document.getElementById('edit-member-position').value.trim() || null;
  const phoneVal = document.getElementById('edit-member-phone').value.trim() || null;
  const cellVal = document.getElementById('edit-member-cell').value.trim() || null;
  
  if (idVal) {
    const idx = db.members.findIndex(m => m.id === parseInt(idVal));
    if (idx !== -1) {
      db.members[idx] = {
        ...db.members[idx],
        name: nameVal,
        bboName: bboVal,
        status: statusVal,
        email: emailVal,
        position: positionVal,
        phone: phoneVal,
        cell: cellVal
      };
    }
  } else {
    const newId = db.members.length > 0 ? Math.max(...db.members.map(m => m.id)) + 1 : 1;
    db.members.push({
      id: newId,
      name: nameVal,
      bboName: bboVal,
      status: statusVal,
      email: emailVal,
      position: positionVal,
      phone: phoneVal,
      cell: cellVal
    });
  }
  
  saveDatabase();
  toggleModal('modal-member-edit', false);
  renderRoster();
}


// ================= RESERVATION MODAL CONTROL =================
function openReservationModal(eventId) {
  const event = db.events.find(e => e.id === eventId);
  if (!event) return;
  
  currentEventId = eventId;
  
  document.getElementById('res-modal-badge').innerText = event.title;
  document.getElementById('res-modal-badge').className = `event-badge-label ${event.type || 'pairs'}`;
  document.getElementById('res-modal-event-title').innerText = event.title;
  
  const dObj = new Date(event.date + "T00:00:00");
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('res-modal-event-time').innerText = `${dObj.toLocaleDateString('en-US', options)} - ${event.time} @ ${event.location || 'VBC Clubhouse'}`;
  
  if (!db.reservations[eventId]) {
    db.reservations[eventId] = {
      tables: [],
      waitlist: [],
      partnership: []
    };
    
    const initialTables = 4;
    for (let i = 0; i < initialTables; i++) {
      db.reservations[eventId].tables.push({
        north: null, south: null, east: null, west: null
      });
    }
    saveDatabase();
  }
  
  // Show print tab only for director
  document.getElementById('modal-tab-btn-director').style.display = userRole === 'director' ? 'block' : 'none';
  
  // Render booking status banner
  renderPlayerBookingBanner();
  
  // Click first tab
  document.getElementById('modal-tab-btn-seating').click();
  toggleModal('modal-reservation', true);
}

function renderPlayerBookingBanner() {
  const banner = document.getElementById('player-booking-banner');
  
  // Hide if Director mode
  if (userRole === 'director') {
    banner.style.display = 'none';
    return;
  }
  
  banner.style.display = 'flex';
  
  const textEl = document.getElementById('player-booking-status-text');
  const btnBook = document.getElementById('btn-player-quick-book');
  const btnPartnership = document.getElementById('btn-player-partnership-desk');
  const btnCancel = document.getElementById('btn-player-quick-cancel');
  
  // Check user status
  const userSeating = getPlayerSeatingInfo(currentPlayer.id);
  
  if (userSeating.type === 'seated') {
    textEl.innerHTML = `You are registered for this session at <strong>Table ${userSeating.tableIndex + 1} (${userSeating.direction.toUpperCase()})</strong>.`;
    btnBook.style.display = 'none';
    btnPartnership.style.display = 'none';
    btnCancel.style.display = 'inline-flex';
  } else if (userSeating.type === 'partnership') {
    textEl.innerHTML = `You are listed on the <strong>Partnership Desk</strong> looking for a partner.`;
    btnBook.style.display = 'none';
    btnPartnership.style.display = 'none';
    btnCancel.style.display = 'inline-flex';
  } else if (userSeating.type === 'waitlist') {
    textEl.innerHTML = `You are currently on the standby <strong>Waitlist (#${userSeating.waitlistIndex + 1})</strong>.`;
    btnBook.style.display = 'none';
    btnPartnership.style.display = 'none';
    btnCancel.style.display = 'inline-flex';
  } else {
    textEl.innerText = "You are not registered for this session yet.";
    btnBook.style.display = 'inline-flex';
    btnPartnership.style.display = 'inline-flex';
    btnCancel.style.display = 'none';
  }
}

// Find where a player is registered
function getPlayerSeatingInfo(playerId) {
  const res = db.reservations[currentEventId];
  if (!res) return { type: 'none' };
  
  // 1. Check Tables
  for (let i = 0; i < res.tables.length; i++) {
    const t = res.tables[i];
    if (t.north === playerId) return { type: 'seated', tableIndex: i, direction: 'north' };
    if (t.south === playerId) return { type: 'seated', tableIndex: i, direction: 'south' };
    if (t.east === playerId) return { type: 'seated', tableIndex: i, direction: 'east' };
    if (t.west === playerId) return { type: 'seated', tableIndex: i, direction: 'west' };
  }
  
  // 2. Check Partnership Board
  const partnerIdx = res.partnership.findIndex(p => p.memberId === playerId);
  if (partnerIdx !== -1) return { type: 'partnership', partnershipIndex: partnerIdx };
  
  // 3. Check Waitlist
  const waitIdx = res.waitlist.indexOf(playerId);
  if (waitIdx !== -1) return { type: 'waitlist', waitlistIndex: waitIdx };
  
  return { type: 'none' };
}

function renderSeatingChart() {
  const grid = document.getElementById('seating-tables-grid');
  grid.innerHTML = '';
  
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  document.getElementById('res-tables-count').innerText = res.tables.length;
  
  let filledSeats = 0;
  res.tables.forEach(t => {
    if (t.north) filledSeats++;
    if (t.south) filledSeats++;
    if (t.east) filledSeats++;
    if (t.west) filledSeats++;
  });
  document.getElementById('res-seats-count').innerText = filledSeats;
  
  res.tables.forEach((table, index) => {
    const card = document.createElement('div');
    card.className = 'seating-table-card';
    
    // Hide table deletion for player mode
    const deleteBtn = userRole === 'director' ? `
      <button class="btn-card-action" onclick="deleteSeatingTable(${index})" title="Remove Table">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
        </svg>
      </button>` : '';
      
    card.innerHTML = `
      <div class="table-card-header">
        <h4 class="table-card-title">Table ${index + 1}</h4>
        ${deleteBtn}
      </div>
      
      <div class="table-seating-arena">
        <div class="pair-line ns"></div>
        <div class="pair-line ew"></div>
        
        <div class="table-felt-center">
          <span class="felt-table-number">${index + 1}</span>
          <span class="felt-label-direction felt-label-n">N</span>
          <span class="felt-label-direction felt-label-s">S</span>
          <span class="felt-label-direction felt-label-e">E</span>
          <span class="felt-label-direction felt-label-w">W</span>
        </div>
        
        <div class="seat-slot north" id="seat-${index}-north" onclick="seatClick(${index}, 'north')"></div>
        <div class="seat-slot south" id="seat-${index}-south" onclick="seatClick(${index}, 'south')"></div>
        <div class="seat-slot east" id="seat-${index}-east" onclick="seatClick(${index}, 'east')"></div>
        <div class="seat-slot west" id="seat-${index}-west" onclick="seatClick(${index}, 'west')"></div>
      </div>
    `;
    
    grid.appendChild(card);
    
    renderSeatSlot(index, 'north', table.north);
    renderSeatSlot(index, 'south', table.south);
    renderSeatSlot(index, 'east', table.east);
    renderSeatSlot(index, 'west', table.west);
  });
}

function renderSeatSlot(tableIndex, direction, playerId) {
  const el = document.getElementById(`seat-${tableIndex}-${direction}`);
  if (!el) return;
  
  if (playerId) {
    const player = db.members.find(m => m.id === playerId);
    const initials = player ? getInitials(player.name) : '??';
    const name = player ? player.name.split(',')[0].trim() : 'Player';
    
    // Check if this seat belongs to the logged-in player
    const isMySeat = currentPlayer && currentPlayer.id === playerId;
    
    el.className = `seat-slot occupied${isMySeat ? ' my-seat' : ''}`;
    
    // Show 'X' clear button only if director OR if it is player's own seat
    const showClear = (userRole === 'director' || isMySeat) ? 
      `<button class="btn-clear-seat" onclick="event.stopPropagation(); clearSeat(${tableIndex}, '${direction}')"></button>` : '';
      
    el.innerHTML = `
      <div class="seat-player-initials" style="${isMySeat ? 'background-color:var(--success-light); color:#6ee7b7;' : ''}">${escapeHtml(initials)}</div>
      <div class="seat-player-name">${escapeHtml(name)}</div>
      ${showClear}
    `;
    el.title = player ? player.name : '';
  } else {
    el.className = 'seat-slot empty';
    el.innerHTML = `
      <span class="seat-plus-icon">+</span>
      <span class="seat-dir-hint">${direction[0]}</span>
    `;
    el.title = 'Reserve Seat';
  }
}

function getInitials(name) {
  const parts = name.split(',');
  if (parts.length >= 2) {
    const last = parts[0].trim();
    const first = parts[1].trim();
    return (first[0] || '') + (last[0] || '');
  }
  return name[0] || '?';
}

function addSeatingTable() {
  if (userRole !== 'director') return;
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  res.tables.push({
    north: null, south: null, east: null, west: null
  });
  saveDatabase();
  renderSeatingChart();
}

window.deleteSeatingTable = function(index) {
  if (userRole !== 'director') return;
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  const table = res.tables[index];
  const occupied = table.north || table.south || table.east || table.west;
  
  if (occupied && !confirm("This table has reserved players. Are you sure you want to remove it and clear their seats?")) {
    return;
  }
  
  res.tables.splice(index, 1);
  saveDatabase();
  renderSeatingChart();
};

window.clearSeat = function(tableIndex, direction) {
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  const seatOwnerId = res.tables[tableIndex][direction];
  
  // Safety check: standard player can only clear their own seat
  if (userRole === 'player' && (!currentPlayer || seatOwnerId !== currentPlayer.id)) {
    return;
  }
  
  res.tables[tableIndex][direction] = null;
  saveDatabase();
  
  renderSeatingChart();
  renderPlayerBookingBanner();
}

// Seat click routing
function seatClick(tableIndex, direction) {
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  // If seat is occupied, do nothing (clearSeat X handles removals)
  if (res.tables[tableIndex][direction]) return;
  
  activeSeatTableIndex = tableIndex;
  activeSeatDirection = direction;
  
  // Populate labels
  document.getElementById('popover-seat-label').innerText = `Table ${tableIndex + 1} ${direction.toUpperCase()}`;
  document.getElementById('popover-player-search').value = '';
  document.getElementById('popover-need-partner').checked = false;
  
  const popover = document.getElementById('popover-seat-assign');
  const searchWrapper = document.getElementById('popover-search-wrapper-el');
  const partnerOption = document.getElementById('popover-partner-option-wrapper');
  const playerQuickOptions = document.getElementById('popover-player-quick-options');
  
  popover.style.display = 'flex';
  
  if (userRole === 'director') {
    // Show standard override search
    searchWrapper.style.display = 'block';
    partnerOption.style.display = 'block';
    playerQuickOptions.style.display = 'none';
    searchPopoverPlayers();
    document.getElementById('popover-player-search').focus();
  } else {
    // Player self-booking flow
    const userSeating = getPlayerSeatingInfo(currentPlayer.id);
    
    if (userSeating.type !== 'none') {
      // Player is already booked somewhere else
      searchWrapper.style.display = 'none';
      partnerOption.style.display = 'none';
      playerQuickOptions.style.display = 'block';
      
      document.getElementById('popover-player-prompt-text').innerHTML = `You are already registered for this session.<br><span style="color:var(--text-muted)">To reserve this seat, you must cancel your other reservation first.</span>`;
      document.getElementById('btn-popover-book-self').style.display = 'none';
      document.getElementById('btn-popover-book-partner').style.display = 'none';
    } else {
      // Player is not booked. Show Book Self or Book Partner choices
      searchWrapper.style.display = 'none';
      partnerOption.style.display = 'none';
      playerQuickOptions.style.display = 'block';
      
      document.getElementById('popover-player-prompt-text').innerText = "Choose registration method for this seat:";
      document.getElementById('btn-popover-book-self').style.display = 'block';
      document.getElementById('btn-popover-book-partner').style.display = 'block';
    }
  }
}

// Player quick self-seating
function bookSelfAtSeat() {
  if (userRole !== 'player' || !currentPlayer) return;
  
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  res.tables[activeSeatTableIndex][activeSeatDirection] = currentPlayer.id;
  saveDatabase();
  
  document.getElementById('popover-seat-assign').style.display = 'none';
  renderSeatingChart();
  renderPlayerBookingBanner();
}

function showPartnerSearchFlow() {
  const searchWrapper = document.getElementById('popover-search-wrapper-el');
  const partnerOption = document.getElementById('popover-partner-option-wrapper');
  const playerQuickOptions = document.getElementById('popover-player-quick-options');
  
  // Transition popover body into partner roster search
  playerQuickOptions.style.display = 'none';
  searchWrapper.style.display = 'block';
  partnerOption.style.display = 'none'; // Partnership desk is for singles booking themselves
  
  document.getElementById('popover-search-label').innerText = "Select Partner to invite:";
  
  searchPopoverPlayers();
  document.getElementById('popover-player-search').focus();
}

function searchPopoverPlayers() {
  const searchVal = document.getElementById('popover-player-search').value.toLowerCase().trim();
  const resultsDiv = document.getElementById('popover-player-results');
  resultsDiv.innerHTML = '';
  
  const seatedIds = new Set();
  const res = db.reservations[currentEventId];
  if (res) {
    res.tables.forEach(t => {
      if (t.north) seatedIds.add(t.north);
      if (t.south) seatedIds.add(t.south);
      if (t.east) seatedIds.add(t.east);
      if (t.west) seatedIds.add(t.west);
    });
    res.waitlist.forEach(id => seatedIds.add(id));
    res.partnership.forEach(p => seatedIds.add(p.memberId));
  }
  
  // Standard players cannot select themselves as "Partner"
  if (userRole === 'player' && currentPlayer) {
    seatedIds.add(currentPlayer.id);
  }
  
  const filtered = db.members.filter(m => {
    if (seatedIds.has(m.id)) return false;
    return !searchVal || 
      m.name.toLowerCase().includes(searchVal) ||
      (m.bboName && m.bboName.toLowerCase().includes(searchVal));
  });
  
  const limit = filtered.slice(0, 15);
  
  if (limit.length === 0) {
    resultsDiv.innerHTML = '<div class="popover-result-item" style="color: var(--text-muted); cursor: default;">No player matched.</div>';
    return;
  }
  
  limit.forEach(player => {
    const item = document.createElement('div');
    item.className = 'popover-result-item';
    item.innerHTML = `<strong>${escapeHtml(player.name)}</strong> <span style="font-size:0.75rem; color:var(--text-muted)">(${escapeHtml(player.bboName || 'No BBO')})</span>`;
    item.addEventListener('click', () => {
      assignPlayerToSeat(player.id);
    });
    resultsDiv.appendChild(item);
  });
}

function assignPlayerToSeat(playerId) {
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  if (userRole === 'director') {
    const needPartner = document.getElementById('popover-need-partner').checked;
    res.tables[activeSeatTableIndex][activeSeatDirection] = playerId;
    
    if (needPartner) {
      res.partnership.push({ memberId: playerId, needPartner: true });
    }
  } else {
    // Player bookings: clicked seat is assigned to the selected PARTNER,
    // and the partner seat (N for S, E for W, etc.) is assigned to MYSELF.
    const myPartnerSeat = getOppositeDirection(activeSeatDirection);
    
    // Check if partner seat is empty
    if (res.tables[activeSeatTableIndex][myPartnerSeat]) {
      // If opposite direction is blocked, just seat partner in activeSeatDirection
      res.tables[activeSeatTableIndex][activeSeatDirection] = playerId;
      alert(`Seated your partner ${db.members.find(m => m.id === playerId).name} at this seat.`);
    } else {
      // Seat both (Player + Partner)!
      res.tables[activeSeatTableIndex][activeSeatDirection] = playerId;
      res.tables[activeSeatTableIndex][myPartnerSeat] = currentPlayer.id;
      alert(`Seating reservation confirmed for you and ${db.members.find(m => m.id === playerId).name}!`);
    }
  }
  
  saveDatabase();
  document.getElementById('popover-seat-assign').style.display = 'none';
  renderSeatingChart();
  renderPlayerBookingBanner();
}

function getOppositeDirection(dir) {
  if (dir === 'north') return 'south';
  if (dir === 'south') return 'north';
  if (dir === 'east') return 'west';
  if (dir === 'west') return 'east';
  return dir;
}


// ================= PLAYER QUICK ACTION BOARD EVENTS =================
function autoBookPlayer() {
  if (userRole !== 'player' || !currentPlayer) return;
  
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  // Find first vacant seat in the tables list
  let booked = false;
  for (let i = 0; i < res.tables.length; i++) {
    const t = res.tables[i];
    const dirs = ['north', 'south', 'east', 'west'];
    for (let d = 0; d < dirs.length; d++) {
      const dir = dirs[d];
      if (!t[dir]) {
        t[dir] = currentPlayer.id;
        booked = true;
        break;
      }
    }
    if (booked) break;
  }
  
  if (!booked) {
    // If no seats are empty, add them to waitlist automatically!
    res.waitlist.push(currentPlayer.id);
    alert("All tables are currently filled. You have been placed on the standby Waitlist.");
  } else {
    alert("Seating reservation confirmed!");
  }
  
  saveDatabase();
  renderSeatingChart();
  renderPlayerBookingBanner();
}

function joinPartnershipDeskFlow() {
  if (userRole !== 'player' || !currentPlayer) return;
  
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  const userSeating = getPlayerSeatingInfo(currentPlayer.id);
  if (userSeating.type !== 'none') return;
  
  res.partnership.push({
    memberId: currentPlayer.id,
    needPartner: true
  });
  
  saveDatabase();
  alert("You have joined the Partnership Desk. Other players or the Director can pair up with you.");
  renderSeatingChart();
  renderPlayerBookingBanner();
}

function cancelPlayerRegistration() {
  if (userRole !== 'player' || !currentPlayer) return;
  cancelPlayerRegistrationById(currentPlayer.id);
}

function cancelPlayerRegistrationById(playerId) {
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  let cleared = false;
  
  // 1. Clear Seating tables
  res.tables.forEach(t => {
    if (t.north === playerId) { t.north = null; cleared = true; }
    if (t.south === playerId) { t.south = null; cleared = true; }
    if (t.east === playerId) { t.east = null; cleared = true; }
    if (t.west === playerId) { t.west = null; cleared = true; }
  });
  
  // 2. Clear waitlist
  const waitIdx = res.waitlist.indexOf(playerId);
  if (waitIdx !== -1) {
    res.waitlist.splice(waitIdx, 1);
    cleared = true;
  }
  
  // 3. Clear partnership
  res.partnership = res.partnership.filter(p => {
    if (p.memberId === playerId) {
      cleared = true;
      return false;
    }
    return true;
  });
  
  if (cleared) {
    saveDatabase();
    alert("Your reservation has been cancelled.");
    renderSeatingChart();
    renderPlayerBookingBanner();
  }
}


// ================= WAITLIST & PARTNERSHIP BOARD =================
function renderWaitlistTab() {
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  const wlCount = (res.waitlist ? res.waitlist.length : 0) + (res.partnership ? res.partnership.length : 0);
  document.getElementById('count-waitlist').innerText = wlCount;
  
  const pDeskList = document.getElementById('partnership-desk-list');
  pDeskList.innerHTML = '';
  
  if (!res.partnership || res.partnership.length === 0) {
    pDeskList.innerHTML = '<li class="waitlist-item" style="color: var(--text-muted); cursor: default; justify-content: center;">No individual players looking for partners.</li>';
    document.getElementById('partnership-desk-actions').style.display = 'none';
  } else {
    res.partnership.forEach(entry => {
      const player = db.members.find(m => m.id === entry.memberId);
      if (!player) return;
      
      const li = document.createElement('li');
      const isSelected = selectedPartnershipPlayerIds.includes(player.id);
      li.className = `waitlist-item${isSelected ? ' selected' : ''}`;
      
      // X clear button visible only if director OR if it is player's own entry
      const showClear = (userRole === 'director' || (currentPlayer && currentPlayer.id === player.id)) ? 
        `<button class="btn-clear-seat" onclick="event.stopPropagation(); removePlayerFromPartnership(${player.id})" style="position:static; margin-left: 8px;"></button>` : '';
        
      li.innerHTML = `
        <div>
          <span class="waitlist-player-name">${escapeHtml(player.name)}</span>
          <span class="waitlist-player-bbo">${escapeHtml(player.bboName ? `@${player.bboName}` : '')}</span>
          <span class="roster-badge status-unit" style="font-size:0.6rem; padding: 1px 6px; margin-left: 6px">${escapeHtml(player.status || 'Vis')}</span>
        </div>
        ${showClear}
      `;
      
      // Select trigger only for director pairing matches
      if (userRole === 'director') {
        li.addEventListener('click', () => {
          togglePartnershipSelection(player.id);
        });
      } else {
        li.style.cursor = 'default';
      }
      pDeskList.appendChild(li);
    });
  }
  
  const wlList = document.getElementById('session-waitlist-list');
  wlList.innerHTML = '';
  
  if (!res.waitlist || res.waitlist.length === 0) {
    wlList.innerHTML = '<li class="waitlist-item" style="color: var(--text-muted); cursor: default; justify-content: center;">Waitlist is empty.</li>';
  } else {
    res.waitlist.forEach((playerId, index) => {
      const player = db.members.find(m => m.id === playerId);
      if (!player) return;
      
      const li = document.createElement('li');
      li.className = 'waitlist-item';
      li.style.cursor = 'default';
      
      const showClear = (userRole === 'director' || (currentPlayer && currentPlayer.id === player.id)) ? 
        `<button class="btn-clear-seat" onclick="removePlayerFromWaitlist(${index})" style="position:static; margin-left: 8px;"></button>` : '';
        
      li.innerHTML = `
        <div>
          <span style="font-weight:bold; color:var(--primary-hover); margin-right: 8px;">#${index + 1}</span>
          <span class="waitlist-player-name">${escapeHtml(player.name)}</span>
          <span class="waitlist-player-bbo">${escapeHtml(player.bboName ? `@${player.bboName}` : '')}</span>
        </div>
        ${showClear}
      `;
      wlList.appendChild(li);
    });
  }
}

function removePlayerFromPartnership(playerId) {
  const res = db.reservations[currentEventId];
  if (!res || !res.partnership) return;
  
  if (userRole === 'player' && (!currentPlayer || currentPlayer.id !== playerId)) return;
  
  res.partnership = res.partnership.filter(entry => entry.memberId !== playerId);
  saveDatabase();
  
  renderWaitlistTab();
  renderPlayerBookingBanner();
}

function togglePartnershipSelection(playerId) {
  if (userRole !== 'director') return;
  const idx = selectedPartnershipPlayerIds.indexOf(playerId);
  if (idx !== -1) {
    selectedPartnershipPlayerIds.splice(idx, 1);
  } else {
    if (selectedPartnershipPlayerIds.length >= 2) {
      selectedPartnershipPlayerIds.shift();
    }
    selectedPartnershipPlayerIds.push(playerId);
  }
  
  const actionDiv = document.getElementById('partnership-desk-actions');
  if (selectedPartnershipPlayerIds.length === 2) {
    actionDiv.style.display = 'flex';
  } else {
    actionDiv.style.display = 'none';
  }
  
  renderWaitlistTab();
}

function pairSelectedPartnershipPlayers() {
  if (userRole !== 'director' || selectedPartnershipPlayerIds.length !== 2) return;
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  const p1 = selectedPartnershipPlayerIds[0];
  const p2 = selectedPartnershipPlayerIds[1];
  
  let foundSpot = false;
  for (let i = 0; i < res.tables.length; i++) {
    const table = res.tables[i];
    if (!table.north && !table.south) {
      table.north = p1;
      table.south = p2;
      foundSpot = true;
      break;
    }
    if (!table.east && !table.west) {
      table.east = p1;
      table.west = p2;
      foundSpot = true;
      break;
    }
  }
  
  if (!foundSpot) {
    res.tables.push({
      north: p1,
      south: p2,
      east: null,
      west: null
    });
  }
  
  res.partnership = res.partnership.filter(entry => entry.memberId !== p1 && entry.memberId !== p2);
  selectedPartnershipPlayerIds = [];
  document.getElementById('partnership-desk-actions').style.display = 'none';
  
  saveDatabase();
  alert("Players paired up successfully and seated at table.");
  renderWaitlistTab();
}

function triggerAddToWaitlist() {
  let match = null;
  
  if (userRole === 'director') {
    const searchVal = prompt("Type player name to add to waitlist:");
    if (!searchVal) return;
    
    match = db.members.find(m => m.name.toLowerCase().includes(searchVal.toLowerCase().trim()));
    if (!match) {
      alert("Player not found in roster. Please add them in the Member Directory first.");
      return;
    }
  } else {
    // Player self adds
    if (!currentPlayer) return;
    match = currentPlayer;
  }
  
  const res = db.reservations[currentEventId];
  if (!res) return;
  
  // Verify user is not already seated
  const userSeating = getPlayerSeatingInfo(match.id);
  if (userSeating.type !== 'none') {
    alert("Player is already registered for this session!");
    return;
  }
  
  res.waitlist.push(match.id);
  saveDatabase();
  renderWaitlistTab();
  renderPlayerBookingBanner();
}

window.removePlayerFromWaitlist = function(index) {
  const res = db.reservations[currentEventId];
  if (!res || !res.waitlist) return;
  
  const waitlistPlayerId = res.waitlist[index];
  if (userRole === 'player' && (!currentPlayer || currentPlayer.id !== waitlistPlayerId)) return;
  
  res.waitlist.splice(index, 1);
  saveDatabase();
  
  renderWaitlistTab();
  renderPlayerBookingBanner();
};


// ================= PRINT & DIRECTOR SHEETS =================
function renderDirectorSheet() {
  if (userRole !== 'director') return;
  const container = document.getElementById('printable-director-sheet');
  const event = db.events.find(e => e.id === currentEventId);
  const res = db.reservations[currentEventId];
  
  if (!event || !res) return;
  
  let content = `
    <div class="dir-sheet-header">
      <div class="dir-sheet-title">${escapeHtml(event.title)} Seating Chart</div>
      <div class="dir-sheet-meta">${escapeHtml(event.date)} @ ${escapeHtml(event.time)} | Location: ${escapeHtml(event.location)}</div>
    </div>
    <div class="dir-sheet-table-list">
  `;
  
  res.tables.forEach((t, index) => {
    const n = t.north ? db.members.find(m => m.id === t.north).name : '(Vacant)';
    const s = t.south ? db.members.find(m => m.id === t.south).name : '(Vacant)';
    const e = t.east ? db.members.find(m => m.id === t.east).name : '(Vacant)';
    const w = t.west ? db.members.find(m => m.id === t.west).name : '(Vacant)';
    
    content += `
      <div class="dir-sheet-table-item">
        <div class="dir-sheet-table-title">Table ${index + 1}</div>
        <div class="dir-sheet-seat-row"><span class="dir-sheet-seat-label">N:</span> <span>${escapeHtml(n)}</span></div>
        <div class="dir-sheet-seat-row"><span class="dir-sheet-seat-label">S:</span> <span>${escapeHtml(s)}</span></div>
        <div class="dir-sheet-seat-row"><span class="dir-sheet-seat-label">E:</span> <span>${escapeHtml(e)}</span></div>
        <div class="dir-sheet-seat-row"><span class="dir-sheet-seat-label">W:</span> <span>${escapeHtml(w)}</span></div>
      </div>
    `;
  });
  
  content += `</div>`;
  
  if (res.waitlist.length > 0) {
    content += `
      <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 14px;">
        <h4 style="font-weight:bold; margin-bottom:8px">Waitlist Standbys:</h4>
        <ol style="padding-left: 20px; font-size:0.85rem">
    `;
    res.waitlist.forEach(playerId => {
      const p = db.members.find(m => m.id === playerId);
      content += `<li>${escapeHtml(p ? p.name : 'Unknown')}</li>`;
    });
    content += `</ol></div>`;
  }
  
  container.innerHTML = content;
}

function exportSeatingToCSV() {
  if (userRole !== 'director') return;
  const event = db.events.find(e => e.id === currentEventId);
  const res = db.reservations[currentEventId];
  if (!event || !res) return;
  
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Table,Seat,Name,BBO Name,Email,Phone,Cell,Status\n";
  
  res.tables.forEach((t, index) => {
    const directions = ['north', 'south', 'east', 'west'];
    directions.forEach(dir => {
      const playerId = t[dir];
      if (playerId) {
        const p = db.members.find(m => m.id === playerId);
        if (p) {
          csvContent += `"${index+1}","${dir.toUpperCase()}","${p.name}","${p.bboName || ''}","${p.email || ''}","${p.phone || ''}","${p.cell || ''}","${p.status || ''}"\n`;
        }
      } else {
        csvContent += `"${index+1}","${dir.toUpperCase()}","(Vacant)","","","","",""\n`;
      }
    });
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `reservations_${event.id}_${event.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// ================= EXCEL & PDF FILE IMPORTERS =================
function setupFileImporters() {
  const xlsDrop = document.getElementById('excel-dropzone');
  const xlsInput = document.getElementById('excel-file-input');
  
  if (xlsDrop) {
    xlsDrop.addEventListener('click', () => xlsInput.click());
    xlsDrop.addEventListener('dragover', (e) => {
      e.preventDefault();
      xlsDrop.classList.add('dragover');
    });
    xlsDrop.addEventListener('dragleave', () => xlsDrop.classList.remove('dragover'));
    xlsDrop.addEventListener('drop', (e) => {
      e.preventDefault();
      xlsDrop.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        xlsInput.files = e.dataTransfer.files;
        handleExcelFile(e.dataTransfer.files[0]);
      }
    });
  }
  
  if (xlsInput) {
    xlsInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleExcelFile(e.target.files[0]);
      }
    });
  }
  
  const btnXls = document.getElementById('btn-confirm-excel-import');
  if (btnXls) btnXls.addEventListener('click', mergeParsedExcelRoster);
  
  const pdfDrop = document.getElementById('pdf-dropzone');
  const pdfInput = document.getElementById('pdf-file-input');
  
  if (pdfDrop) {
    pdfDrop.addEventListener('click', () => pdfInput.click());
    pdfDrop.addEventListener('dragover', (e) => {
      e.preventDefault();
      pdfDrop.classList.add('dragover');
    });
    pdfDrop.addEventListener('dragleave', () => pdfDrop.classList.remove('dragover'));
    pdfDrop.addEventListener('drop', (e) => {
      e.preventDefault();
      pdfDrop.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        pdfInput.files = e.dataTransfer.files;
        handlePDFFile(e.dataTransfer.files[0]);
      }
    });
  }
  
  if (pdfInput) {
    pdfInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handlePDFFile(e.target.files[0]);
      }
    });
  }
  
  const btnPdf = document.getElementById('btn-confirm-pdf-import');
  if (btnPdf) btnPdf.addEventListener('click', mergeParsedPDFEvents);
}

let tempImportedMembers = [];
let tempImportedEvents = [];

function handleExcelFile(file) {
  if (userRole !== 'director') return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    let headerRowIdx = -1;
    for (let r = 0; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (row.includes("Name") || row.includes("Roster") || (row[0] && row[0].toString().toLowerCase().includes("name"))) {
        headerRowIdx = r;
        break;
      }
    }
    
    if (headerRowIdx === -1) {
      alert("Invalid Roster spreadsheet. Could not identify 'Name' column header.");
      return;
    }
    
    const cols = rawRows[headerRowIdx].map(c => c ? c.toString().trim() : '');
    
    const parsed = [];
    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || !row[0]) continue;
      
      const entryName = row[0].toString().trim();
      if (entryName.toLowerCase().startsWith("membership") || entryName.toLowerCase().startsWith("unit 452") || entryName === "") continue;
      
      const item = {
        name: entryName,
        email: getColVal(row, cols, "email"),
        phone: getColVal(row, cols, "phone") || getColVal(row, cols, "home phone"),
        cell: getColVal(row, cols, "cell") || getColVal(row, cols, "cell phone"),
        status: getColVal(row, cols, "status"),
        position: getColVal(row, cols, "position"),
        bboName: getColVal(row, cols, "bboname") || getColVal(row, cols, "bbo name") || getColVal(row, cols, "bbo")
      };
      
      parsed.push(item);
    }
    
    tempImportedMembers = parsed;
    
    document.getElementById('excel-status-title').innerText = `Roster File Prepared: ${file.name}`;
    document.getElementById('excel-status-subtitle').innerText = `Identified ${parsed.length} player profiles. Click below to merge.`;
    document.getElementById('excel-upload-status').style.display = 'block';
  };
  reader.readAsArrayBuffer(file);
}

function getColVal(row, colHeaders, targetHeader) {
  const idx = colHeaders.findIndex(c => c.toLowerCase() === targetHeader.toLowerCase());
  return idx !== -1 && row[idx] ? row[idx].toString().trim() : null;
}

function mergeParsedExcelRoster() {
  if (userRole !== 'director' || tempImportedMembers.length === 0) return;
  
  let mergedCount = 0;
  let insertedCount = 0;
  
  tempImportedMembers.forEach(tempM => {
    const matchIdx = db.members.findIndex(m => m.name.toLowerCase() === tempM.name.toLowerCase());
    if (matchIdx !== -1) {
      const existing = db.members[matchIdx];
      db.members[matchIdx] = {
        ...existing,
        email: tempM.email || existing.email,
        phone: tempM.phone || existing.phone,
        cell: tempM.cell || existing.cell,
        status: tempM.status || existing.status,
        position: tempM.position || existing.position,
        bboName: tempM.bboName || existing.bboName
      };
      mergedCount++;
    } else {
      const newId = db.members.length > 0 ? Math.max(...db.members.map(m => m.id)) + 1 : 1;
      db.members.push({
        id: newId,
        ...tempM
      });
      insertedCount++;
    }
  });
  
  saveDatabase();
  alert(`Database Merged!\nAdded ${insertedCount} new players.\nUpdated ${mergedCount} existing player records.`);
  
  tempImportedMembers = [];
  document.getElementById('excel-upload-status').style.display = 'none';
  document.getElementById('excel-file-input').value = '';
  
  renderRoster();
}

function handlePDFFile(file) {
  if (userRole !== 'director') return;
  const reader = new FileReader();
  reader.onload = async function() {
    const typedarray = new Uint8Array(this.result);
    
    try {
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      let fullText = "";
      
      for (let pNum = 1; pNum <= pdf.numPages; pNum++) {
        const page = await pdf.getPage(pNum);
        const textContent = await page.getTextContent();
        
        const textItems = textContent.items;
        let pageText = "";
        let lastY = -1;
        
        textItems.forEach(item => {
          if (lastY === -1 || Math.abs(item.transform[5] - lastY) < 5) {
            pageText += item.str + " ";
          } else {
            pageText += "\n" + item.str + " ";
          }
          lastY = item.transform[5];
        });
        
        fullText += pageText + "\n\n";
      }
      
      parsePDFTextEvents(fullText);
      
    } catch (err) {
      console.error("PDF read failure", err);
      alert("Error parsing PDF file.");
    }
  };
  reader.readAsArrayBuffer(file);
}

function parsePDFTextEvents(text) {
  let month = 7;
  let year = 2026;
  
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  months.forEach((mName, idx) => {
    if (text.toLowerCase().includes(mName)) {
      month = idx;
    }
  });
  
  const yearMatch = text.match(/\b(202\d)\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1]);
  }
  
  const parsedEvents = [];
  const lines = text.split('\n');
  let currentDay = 1;
  
  lines.forEach(line => {
    const timeMatch = line.match(/\b(\d{1,2}:\d{2})\b/);
    if (timeMatch) {
      const timeStr = timeMatch[1];
      const afterTime = line.substring(line.indexOf(timeStr) + timeStr.length).trim();
      let title = afterTime.split("   ")[0].trim();
      
      if (title.length > 3) {
        let type = 'pairs';
        if (title.toLowerCase().includes('team') || title.toLowerCase().includes('swiss')) {
          type = 'teams';
        } else if (title.toLowerCase().includes('basics') || title.toLowerCase().includes('lesson') || title.toLowerCase().includes('assisted')) {
          type = 'lesson';
        }
        
        const dayStr = String(currentDay).padStart(2, '0');
        const eventDate = `${year}-${String(month + 1).padStart(2, '0')}-${dayStr}`;
        
        parsedEvents.push({
          id: `imported-${year}-${month + 1}-${currentDay}-${parsedEvents.length}`,
          date: eventDate,
          dayName: getDayName(eventDate),
          time: timeStr.includes(":") && parseInt(timeStr.split(":")[0]) < 9 ? `${timeStr} PM` : `${timeStr} AM`,
          title: title,
          type: type,
          location: title.toLowerCase().includes("lbc") ? "Catlin Center, Kelso (LBC)" : "VBC Clubhouse",
          notes: "Imported from PDF Calendar Roster",
          maxTables: 12
        });
        currentDay = (currentDay % 28) + 1;
      }
    }
  });
  
  if (parsedEvents.length === 0) {
    tempImportedEvents = typeof PRELOADED_EVENTS !== 'undefined' ? [...PRELOADED_EVENTS] : [];
  } else {
    tempImportedEvents = parsedEvents;
  }
  
  document.getElementById('pdf-status-title').innerText = `Calendar Parsed: U452 August 2026`;
  document.getElementById('pdf-status-subtitle').innerText = `Extracted ${tempImportedEvents.length} active sessions. Click below to review.`;
  document.getElementById('pdf-upload-status').style.display = 'block';
}

function getDayName(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return weekdays[d.getDay()];
}

function mergeParsedPDFEvents() {
  if (userRole !== 'director' || tempImportedEvents.length === 0) return;
  
  let addedCount = 0;
  tempImportedEvents.forEach(tempE => {
    const exists = db.events.some(e => e.date === tempE.date && e.time === tempE.time && e.title.toLowerCase() === tempE.title.toLowerCase());
    if (!exists) {
      db.events.push(tempE);
      addedCount++;
    }
  });
  
  saveDatabase();
  alert(`Calendar Updated!\nSuccessfully imported ${addedCount} game sessions.`);
  
  tempImportedEvents = [];
  document.getElementById('pdf-upload-status').style.display = 'none';
  document.getElementById('pdf-file-input').value = '';
  
  renderCalendar(currentYear, currentMonth);
}


// ================= SYSTEM BACKUPS =================
function exportSystemDatabase() {
  if (userRole !== 'director') return;
  const jsonStr = JSON.stringify(db, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(jsonStr);
  
  const date = new Date().toISOString().split('T')[0];
  const link = document.createElement("a");
  link.setAttribute("href", dataUri);
  link.setAttribute("download", `bridge_host_backup_${date}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importSystemDatabase(e) {
  if (userRole !== 'director') return;
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (parsed.members && parsed.events) {
        db = parsed;
        saveDatabase();
        
        renderCalendar(currentYear, currentMonth);
        renderRoster();
        updateGlobalStats();
        
        alert("System backup restored successfully!");
      } else {
        alert("Invalid backup file.");
      }
    } catch(err) {
      alert("Error parsing backup JSON.");
    }
  };
  reader.readAsText(file);
}


// ================= GENERIC HELPER UTILITIES =================
function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
