// ============================================
// ARIT — Main Script
// ============================================

// --- Telegram Bot Config (from old site) ---
// --- Telegram Bot Config (loaded from config.js) ---
const TELEGRAM_BOT_TOKEN = typeof CONFIG !== 'undefined' ? CONFIG.TELEGRAM_BOT_TOKEN : '';
const TELEGRAM_CHAT_ID = typeof CONFIG !== 'undefined' ? CONFIG.TELEGRAM_CHAT_ID : '';

// ============================================
// Send form data to Telegram
// ============================================
async function sendToTelegram(name, phone, message) {
  const text = [
    '📝 <b>Новая заявка с сайта ARIT</b>',
    '',
    `👤 <b>Имя:</b> ${name}`,
    `📞 <b>Телефон:</b> ${phone}`,
    message ? `💬 <b>О проекте:</b> ${message}` : '',
  ].filter(Boolean).join('\n');

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('Telegram send error:', err);
    return false;
  }
}

// ============================================
// DOM Ready
// ============================================
document.addEventListener('DOMContentLoaded', () => {

  // ========== Navbar scroll ==========
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  // ========== Burger menu ==========
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ========== Smooth anchor scroll ==========
  // ========== Smooth anchor scroll (Disabled to use CSS) ==========
  // document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  //   anchor.addEventListener('click', (e) => {
  //     const targetId = anchor.getAttribute('href');
  //     if (targetId === '#') return;
  //     const target = document.querySelector(targetId);
  //     if (target) {
  //       e.preventDefault();
  //       const offset = navbar.offsetHeight + 220;
  //       const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
  //       window.scrollTo({ top, behavior: 'smooth' });
  //     }
  //   });
  // });

  // ========== Scroll fade-in animations ==========
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

  // ========== Animated counters ==========
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          if (isNaN(target)) return;

          // Preserve suffix (e.g. the "+" after "50")
          const suffix = el.textContent.replace(/\d/g, '').trim();
          animateCounter(el, 0, target, 1500, suffix);
          counterObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

  function animateCounter(el, start, end, duration, suffix) {
    const startTime = performance.now();
    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  // ========== FAQ accordion ==========
  document.querySelectorAll('.faq__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const answer = item.querySelector('.faq__answer');
      const isOpen = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq__item.active').forEach(openItem => {
        openItem.classList.remove('active');
        openItem.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
        openItem.querySelector('.faq__answer').style.maxHeight = '0';
      });

      // Open clicked (if wasn't open)
      if (!isOpen) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // ========== Phone mask ==========
  const phoneInput = document.getElementById('phoneInput');

  if (phoneInput) {
    function setCaretEnd(input) {
      if (input.setSelectionRange) {
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }

    phoneInput.addEventListener('focus', function () {
      if (!this.value) {
        this.value = '+7 (';
        setCaretEnd(this);
      }
    });

    phoneInput.addEventListener('input', function () {
      let digits = this.value.replace(/\D/g, '');
      if (digits.startsWith('7')) digits = digits.substring(1);
      digits = digits.substring(0, 10);

      let formatted = '+7';
      if (digits.length > 0) formatted += ' (' + digits.substring(0, 3);
      if (digits.length >= 3) formatted += ') ';
      if (digits.length >= 4) formatted += digits.substring(3, 6);
      if (digits.length >= 6) formatted += '-';
      if (digits.length >= 7) formatted += digits.substring(6, 8);
      if (digits.length >= 8) formatted += '-';
      if (digits.length >= 9) formatted += digits.substring(8, 10);

      this.value = formatted;
      setCaretEnd(this);
    });

    phoneInput.addEventListener('keydown', function (e) {
      if (this.selectionStart <= 3 && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
      }
    });
  }

  // ========== Contact form submission ==========
  const contactForm = document.getElementById('contactForm');
  const submitBtn = contactForm ? contactForm.querySelector('.btn-submit') : null;

  if (contactForm && submitBtn) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('nameInput').value.trim();
      const phone = phoneInput.value.trim();
      const message = document.getElementById('messageInput').value.trim();

      if (!name || !phone || phone.length < 18) {
        alert('Пожалуйста, заполните имя и телефон корректно.');
        return;
      }

      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Отправка...';
      submitBtn.disabled = true;

      const success = await sendToTelegram(name, phone, message);

      if (success) {
        alert('Спасибо! Заявка отправлена. Мы свяжемся с вами в течение часа.');
        contactForm.reset();
      } else {
        alert('Произошла ошибка. Попробуйте ещё раз или напишите нам в Telegram.');
      }

      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
  }

  // ========== Process timeline sequential animation ==========
  const processTimeline = document.getElementById('processTimeline');

  if (processTimeline) {
    const steps = processTimeline.querySelectorAll('.process__step');
    const connectors = processTimeline.querySelectorAll('.process__connector');
    let timers = [];
    let isAnimating = false;

    function resetTimeline() {
      steps.forEach(s => s.classList.remove('active'));
      connectors.forEach(c => {
        c.querySelectorAll('.dash').forEach(d => d.classList.remove('active'));
      });
    }

    function animateTimeline() {
      if (isAnimating) return;
      isAnimating = true;
      resetTimeline();

      // Build flat sequence: circle, dash1, dash2, ..., dash8, circle, dash1, ...
      const sequence = [];
      for (let i = 0; i < steps.length; i++) {
        sequence.push({ type: 'step', el: steps[i] });
        if (i < connectors.length) {
          const dashes = connectors[i].querySelectorAll('.dash');
          dashes.forEach(d => {
            sequence.push({ type: 'dash', el: d });
          });
        }
      }

      let delay = 0;
      const stepDuration = 1200; // circle stays lit
      const dashDuration = 300;  // each dash stays lit

      sequence.forEach(item => {
        const duration = item.type === 'step' ? stepDuration : dashDuration;

        // Turn ON
        timers.push(setTimeout(() => {
          item.el.classList.add('active');
        }, delay));

        // Turn OFF
        timers.push(setTimeout(() => {
          item.el.classList.remove('active');
        }, delay + duration));

        delay += duration;
      });

      // After full sequence, wait 1.5s, then replay
      timers.push(setTimeout(() => {
        isAnimating = false;
        animateTimeline();
      }, delay + 1500));
    }

    // Trigger when section comes into view
    const processObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateTimeline();
          } else {
            timers.forEach(t => clearTimeout(t));
            timers = [];
            isAnimating = false;
            resetTimeline();
          }
        });
      },
      { threshold: 0.3 }
    );

    processObserver.observe(processTimeline);
  }

  // ========== Performance: optimize after load ==========
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => document.body.classList.add('fonts-loaded'));
  }

  // Disable hover on touch devices
  if (window.matchMedia('(hover: none)').matches) {
    document.body.classList.add('no-hover');
  }
});
