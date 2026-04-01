// ===================================================
// VALLEY CARE GROUP — Signature Interactive System
// Custom cursor · Magnetic buttons · 3D tilt cards
// Parallax · Welsh hills · Scroll-driven magic
// ===================================================

(function () {
  'use strict';

  // ---- Detect mobile ----
  const isMobile = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;

  // === Custom cursor elements removed — standard cursor is used ===
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (dot) dot.style.display = 'none';
  if (ring) ring.style.display = 'none';


  // ========================================================
  // 2. SCROLL PROGRESS BAR
  // ========================================================
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrollTop / docHeight) * 100, 100);
      progressBar.style.width = progress + '%';
    }, { passive: true });
  }

  // (Hero parallax and particles removed for a cleaner, standard experience)


  // (Magnetic buttons and 3D card tilt removed for a standard, accessible experience)


  // ========================================================
  // 7. SCROLL REVEAL — Enhanced with stagger
  // ========================================================
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Also reveal image masks
        const mask = entry.target.querySelector('.reveal-mask');
        if (mask) mask.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => revealObserver.observe(el));

  // Also observe reveal-mask elements
  const maskObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        maskObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal-mask').forEach(el => maskObserver.observe(el));

  // ========================================================
  // 8. COUNTER ANIMATION
  // ========================================================
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target) || 0;
    const duration = 2200;
    const start = performance.now();
    const isDecimal = String(target).includes('.');

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const value = eased * target;
      el.textContent = isDecimal ? value.toFixed(1) : Math.floor(value);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  let countersRan = false;
  const counterObserver = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting) && !countersRan) {
      countersRan = true;
      document.querySelectorAll('.count-num').forEach(el => animateCounter(el));
    }
  }, { threshold: 0.3 });

  const firstCounter = document.querySelector('.hero-sig-stats, .story-stats, .hero-stats');
  if (firstCounter) counterObserver.observe(firstCounter);

  // Fallback
  setTimeout(() => {
    if (!countersRan) {
      countersRan = true;
      document.querySelectorAll('.count-num').forEach(el => animateCounter(el));
    }
  }, 1500);

  // ========================================================
  // 9. MARQUEE SPEED CONTROL
  // ========================================================
  document.querySelectorAll('.marquee-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      row.style.animationPlayState = 'paused';
    });
    row.addEventListener('mouseleave', () => {
      row.style.animationPlayState = 'running';
    });
  });

  // ========================================================
  // 10. NAVBAR SCROLL BEHAVIOUR
  // ========================================================
  const navbar = document.getElementById('navbar');
  if (navbar) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;

      if (scrollY > 80) {
        navbar.classList.add('scrolled');
        navbar.classList.remove('transparent');
      } else {
        navbar.classList.remove('scrolled');
        navbar.classList.add('transparent');
      }

      // Hide on scroll down, show on scroll up (after 400px)
      if (scrollY > 400) {
        if (scrollY > lastScroll) {
          navbar.style.transform = 'translateY(-100%)';
        } else {
          navbar.style.transform = 'translateY(0)';
        }
      } else {
        navbar.style.transform = 'translateY(0)';
      }
      lastScroll = scrollY;
    }, { passive: true });
  }

  // ========================================================
  // 11. MOBILE NAV TOGGLE
  // ========================================================
  window.toggleMobileNav = function () {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    if (!hamburger || !mobileNav) return;
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  };

  // ========================================================
  // 12. ENQUIRY FORM SUBMIT
  // ========================================================
  window.submitEnquiry = function (e) {
    e.preventDefault();
    const toast = document.getElementById('toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 5500);
    }
    e.target.reset();
    // Scroll back up a bit to show hero
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // (Page opacity reveal removed — content shows immediately)


  // (Welsh hills parallax and bento card shine removed for a standard experience)


  // ========================================================
  // 16. ACCREDITATION ITEM ENTRANCE STAGGER
  // ========================================================
  const accredItems = document.querySelectorAll('.accred-sig-item');
  const accredObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        accredItems.forEach((item, i) => {
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          }, i * 80);
        });
        accredObserver.disconnect();
      }
    });
  }, { threshold: 0.2 });

  accredItems.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });

  const accredStrip = document.querySelector('.accred-sig-strip');
  if (accredStrip) accredObserver.observe(accredStrip);

  // ========================================================
  // 17. SECTION ACTIVE NAV HIGHLIGHTER
  // ========================================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === 'index.html' && id === 'hero') {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => sectionObserver.observe(s));

  // ========================================================
  // 18. GLASSMORPHISM INPUT FOCUS GLOW
  // ========================================================
  document.querySelectorAll('.glass-input, .glass-select, .glass-textarea').forEach(input => {
    input.addEventListener('focus', function () {
      this.parentElement.style.transform = 'scale(1.01)';
    });
    input.addEventListener('blur', function () {
      this.parentElement.style.transform = '';
    });
  });

  // (Hero title glow on scroll and testimonial hover tilt removed)


})();
