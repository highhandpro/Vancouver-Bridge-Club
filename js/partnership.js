/**
 * Vancouver Bridge Club (ACBL Unit 452)
 * Interactive Partnership Desk Controller
 */

let partnershipPosts = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('partnership-list-container')) return;

  loadPartnershipPosts();
  initPartnershipModal();
  initPartnershipFilters();
});

function loadPartnershipPosts() {
  const localSaved = localStorage.getItem('vbc_partnership_posts');
  if (localSaved) {
    try {
      partnershipPosts = JSON.parse(localSaved);
    } catch (e) {
      partnershipPosts = [...VBC_DATA.initialPartnershipPosts];
    }
  } else {
    partnershipPosts = [...VBC_DATA.initialPartnershipPosts];
  }

  renderPartnershipPosts(partnershipPosts);
}

function renderPartnershipPosts(posts) {
  const container = document.getElementById('partnership-list-container');
  const countBadge = document.getElementById('partnership-count-badge');
  if (!container) return;

  if (countBadge) countBadge.textContent = `${posts.length} Active Requests`;

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <div class="card-icon" style="margin: 0 auto 16px;">♠</div>
        <h3 class="card-title">No Requests Found</h3>
        <p class="card-desc">No partnership requests match your current filter. Be the first to post a request below!</p>
        <button class="btn btn-primary" onclick="openPartnerModal()" style="margin: 0 auto;">Post a Request</button>
      </div>
    `;
    return;
  }

  container.innerHTML = posts.map(post => `
    <div class="partnership-request-card">
      <div class="partnership-top">
        <div>
          <div class="player-name-bold">${escapeHtml(post.name)}</div>
          <div style="font-size: 0.85rem; color: var(--text-subtle);">${escapeHtml(post.mps || 'Member')} • <span class="badge badge-blue">${escapeHtml(post.bracket || 'All Levels')}</span></div>
        </div>
        <span class="badge badge-amber">${escapeHtml(post.postedAt || 'Recent')}</span>
      </div>

      <div style="font-size: 0.95rem;">
        <div><strong>Game Date:</strong> ${escapeHtml(post.targetDate)} (${escapeHtml(post.targetSession)})</div>
        <div style="margin-top: 4px;"><strong>Bidding System:</strong> ${escapeHtml(post.system)}</div>
      </div>

      <p style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">
        "${escapeHtml(post.notes)}"
      </p>

      <div class="partner-contact-row">
        <span class="badge badge-green" style="font-size: 0.85rem;">Phone: ${escapeHtml(post.contact)}</span>
      </div>
    </div>
  `).join('');
}

function initPartnershipFilters() {
  const searchInput = document.getElementById('partner-search-input');
  const bracketSelect = document.getElementById('partner-bracket-select');

  function applyFilters() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const bracket = bracketSelect ? bracketSelect.value : 'all';

    const filtered = partnershipPosts.filter(post => {
      const matchesQuery = !query || 
        post.name.toLowerCase().includes(query) || 
        post.system.toLowerCase().includes(query) || 
        post.targetDate.toLowerCase().includes(query);

      const matchesBracket = (bracket === 'all') || (post.bracket && post.bracket.toLowerCase().includes(bracket.toLowerCase()));

      return matchesQuery && matchesBracket;
    });

    renderPartnershipPosts(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (bracketSelect) bracketSelect.addEventListener('change', applyFilters);
}

function initPartnershipModal() {
  const backdrop = document.getElementById('partner-modal-backdrop');
  const closeBtn = document.getElementById('partner-modal-close');
  const openBtn = document.getElementById('btn-open-partner-modal');
  const form = document.getElementById('partner-request-form');

  if (openBtn) openBtn.addEventListener('click', openPartnerModal);
  if (closeBtn) closeBtn.addEventListener('click', closePartnerModal);

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closePartnerModal();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newPost = {
        id: 'p_' + Date.now(),
        name: document.getElementById('req-name').value.trim(),
        mps: document.getElementById('req-mps').value.trim() || 'ACBL Member',
        bracket: document.getElementById('req-bracket').value,
        targetDate: document.getElementById('req-date').value.trim(),
        targetSession: document.getElementById('req-session').value.trim(),
        system: document.getElementById('req-system').value.trim() || 'Standard American / 2/1',
        notes: document.getElementById('req-notes').value.trim(),
        contact: document.getElementById('req-contact').value.trim(),
        postedAt: 'Just now'
      };

      partnershipPosts.unshift(newPost);
      localStorage.setItem('vbc_partnership_posts', JSON.stringify(partnershipPosts));

      renderPartnershipPosts(partnershipPosts);
      form.reset();
      closePartnerModal();
    });
  }
}

window.openPartnerModal = function() {
  const backdrop = document.getElementById('partner-modal-backdrop');
  if (backdrop) backdrop.classList.add('active');
};

window.closePartnerModal = function() {
  const backdrop = document.getElementById('partner-modal-backdrop');
  if (backdrop) backdrop.classList.remove('active');
};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}
