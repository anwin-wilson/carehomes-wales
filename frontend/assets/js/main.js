// ================================
// VALLEY CARE GROUP — Main JS
// ================================

document.addEventListener('DOMContentLoaded', function () {

  // ---- Navbar scroll behaviour ----
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
        navbar.classList.remove('transparent');
      } else {
        navbar.classList.remove('scrolled');
        navbar.classList.add('transparent');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // ---- Hero bg pan effect ----
  const heroBg = document.getElementById('hero-bg');
  if (heroBg) {
    setTimeout(() => heroBg.classList.add('loaded'), 100);
  }

  // ---- Particles ----
  const particleContainer = document.getElementById('particles');
  if (particleContainer) {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'hero-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px';
      p.style.animationDuration = (Math.random() * 12 + 8) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.opacity = Math.random() * 0.6;
      particleContainer.appendChild(p);
    }
  }

  // ---- Counter animation ----
  function animateCounters() {
    document.querySelectorAll('.count-num').forEach(el => {
      const target = parseFloat(el.dataset.target);
      const duration = 2000;
      const isDecimal = String(target).includes('.');
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = ease * target;
        el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // ---- Intersection Observer for scroll animations ----
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

  // ---- Counter observer ----
  let countersTriggered = false;
  const counterSection = document.querySelector('.hero-stats');
  if (counterSection) {
    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countersTriggered) {
          countersTriggered = true;
          animateCounters();
          counterObs.unobserve(counterSection);
        }
      });
    }, { threshold: 0.3 });
    counterObs.observe(counterSection);
    // Trigger on load if already visible
    setTimeout(() => { if (!countersTriggered) animateCounters(); }, 1200);
  }

  // ---- Mobile nav ----
  window.toggleMobileNav = function () {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    if (!hamburger || !mobileNav) return;
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  };

  // ---- Enquiry form submission ----
  window.submitEnquiry = function (e) {
    e.preventDefault();
    const toast = document.getElementById('toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 5000);
    }
    e.target.reset();
  };

  // ---- Tab system ----
  window.switchTab = function (tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    const activeBtn = document.querySelector('[data-tab="' + tabId + '"]');
    const activePanel = document.getElementById('tab-' + tabId);
    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.add('active');
  };

  // ---- Active nav link highlighting ----
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPage || href.endsWith(currentPage))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // ---- Smooth reveal on load ----
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity = '1';
  });

  // ---- Job application form ----
  window.submitJobApplication = function (e) {
    e.preventDefault();
    const toast = document.getElementById('toast');
    if (toast) {
      toast.querySelector('.toast-title').textContent = 'Application Received!';
      toast.querySelector('.toast-msg').textContent = 'Thank you for applying. Our HR team will review your application and be in touch soon.';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 5500);
    }
    e.target.reset();
  };

});
