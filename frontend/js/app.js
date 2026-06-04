/* ============================================================
   MAIN APP  —  Navigation, animations, initialization
   ============================================================ */

import { initSpline } from './spline.js';
import { initAuth } from './auth.js';
import { initGallery } from './gallery.js';

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

// ── Scroll Reveal ──────────────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    observer.observe(el);
  });
}

// ── Mentor Gallery ─────────────────────────────────────────────
function initMentorGallery() {
  const images = document.querySelectorAll('.mentor-img');
  if (images.length === 0) return;
  
  let currentIndex = 0;
  setInterval(() => {
    // Remove active from current
    images[currentIndex].classList.remove('active');
    
    // Move to next
    currentIndex = (currentIndex + 1) % images.length;
    
    // Add active to next
    images[currentIndex].classList.add('active');
  }, 3000); // 3 seconds toggle
}

// ── Navbar Scroll Hide ──────────────────────────────────────────
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    // Always show at top
    if (currentScroll <= 0) {
      navbar.classList.remove('navbar--hidden');
      lastScroll = currentScroll;
      return;
    }
    
    // Scroll down -> hide
    if (currentScroll > lastScroll && currentScroll > 100) {
      navbar.classList.add('navbar--hidden');
    } 
    // Scroll up -> show
    else if (currentScroll < lastScroll) {
      navbar.classList.remove('navbar--hidden');
    }
    
    lastScroll = currentScroll;
  });
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
  initNavbarScroll();

  // Init text animations & mentors
  initScrollReveal();
  initMentorGallery();
  
  // Init Gallery SPA
  initGallery();

  console.log('[NSS-KIIT] App initialized');
});
