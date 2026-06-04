/* ============================================================
   GALLERY MODULE  —  SPA Logic for Schools and Events
   ============================================================ */

import { getCurrentUser, getAccessToken } from './auth.js';

const API_BASE = 'http://localhost:5000/api';

// ── DOM References ─────────────────────────────────────────────
const views = {
  home: document.getElementById('scroller'),
  gallery: document.getElementById('gallery-view'),
  unitDetail: document.getElementById('unit-detail-view'),
  about: document.getElementById('about-view')
};

const navLinks = {
  home: document.getElementById('link-home'),
  gallery: document.getElementById('link-gallery'),
  about: document.getElementById('link-about'),
  contact: document.getElementById('link-contact')
};

const mobileNavLinks = document.querySelectorAll('.mobile-nav a');

const galleryGrid = document.getElementById('gallery-grid');
const unitTitle = document.getElementById('unit-title');
const eventsList = document.getElementById('events-list');
const unitAdminActions = document.getElementById('unit-admin-actions');
const backBtn = document.getElementById('gallery-back-btn');

const eventModal = document.getElementById('event-modal');
const eventModalCloseBtn = document.getElementById('event-modal-close-btn');
const eventForm = document.getElementById('event-form');
const eventFormMessage = document.getElementById('event-form-message');
const eventSubmitBtn = document.getElementById('event-submit');

let currentUnitId = null;

// ── View Transitions ───────────────────────────────────────────
function switchView(viewName) {
  // Hide all
  Object.values(views).forEach(view => {
    if (view) {
      view.classList.remove('view-active');
      view.classList.add('view-hidden');
    }
  });

  // Show target
  if (views[viewName]) {
    views[viewName].classList.remove('view-hidden');
    views[viewName].classList.add('view-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Active state for main nav
  Object.values(navLinks).forEach(link => {
    if (link) link.style.opacity = '0.7';
  });
  if (navLinks[viewName]) {
    navLinks[viewName].style.opacity = '1';
  }
}

// ── Data Fetching & Rendering (Units) ──────────────────────────
async function loadUnits() {
  try {
    const res = await fetch(`${API_BASE}/units`);
    const data = await res.json();
    if (data.success) {
      renderUnits(data.units);
    }
  } catch (err) {
    console.error('Error fetching units:', err);
    galleryGrid.innerHTML = '<p>Failed to load units.</p>';
  }
}

function renderUnits(units) {
  galleryGrid.innerHTML = '';
  
  const user = getCurrentUser();
  
  // Sort: Put admin's unit first if they are logged in and assigned a unit
  let sortedUnits = [...units];
  if (user && user.unit) {
    const userUnitIndex = sortedUnits.findIndex(u => u._id === user.unit || u._id === user.unit._id);
    if (userUnitIndex > -1) {
      const userUnit = sortedUnits.splice(userUnitIndex, 1)[0];
      sortedUnits.unshift(userUnit);
    }
  }

  sortedUnits.forEach(unit => {
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.innerHTML = `
      <h3>${unit.name}</h3>
      <span class="read-more">
        View Events
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.2rem;height:1.2rem;">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </span>
    `;
    card.addEventListener('click', () => openUnitGallery(unit));
    galleryGrid.appendChild(card);
  });
}

// ── Data Fetching & Rendering (Events) ─────────────────────────
async function openUnitGallery(unit) {
  currentUnitId = unit._id;
  unitTitle.textContent = unit.name;
  unitAdminActions.innerHTML = '';
  eventsList.innerHTML = '<p>Loading events...</p>';
  
  switchView('unitDetail');

  // Check if admin is allowed to add events here
  const user = getCurrentUser();
  if (user && (user.role === 'superadmin' || user.unit === unit._id || user.unit?._id === unit._id)) {
    const btn = document.createElement('button');
    btn.className = 'btn-admin-action';
    btn.textContent = 'Add Event / Photos';
    btn.onclick = openEventModal;
    unitAdminActions.appendChild(btn);
  }

  await loadEvents(unit._id);
}

async function loadEvents(unitId) {
  try {
    const res = await fetch(`${API_BASE}/events?unit=${unitId}`);
    const data = await res.json();
    
    if (data.success) {
      renderEvents(data.events);
    }
  } catch (err) {
    eventsList.innerHTML = '<p>Failed to load events.</p>';
  }
}

function renderEvents(events) {
  if (!events || events.length === 0) {
    eventsList.innerHTML = '<p style="font-size: 1.5rem; color: var(--color-text-light);">No events posted yet.</p>';
    return;
  }

  eventsList.innerHTML = '';
  events.forEach(event => {
    const dateStr = new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    
    let photosHtml = '';
    if (event.photos && event.photos.length > 0) {
      photosHtml = '<div class="event-photos">';
      event.photos.forEach(photo => {
        photosHtml += `<img src="${photo.url}" alt="${photo.caption || event.title}" class="event-photo" loading="lazy" />`;
      });
      photosHtml += '</div>';
    }

    const eventEl = document.createElement('div');
    eventEl.className = 'event-item';
    eventEl.innerHTML = `
      <div class="event-date">${dateStr}</div>
      <h3 class="event-title">${event.title}</h3>
      <p class="event-summary">${event.summary}</p>
      ${photosHtml}
    `;
    eventsList.appendChild(eventEl);
  });
}

// ── Event Modal Controls ───────────────────────────────────────
function openEventModal() {
  eventModal.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeEventModal() {
  eventModal.classList.remove('open');
  document.body.classList.remove('modal-open');
  eventForm.reset();
  eventFormMessage.className = 'form-message';
  eventFormMessage.textContent = '';
}

async function handleEventSubmit(e) {
  e.preventDefault();
  
  if (!currentUnitId) return;

  const formData = new FormData(eventForm);
  formData.append('unit', currentUnitId);

  eventSubmitBtn.classList.add('loading');
  eventFormMessage.className = 'form-message';
  eventFormMessage.textContent = '';

  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: formData // Browser sets multipart/form-data boundary automatically
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create event');
    }

    eventFormMessage.className = 'form-message success';
    eventFormMessage.textContent = 'Event successfully published!';
    
    // Refresh events and close modal
    setTimeout(() => {
      closeEventModal();
      loadEvents(currentUnitId);
    }, 1500);

  } catch (err) {
    eventFormMessage.className = 'form-message error';
    eventFormMessage.textContent = err.message;
  } finally {
    eventSubmitBtn.classList.remove('loading');
  }
}

// ── Initialization ─────────────────────────────────────────────
function initGallery() {
  // Desktop Nav Click
  if (navLinks.gallery) {
    navLinks.gallery.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('gallery');
      loadUnits(); // Load units fresh each time
    });
  }

  if (navLinks.home) {
    navLinks.home.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('home');
    });
  }

  if (navLinks.about) {
    navLinks.about.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('about');
    });
  }

  // Mobile Nav Click
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#gallery') {
        e.preventDefault();
        switchView('gallery');
        loadUnits();
      } else if (href === '#home') {
        e.preventDefault();
        switchView('home');
      } else if (href === '#about') {
        e.preventDefault();
        switchView('about');
      }
    });
  });

  // Back Button
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      switchView('gallery');
    });
  }

  // Event Modal Bindings
  if (eventModalCloseBtn) {
    eventModalCloseBtn.addEventListener('click', closeEventModal);
  }
  if (eventForm) {
    eventForm.addEventListener('submit', handleEventSubmit);
  }

  // React to login/logout dynamically
  window.addEventListener('authChange', () => {
    if (views.gallery && views.gallery.classList.contains('view-active')) {
      loadUnits();
    }
    // Also kick them out of the unit detail if they log out? 
    // It's fine to leave them on the page, the button will just disappear next time it's opened.
  });
}

export { initGallery, loadUnits };
