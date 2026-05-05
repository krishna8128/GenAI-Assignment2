/* ===========================
   SCALER ACADEMY CLONE - JS
   =========================== */

'use strict';

// ===========================
// NAVBAR SCROLL EFFECT
// ===========================
(function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


// ===========================
// MOBILE MENU TOGGLE
// ===========================
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  function openMenu() {
    hamburger.classList.add('open');
    navLinks.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    if (navLinks.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (
      navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMenu();
    }
  });

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      closeMenu();
    });
  });
})();


// ===========================
// DROPDOWN MENUS
// ===========================
(function initDropdowns() {
  const dropdowns = document.querySelectorAll('.nav-item.dropdown');

  dropdowns.forEach(function (item) {
    const btn  = item.querySelector('.nav-btn');
    const menu = item.querySelector('.dropdown-menu');
    if (!btn || !menu) return;

    // Toggle on button click
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = item.classList.contains('open');

      // Close all dropdowns first
      dropdowns.forEach(function (d) {
        d.classList.remove('open');
        d.querySelector('.nav-btn').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    // Hover behaviour on desktop
    item.addEventListener('mouseenter', function () {
      if (window.innerWidth >= 769) {
        dropdowns.forEach(function (d) {
          d.classList.remove('open');
          d.querySelector('.nav-btn').setAttribute('aria-expanded', 'false');
        });
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    item.addEventListener('mouseleave', function () {
      if (window.innerWidth >= 769) {
        item.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', function () {
    dropdowns.forEach(function (d) {
      d.classList.remove('open');
      const b = d.querySelector('.nav-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  });
})();


// ===========================
// SMOOTH SCROLL
// ===========================
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navHeight = document.getElementById('navbar')?.offsetHeight || 64;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


// ===========================
// ANIMATED COUNTERS
// ===========================
(function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  function formatNumber(val, target) {
    if (target >= 100000) {
      // Show as e.g. "700,000"
      return Math.floor(val).toLocaleString('en-IN');
    }
    return Math.floor(val).toString();
  }

  function animateCounter(el) {
    const target  = parseFloat(el.dataset.target);
    const suffix  = el.dataset.suffix || '';
    const duration = 2000; // ms
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      el.textContent = formatNumber(current, target) + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatNumber(target, target) + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  // Use IntersectionObserver to trigger when visible
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  counters.forEach(function (el) {
    observer.observe(el);
  });
})();


// ===========================
// HERO PROOF COUNTERS (special)
// ===========================
(function initHeroProof() {
  // The hero proof numbers use data-target but display differently
  // They are handled by the main counter system above.
  // This function adds the suffix spans dynamically.
  const proofItems = document.querySelectorAll('.proof-item');
  proofItems.forEach(function (item) {
    const numEl    = item.querySelector('.proof-number');
    const suffixEl = item.querySelector('.proof-suffix');
    if (!numEl) return;

    const target = numEl.dataset.target;
    if (!target) return;

    // Wrap number + suffix in a flex row
    if (suffixEl) {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'baseline';
      row.style.gap = '0';
      numEl.parentNode.insertBefore(row, numEl);
      row.appendChild(numEl);
      row.appendChild(suffixEl);
    }
  });
})();


// ===========================
// PROGRAM TABS
// ===========================
(function initTabs() {
  const tabBtns    = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  if (!tabBtns.length) return;

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const tabId = btn.dataset.tab;

      // Update buttons
      tabBtns.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update content panels
      tabContents.forEach(function (panel) {
        panel.classList.remove('active');
      });

      const target = document.getElementById('tab-' + tabId);
      if (target) {
        target.classList.add('active');

        // Re-trigger counter animations for newly visible counters
        target.querySelectorAll('[data-target]').forEach(function (el) {
          if (el.textContent === '0' || el.textContent === '') {
            // animate if not yet animated
          }
        });
      }
    });
  });
})();


// ===========================
// MARQUEE PAUSE ON HOVER
// ===========================
(function initMarqueePause() {
  const marqueeInner = document.querySelector('.marquee-inner');
  if (!marqueeInner) return;

  marqueeInner.addEventListener('mouseenter', function () {
    marqueeInner.style.animationPlayState = 'paused';
  });

  marqueeInner.addEventListener('mouseleave', function () {
    marqueeInner.style.animationPlayState = 'running';
  });
})();


// ===========================
// TESTIMONIAL CARDS — REVEAL ON SCROLL
// ===========================
(function initRevealOnScroll() {
  const cards = document.querySelectorAll(
    '.testimonial-card, .why-card, .instructor-card, .program-card, .stat-item'
  );
  if (!cards.length) return;

  // Add initial hidden state via inline style
  cards.forEach(function (card, i) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    card.style.transition =
      'opacity 0.5s ease ' + (i % 4) * 0.1 + 's, transform 0.5s ease ' + (i % 4) * 0.1 + 's';
  });

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  cards.forEach(function (card) {
    observer.observe(card);
  });
})();


// ===========================
// ACTIVE NAV LINK ON SCROLL
// ===========================
(function initActiveNavOnScroll() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link, .nav-btn');
  if (!sections.length) return;

  function onScroll() {
    const scrollY = window.scrollY + 80;
    let current = '';

    sections.forEach(function (section) {
      const top    = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        current = section.id;
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove('active-nav');
      const href = link.getAttribute('href') || '';
      if (href === '#' + current) {
        link.classList.add('active-nav');
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();


// ===========================
// HERO GRADIENT TEXT ANIMATION
// (already handled by CSS, but
//  we add a subtle particle canvas
//  effect for polish)
// ===========================
(function initHeroCanvas() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = [
    'position:absolute',
    'inset:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'z-index:0',
    'opacity:0.4'
  ].join(';');

  hero.style.position = 'relative';
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H, particles;
  const PARTICLE_COUNT = 40;
  const COLORS = ['#0055FF', '#06B6D4', '#B3D1FF'];

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }

  function createParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, function () {
      return {
        x:    Math.random() * W,
        y:    Math.random() * H,
        r:    Math.random() * 2 + 0.5,
        dx:   (Math.random() - 0.5) * 0.3,
        dy:   (Math.random() - 0.5) * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.5 + 0.1
      };
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  // Respect reduced-motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    resize();
    createParticles();
    draw();
    window.addEventListener('resize', function () {
      resize();
      createParticles();
    }, { passive: true });
  }
})();


// ===========================
// CTA BUTTON RIPPLE EFFECT
// ===========================
(function initRipple() {
  document.querySelectorAll('.btn-primary, .btn-outline').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      const rect   = btn.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const ripple = document.createElement('span');

      ripple.style.cssText = [
        'position:absolute',
        'border-radius:50%',
        'background:rgba(255,255,255,0.35)',
        'width:0',
        'height:0',
        'left:' + x + 'px',
        'top:' + y + 'px',
        'transform:translate(-50%,-50%)',
        'animation:ripple-anim 0.6s ease-out forwards',
        'pointer-events:none'
      ].join(';');

      // Ensure btn has relative positioning
      const pos = window.getComputedStyle(btn).position;
      if (pos === 'static') btn.style.position = 'relative';
      btn.style.overflow = 'hidden';

      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 700);
    });
  });

  // Inject ripple keyframes
  if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = '@keyframes ripple-anim { to { width:300px; height:300px; opacity:0; } }';
    document.head.appendChild(style);
  }
})();


// ===========================
// INIT LOG
// ===========================
console.log('%c Scaler Clone loaded ✓', 'color:#0055FF;font-weight:bold;font-size:14px;');
