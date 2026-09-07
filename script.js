/* ============================================
   SPARTAN COMPANY — Interactive Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ========== HEADER SCROLL EFFECT ==========
  const header = document.getElementById('header');
  let lastScroll = 0;

  function handleHeaderScroll() {
    const currentScroll = window.scrollY;
    if (currentScroll > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });

  // ========== ACTIVE NAV LINK ==========
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

  function updateActiveNav() {
    const scrollPos = window.scrollY + 200;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // ========== MOBILE MENU ==========
  const menuToggle = document.getElementById('menu-toggle');
  const navLinksContainer = document.getElementById('nav-links');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinksContainer.classList.toggle('open');
    document.body.style.overflow = navLinksContainer.classList.contains('open') ? 'hidden' : '';
  });

  // Close mobile menu on link click
  navLinksContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinksContainer.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ========== DEVIS TABS + MULTI-STEP FORM ==========
  const tabs = document.querySelectorAll('.devis-tab');
  const devisForm = document.getElementById('devis-form');
  const formPages = document.querySelectorAll('.form-page');
  const formSteps = document.querySelectorAll('.form-step');
  const formStepLines = document.querySelectorAll('.form-step-line');
  const formSuccess = document.getElementById('form-success');
  const formError = document.getElementById('form-error');
  let currentStep = 1;

  // Tab switching — updates hidden client type field
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update hidden fields based on tab
      const subjectField = document.getElementById('form-subject');
      const clientTypeField = document.getElementById('form-client-type');
      if (target === 'particulier') {
        subjectField.value = 'Nouveau devis déménagement — Particulier';
        clientTypeField.value = 'Particulier';
      } else {
        subjectField.value = 'Nouveau devis déménagement — Professionnel';
        clientTypeField.value = 'Professionnel';
      }
    });
  });

  // Navigate to step
  function goToStep(step) {
    // Validate current step before going forward
    if (step > currentStep) {
      const currentPage = document.getElementById(`step-${currentStep}`);
      const requiredFields = currentPage.querySelectorAll('input[required], textarea[required]');
      let valid = true;

      requiredFields.forEach(field => {
        if (field.type === 'radio') {
          const radioGroup = currentPage.querySelectorAll(`input[name="${field.name}"]`);
          const checked = Array.from(radioGroup).some(r => r.checked);
          if (!checked) {
            valid = false;
            // Highlight the radio group
            field.closest('.form-radio-group')?.classList.add('error');
          }
        } else if (!field.value.trim()) {
          valid = false;
          field.classList.add('error');
        } else {
          field.classList.remove('error');
        }
      });

      if (!valid) {
        // Shake animation
        const currentPage2 = document.getElementById(`step-${currentStep}`);
        currentPage2.style.animation = 'none';
        currentPage2.offsetHeight; // trigger reflow
        currentPage2.style.animation = 'shake 0.4s ease';
        return;
      }
    }

    currentStep = step;

    // Update pages
    formPages.forEach(page => page.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');

    // Update step indicators
    formSteps.forEach((s, i) => {
      const stepNum = parseInt(s.dataset.step);
      s.classList.remove('active', 'completed');
      if (stepNum === step) s.classList.add('active');
      if (stepNum < step) s.classList.add('completed');
    });

    // Update step lines
    formStepLines.forEach((line, i) => {
      if (i < step - 1) {
        line.classList.add('completed');
      } else {
        line.classList.remove('completed');
      }
    });

    // Update replyto field with email
    const emailField = document.getElementById('field-email');
    if (emailField && emailField.value) {
      document.getElementById('form-replyto').value = emailField.value;
    }

    // Scroll to form top
    const devisSection = document.getElementById('devis');
    if (devisSection) {
      const offset = devisSection.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }

  // Clear error on input
  document.querySelectorAll('.devis-form input, .devis-form textarea').forEach(field => {
    field.addEventListener('input', () => field.classList.remove('error'));
  });

  // Next/Prev buttons
  document.querySelectorAll('.form-next').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.next)));
  });
  document.querySelectorAll('.form-prev').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.prev)));
  });

  // Form submission via Web3Forms API + Google Calendar
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwhzac-SAfUujmrXQ4u9ZlAgXRCvHScdNpfl7Ga0lg4nvZ8qSmxvKWmvfd3ooAPpiep/exec';

  if (devisForm) {
    devisForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('form-submit-btn');
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        const formData = new FormData(devisForm);

        // 1) Send email via Web3Forms
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          // 2) Create Google Calendar event (fire & forget — don't block success)
          try {
            const calendarData = {
              nom: document.getElementById('field-nom').value,
              prenom: document.getElementById('field-prenom').value,
              email: document.getElementById('field-email').value,
              telephone: document.getElementById('field-telephone').value,
              profil: devisForm.querySelector('input[name="Profil"]:checked')?.value || '',
              type: document.getElementById('form-client-type').value,
              adresseDepart: document.getElementById('field-depart-adresse').value,
              cpDepart: document.getElementById('field-depart-cp').value,
              villeDepart: document.getElementById('field-depart-ville').value,
              paysDepart: document.getElementById('field-depart-pays').value,
              etageDepart: document.getElementById('field-depart-etage').value,
              ascenseurDepart: devisForm.querySelector('input[name="Ascenseur départ"]:checked')?.value || '',
              adresseArrivee: document.getElementById('field-arrivee-adresse').value,
              cpArrivee: document.getElementById('field-arrivee-cp').value,
              villeArrivee: document.getElementById('field-arrivee-ville').value,
              paysArrivee: document.getElementById('field-arrivee-pays').value,
              etageArrivee: document.getElementById('field-arrivee-etage').value,
              ascenseurArrivee: devisForm.querySelector('input[name="Ascenseur arrivée"]:checked')?.value || '',
              date: document.getElementById('field-date').value,
              logement: document.getElementById('field-logement').value,
              volume: document.getElementById('field-volume').value,
              infos: document.getElementById('field-info').value
            };

            const params = new URLSearchParams({
              nom: calendarData.nom,
              prenom: calendarData.prenom,
              email: calendarData.email,
              telephone: calendarData.telephone,
              profil: calendarData.profil,
              type: calendarData.type,
              adresseDepart: calendarData.adresseDepart,
              cpDepart: calendarData.cpDepart,
              villeDepart: calendarData.villeDepart,
              paysDepart: calendarData.paysDepart,
              etageDepart: calendarData.etageDepart,
              ascenseurDepart: calendarData.ascenseurDepart,
              adresseArrivee: calendarData.adresseArrivee,
              cpArrivee: calendarData.cpArrivee,
              villeArrivee: calendarData.villeArrivee,
              paysArrivee: calendarData.paysArrivee,
              etageArrivee: calendarData.etageArrivee,
              ascenseurArrivee: calendarData.ascenseurArrivee,
              date: calendarData.date,
              logement: calendarData.logement,
              volume: calendarData.volume,
              infos: calendarData.infos
            });

            fetch(GOOGLE_SCRIPT_URL + '?' + params.toString(), {
              method: 'GET',
              mode: 'no-cors'
            });
          } catch (calErr) {
            // Calendar error doesn't block the user — email was sent successfully
            console.warn('Calendar event creation failed:', calErr);
          }

          // Show success
          formPages.forEach(p => p.classList.remove('active'));
          formSuccess.style.display = 'block';
          formError.style.display = 'none';
          // Mark all steps as completed
          formSteps.forEach(s => { s.classList.remove('active'); s.classList.add('completed'); });
          formStepLines.forEach(l => l.classList.add('completed'));
        } else {
          formPages.forEach(p => p.classList.remove('active'));
          formError.style.display = 'block';
          formSuccess.style.display = 'none';
          document.getElementById('form-error-message').textContent = 
            result.message || 'Veuillez réessayer ou nous contacter directement par email.';
        }
      } catch (err) {
        formPages.forEach(p => p.classList.remove('active'));
        formError.style.display = 'block';
        formSuccess.style.display = 'none';
      } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    });
  }

  // Reset form button
  const resetBtn = document.getElementById('form-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      devisForm.reset();
      formSuccess.style.display = 'none';
      formError.style.display = 'none';
      currentStep = 1;
      goToStep(1);
    });
  }

  // Retry button
  const retryBtn = document.getElementById('form-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      formError.style.display = 'none';
      goToStep(4);
    });
  }

  // ========== SCROLL REVEAL (Intersection Observer) ==========
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ========== ANIMATED COUNTERS ==========
  const statNumbers = document.querySelectorAll('.stat-number');
  let countersAnimated = false;

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersAnimated) {
        countersAnimated = true;
        animateCounters();
      }
    });
  }, { threshold: 0.3 });

  if (statNumbers.length > 0) {
    counterObserver.observe(statNumbers[0].closest('.stats-grid'));
  }

  function animateCounters() {
    statNumbers.forEach(counter => {
      const target = parseInt(counter.dataset.target);
      const suffix = counter.dataset.suffix || '';
      const duration = 2000;
      const start = performance.now();

      function updateCounter(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        counter.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      }

      requestAnimationFrame(updateCounter);
    });
  }

  // ========== HERO PARTICLES (Canvas) ==========
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resizeCanvas() {
      const hero = canvas.closest('.hero');
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(Math.floor(canvas.width * canvas.height / 12000), 80);

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2.5 + 0.5,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: (Math.random() - 0.5) * 0.3 - 0.15,
          opacity: Math.random() * 0.5 + 0.1,
          opacitySpeed: (Math.random() - 0.5) * 0.005,
          hue: 38 + Math.random() * 15
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        // Update position
        p.x += p.speedX;
        p.y += p.speedY;

        // Update opacity
        p.opacity += p.opacitySpeed;
        if (p.opacity <= 0.05 || p.opacity >= 0.6) {
          p.opacitySpeed *= -1;
        }

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 65%, 55%, ${p.opacity})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 65%, 55%, ${p.opacity * 0.15})`;
        ctx.fill();
      });

      // Draw subtle connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(38, 65%, 55%, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(drawParticles);
    }

    resizeCanvas();
    createParticles();
    drawParticles();

    // Debounced resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
        createParticles();
      }, 250);
    });

    // Pause when out of viewport
    const heroObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (!animationId) drawParticles();
      } else {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }, { threshold: 0 });

    heroObserver.observe(canvas.closest('.hero'));
  }

  // ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ========== COPYRIGHT YEAR (auto) ==========
  const yearEl = document.getElementById('copyright-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ========== CAROUSEL ==========
  document.querySelectorAll('.carousel').forEach((carousel) => {
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.carousel-dot');
    const prev = carousel.querySelector('.carousel-prev');
    const next = carousel.querySelector('.carousel-next');
    const progress = carousel.querySelector('.carousel-progress');
    if (!track || slides.length < 2) return;

    const delay = parseInt(carousel.dataset.autoplay || '5000', 10);
    let current = 0;
    let timer = null;

    function render() {
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function goTo(i) {
      current = (i + slides.length) % slides.length;
      render();
      restart();
    }

    function tickProgress() {
      if (!progress) return;
      progress.style.transition = 'none';
      progress.style.width = '0%';
      // Force reflow so the transition restarts
      void progress.offsetWidth;
      progress.style.transition = `width ${delay}ms linear`;
      progress.style.width = '100%';
    }

    function restart() {
      if (timer) clearTimeout(timer);
      tickProgress();
      timer = setTimeout(() => goTo(current + 1), delay);
    }

    function pause() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (progress) {
        const w = progress.getBoundingClientRect().width;
        progress.style.transition = 'none';
        progress.style.width = w + 'px';
      }
    }

    prev && prev.addEventListener('click', () => goTo(current - 1));
    next && next.addEventListener('click', () => goTo(current + 1));
    dots.forEach((dot) => {
      dot.addEventListener('click', () => goTo(parseInt(dot.dataset.slide, 10)));
    });

    carousel.addEventListener('mouseenter', pause);
    carousel.addEventListener('mouseleave', restart);

    render();
    restart();
  });

  // ========== FLOATING BROCHURE — Hide near footer ==========
  const floatingBrochure = document.getElementById('floating-brochure');
  const footer = document.querySelector('.footer');

  if (floatingBrochure && footer) {
    window.addEventListener('scroll', () => {
      const footerRect = footer.getBoundingClientRect();
      if (footerRect.top < window.innerHeight) {
        floatingBrochure.style.opacity = '0';
        floatingBrochure.style.pointerEvents = 'none';
      } else {
        floatingBrochure.style.opacity = '1';
        floatingBrochure.style.pointerEvents = 'auto';
      }
    }, { passive: true });
  }

});
