/* ============================================================
   MAIN APP  —  Navigation, animations, initialization
   ============================================================ */

import { initSpline } from './spline.js';
import { initAuth } from './auth.js';

// ── Mobile Navigation ──────────────────────────────────────────
function initMobileNav() {
  const burger = document.querySelector('.nav-burger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (!burger || !mobileNav) return;

  burger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('open');

    if (isOpen) {
      mobileNav.classList.remove('open');
      burger.classList.remove('open');
    } else {
      mobileNav.classList.add('open');
      burger.classList.add('open');
    }
  });

  // Close on link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      burger.classList.remove('open');
    });
  });
}

// ── Smooth Scroll ──────────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ── Staggered Text Reveal ──────────────────────────────────────
function initTextReveal() {
  // The hero text elements have CSS animations with delays.
  // This ensures they only play once the scene starts loading.
  const heroTitle = document.querySelector('.hero-title');
  const heroQuotes = document.querySelector('.hero-quotes');

  if (heroTitle) {
    heroTitle.style.animationPlayState = 'running';
  }
  if (heroQuotes) {
    heroQuotes.style.animationPlayState = 'running';
  }
}

// ── Nav Active Link ────────────────────────────────────────────
function initActiveLink() {
  const links = document.querySelectorAll('.nav-links a');
  const currentPage = window.location.pathname;

  links.forEach(link => {
    if (link.getAttribute('href') === currentPage || 
        (currentPage === '/' && link.getAttribute('href') === '#home')) {
      link.style.opacity = '1';
    }
  });
}

// ── Init Everything ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Init Spline 3D scene
  initSpline();

  // Init authentication
  initAuth();

  // Init navigation
  initMobileNav();
  initSmoothScroll();
  initActiveLink();

  // Init text animations
  initTextReveal();

  console.log('[NSS-KIIT] App initialized');
});
