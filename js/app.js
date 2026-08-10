/**
 * Vancouver Bridge Club (ACBL Unit 452)
 * Core Application Script & Accessibility Controllers
 */

document.addEventListener('DOMContentLoaded', () => {
  initAccessibility();
  initMobileMenu();
  initTodayWidget();
  highlightActiveNav();
});

/* ================= ACCESSIBILITY CONTROLS ================= */
function initAccessibility() {
  const savedSize = localStorage.getItem('vbc_text_size') || 'normal';
  const savedTheme = localStorage.getItem('vbc_theme') || 'light';

  document.documentElement.setAttribute('data-text-size', savedSize);
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Update active state on font size buttons if present
  document.querySelectorAll('.font-scale-btn').forEach(btn => {
    if (btn.getAttribute('data-size') === savedSize) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.addEventListener('click', () => {
      const newSize = btn.getAttribute('data-size');
      document.documentElement.setAttribute('data-text-size', newSize);
      localStorage.setItem('vbc_text_size', newSize);

      document.querySelectorAll('.font-scale-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Dark/Light Theme toggle
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) {
    updateThemeButtonText(themeToggle, savedTheme);
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('vbc_theme', nextTheme);
      updateThemeButtonText(themeToggle, nextTheme);
    });
  }
}

function updateThemeButtonText(btn, theme) {
  if (theme === 'dark') {
    btn.innerHTML = '☀️ Light Mode';
  } else {
    btn.innerHTML = '🌙 Dark Mode';
  }
}

/* ================= MOBILE NAVIGATION DRAWER ================= */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const mainNav = document.getElementById('main-nav');

  if (toggleBtn && mainNav) {
    toggleBtn.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      const isOpen = mainNav.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
    });
  }
}

/* ================= ACTIVE PAGE HIGHLIGHT ================= */
function highlightActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ================= DYNAMIC "TODAY AT VBC" WIDGET ================= */
function initTodayWidget() {
  const widgetContainer = document.getElementById('today-games-container');
  const todayDateBadge = document.getElementById('today-date-badge');
  if (!widgetContainer || typeof VBC_DATA === 'undefined') return;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const currentDayName = days[today.getDay()];
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  if (todayDateBadge) {
    todayDateBadge.textContent = formattedDate;
  }

  // Filter weekly games scheduled for today
  const todaysGames = VBC_DATA.weeklySchedule.filter(g => g.day.toLowerCase() === currentDayName.toLowerCase());

  if (todaysGames.length === 0) {
    widgetContainer.innerHTML = `
      <div class="today-game-item" style="border-left-color: var(--text-subtle);">
        <div class="game-time-badge" style="color: var(--text-muted);">No Games</div>
        <div class="game-info">
          <div class="game-title-text">No regular sessions scheduled for ${currentDayName}.</div>
          <div class="game-details-text">Check the monthly calendar for special weekend tournaments or upcoming weekday games.</div>
        </div>
      </div>
    `;
  } else {
    widgetContainer.innerHTML = todaysGames.map(game => `
      <div class="today-game-item">
        <div class="game-time-badge">${game.time}</div>
        <div class="game-info">
          <div class="game-title-text">${game.title}</div>
          <div class="game-details-text">${game.notes} • Table Fee: <strong>${game.fee}</strong></div>
        </div>
        <div>
          <a href="partnership.html" class="btn btn-sm btn-outline">Find Partner</a>
        </div>
      </div>
    `).join('');
  }
}
