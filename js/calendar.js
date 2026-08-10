/**
 * Vancouver Bridge Club (ACBL Unit 452)
 * Interactive Event Calendar & Schedule Controller
 */

let currentYear = 2026;
let currentMonth = 7; // August (0-indexed: 7)
let activeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('calendar-grid-container')) return;
  
  initCalendar();
  initCalendarFilters();
  initCalendarModal();
});

function initCalendar() {
  renderCalendar(currentYear, currentMonth);

  const prevBtn = document.getElementById('cal-prev-btn');
  const nextBtn = document.getElementById('cal-next-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentYear, currentMonth);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentYear, currentMonth);
    });
  }
}

function initCalendarFilters() {
  const filterBtns = document.querySelectorAll('.cal-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter') || 'all';
      renderCalendar(currentYear, currentMonth);
    });
  });
}

function renderCalendar(year, month) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const titleEl = document.getElementById('calendar-current-title');
  if (titleEl) {
    titleEl.textContent = `${monthNames[month]} ${year}`;
  }

  const container = document.getElementById('calendar-grid-container');
  if (!container) return;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  let html = `
    <div class="cal-day-header">Sun</div>
    <div class="cal-day-header">Mon</div>
    <div class="cal-day-header">Tue</div>
    <div class="cal-day-header">Wed</div>
    <div class="cal-day-header">Thu</div>
    <div class="cal-day-header">Fri</div>
    <div class="cal-day-header">Sat</div>
  `;

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevDaysInMonth - i;
    html += `
      <div class="cal-day-cell other-month">
        <div class="cal-day-number">${dayNum}</div>
      </div>
    `;
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, day).getDay();

    // Check if this date has specific events
    let events = (VBC_DATA.calendarEvents || []).filter(e => e.date === dateStr);

    // Apply active filter
    if (activeFilter !== 'all') {
      events = events.filter(e => e.type === activeFilter);
    }

    const isToday = (day === 10 && month === 7 && year === 2026); // simulated current date match

    html += `
      <div class="cal-day-cell ${isToday ? 'today' : ''}">
        <div class="cal-day-number">${day}</div>
        <div class="cal-events-list">
          ${events.map(ev => `
            <div class="cal-event-pill ${ev.type === 'special' ? 'special' : ''}" onclick="openEventModal('${ev.id}')" title="${ev.title} (${ev.time})">
              ${ev.time.split(' ')[0]} ${ev.title}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Next month leading days to complete 35 or 42 grid cells
  const totalSlots = firstDayIndex + daysInMonth;
  const remainingSlots = (totalSlots % 7 === 0) ? 0 : 7 - (totalSlots % 7);
  for (let nextDay = 1; nextDay <= remainingSlots; nextDay++) {
    html += `
      <div class="cal-day-cell other-month">
        <div class="cal-day-number">${nextDay}</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

/* ================= EVENT MODAL POPUP ================= */
function initCalendarModal() {
  const backdrop = document.getElementById('event-modal-backdrop');
  const closeBtn = document.getElementById('event-modal-close');

  if (backdrop && closeBtn) {
    closeBtn.addEventListener('click', () => backdrop.classList.remove('active'));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });
  }
}

window.openEventModal = function(eventId) {
  const event = (VBC_DATA.calendarEvents || []).find(e => e.id === eventId);
  if (!event) return;

  const backdrop = document.getElementById('event-modal-backdrop');
  const titleEl = document.getElementById('modal-event-title');
  const dateEl = document.getElementById('modal-event-date');
  const typeEl = document.getElementById('modal-event-type');
  const feeEl = document.getElementById('modal-event-fee');
  const notesEl = document.getElementById('modal-event-notes');

  if (titleEl) titleEl.textContent = event.title;
  if (dateEl) dateEl.textContent = `${event.date} at ${event.time}`;
  if (typeEl) typeEl.textContent = event.type.toUpperCase();
  if (feeEl) feeEl.textContent = event.fee || "$8.00";
  if (notesEl) notesEl.textContent = event.notes || "Regular club masterpoints awarded.";

  if (backdrop) backdrop.classList.add('active');
};
