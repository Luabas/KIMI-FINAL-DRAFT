/* Shared booking modal — injected into every page.
   Themed to match the cream / Playfair Display aesthetic. */
(function () {
  // ─── Inject styles once ───────────────────────────────────────────────
  const css = `
    .booking-backdrop {
      position: fixed; inset: 0; z-index: 200;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      background: rgba(26, 22, 18, 0.45);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      opacity: 0; pointer-events: none;
      transition: opacity 0.45s ease;
    }
    .booking-backdrop.open { opacity: 1; pointer-events: auto; }

    .booking-modal {
      position: relative;
      width: 100%; max-width: 520px;
      max-height: calc(100vh - 48px); overflow-y: auto;
      background: #f4f0e8;
      border: 1px solid rgba(26,26,26,0.1);
      border-radius: 8px;
      padding: 48px 44px 40px;
      box-sizing: border-box;
      transform: translateY(24px) scale(0.98);
      opacity: 0;
      transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease;
      font-family: 'Inter', sans-serif;
      color: #1a1a1a;
    }
    .booking-backdrop.open .booking-modal { transform: translateY(0) scale(1); opacity: 1; }

    .booking-modal .bk-close {
      position: absolute; top: 18px; right: 18px;
      width: 34px; height: 34px; border: none; background: none;
      cursor: pointer; opacity: 0.5; transition: opacity 0.3s;
      display: flex; align-items: center; justify-content: center;
    }
    .booking-modal .bk-close:hover { opacity: 1; }
    .booking-modal .bk-close::before,
    .booking-modal .bk-close::after {
      content: ''; position: absolute; width: 17px; height: 1.5px;
      background: #1a1a1a; border-radius: 2px;
    }
    .booking-modal .bk-close::before { transform: rotate(45deg); }
    .booking-modal .bk-close::after { transform: rotate(-45deg); }

    .booking-modal .bk-eyebrow {
      font-size: 11px; font-weight: 500; letter-spacing: 4px;
      text-transform: uppercase; opacity: 0.5; margin-bottom: 14px;
    }
    .booking-modal h2 {
      font-family: 'Playfair Display', serif;
      font-size: 30px; font-weight: 400; line-height: 1.2;
      margin: 0 0 12px;
    }
    .booking-modal .bk-sub {
      font-size: 14px; font-weight: 300; line-height: 1.7;
      opacity: 0.6; margin-bottom: 30px;
    }

    .booking-modal .bk-field { margin-bottom: 18px; }
    .booking-modal label {
      display: block; font-size: 11px; letter-spacing: 1.5px;
      text-transform: uppercase; opacity: 0.55; margin-bottom: 8px;
    }
    .booking-modal input,
    .booking-modal select,
    .booking-modal textarea {
      width: 100%; box-sizing: border-box;
      font-family: 'Inter', sans-serif; font-size: 14px; color: #1a1a1a;
      background: #fbf8f2;
      border: 1px solid rgba(26,26,26,0.15);
      border-radius: 4px; padding: 12px 14px;
      transition: border-color 0.3s, background 0.3s;
    }
    .booking-modal textarea { resize: vertical; min-height: 84px; }
    .booking-modal input:focus,
    .booking-modal select:focus,
    .booking-modal textarea:focus {
      outline: none; border-color: rgba(26,26,26,0.55); background: #fff;
    }
    .booking-modal input.bk-invalid,
    .booking-modal select.bk-invalid {
      border-color: #b5512f; background: #fbeeea;
    }
    .booking-modal .bk-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
    }

    .booking-modal .bk-submit {
      width: 100%; margin-top: 10px;
      font-size: 12px; font-weight: 600; letter-spacing: 1.5px;
      text-transform: uppercase; color: #f0ece4; background: #1a1a1a;
      border: 1px solid #1a1a1a; border-radius: 2px; padding: 15px;
      cursor: pointer; transition: opacity 0.3s;
    }
    .booking-modal .bk-submit:hover { opacity: 0.85; }
    .booking-modal .bk-note {
      text-align: center; font-size: 12px; opacity: 0.45;
      margin-top: 16px; line-height: 1.6;
    }

    /* Success state */
    .booking-modal .bk-success {
      text-align: center; padding: 16px 4px 8px;
    }
    .booking-modal .bk-success .bk-check {
      width: 60px; height: 60px; border-radius: 50%;
      border: 1.5px solid #1a1a1a; opacity: 0.85;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 26px;
    }
    .booking-modal .bk-success .bk-check svg { width: 26px; height: 26px; }
    .booking-modal .bk-success h2 { margin-bottom: 14px; }
    .booking-modal .bk-success p {
      font-size: 14px; font-weight: 300; line-height: 1.8;
      opacity: 0.65; max-width: 36ch; margin: 0 auto 28px;
    }
    .booking-modal .bk-success button {
      font-size: 12px; font-weight: 600; letter-spacing: 1.5px;
      text-transform: uppercase; color: #1a1a1a; background: none;
      border: 1px solid currentColor; border-radius: 2px;
      padding: 13px 30px; cursor: pointer; transition: background 0.3s, color 0.3s;
    }
    .booking-modal .bk-success button:hover { background: #1a1a1a; color: #f0ece4; }

    /* Dark theme variant (galaxy section) */
    .booking-backdrop.bk-dark .booking-modal {
      background: #14141f; border-color: rgba(200,200,255,0.18); color: #e6e6f2;
    }
    .booking-backdrop.bk-dark .booking-modal h2,
    .booking-backdrop.bk-dark .booking-modal .bk-success .bk-check { color: #f0f0fa; }
    .booking-backdrop.bk-dark .booking-modal .bk-close::before,
    .booking-backdrop.bk-dark .booking-modal .bk-close::after { background: #e6e6f2; }
    .booking-backdrop.bk-dark .booking-modal input,
    .booking-backdrop.bk-dark .booking-modal select,
    .booking-backdrop.bk-dark .booking-modal textarea {
      background: #1d1d2b; color: #e6e6f2; border-color: rgba(200,200,255,0.2);
    }
    .booking-backdrop.bk-dark .booking-modal input:focus,
    .booking-backdrop.bk-dark .booking-modal select:focus,
    .booking-backdrop.bk-dark .booking-modal textarea:focus {
      border-color: rgba(200,200,255,0.6); background: #23233480;
    }
    .booking-backdrop.bk-dark .booking-modal .bk-submit {
      background: #e6e6f2; color: #14141f; border-color: #e6e6f2;
    }
    .booking-backdrop.bk-dark .booking-modal .bk-success button { color: #e6e6f2; }
    .booking-backdrop.bk-dark .booking-modal .bk-success button:hover {
      background: #e6e6f2; color: #14141f;
    }

    @media (max-width: 560px) {
      .booking-modal { padding: 40px 26px 32px; }
      .booking-modal .bk-row { grid-template-columns: 1fr; }
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ─── Build modal markup ───────────────────────────────────────────────
  const backdrop = document.createElement('div');
  backdrop.className = 'booking-backdrop';
  backdrop.id = 'booking-backdrop';
  backdrop.innerHTML = `
    <div class="booking-modal" role="dialog" aria-modal="true" aria-labelledby="bk-title">
      <button class="bk-close" id="bk-close" aria-label="Close"></button>

      <div class="bk-form-view">
        <div class="bk-eyebrow">Book Now</div>
        <h2 id="bk-title">Begin a conversation.</h2>
        <p class="bk-sub">Tell us a little about where you are. We'll reach out to find a time for a complimentary discovery conversation — no commitment, just a beginning.</p>

        <form id="bk-form" novalidate>
          <div class="bk-row">
            <div class="bk-field">
              <label for="bk-name">Name</label>
              <input type="text" id="bk-name" name="name" autocomplete="name" required>
            </div>
            <div class="bk-field">
              <label for="bk-email">Email</label>
              <input type="email" id="bk-email" name="email" autocomplete="email" required>
            </div>
          </div>

          <div class="bk-field">
            <label for="bk-interest">I'm interested in</label>
            <select id="bk-interest" name="interest" required>
              <option value="" disabled selected>Select a path…</option>
              <option>A discovery conversation</option>
              <option>Foundation — The Inward Audit</option>
              <option>Core Journey — Liberate &amp; Integrate</option>
              <option>Deep Accompaniment</option>
              <option>Not sure yet</option>
            </select>
          </div>

          <div class="bk-field">
            <label for="bk-message">What's bringing you here? (optional)</label>
            <textarea id="bk-message" name="message" placeholder="Share as much or as little as you'd like…"></textarea>
          </div>

          <button type="submit" class="bk-submit">Request my conversation</button>
          <div class="bk-note">We hold what you share in confidence. You'll hear back within two days.</div>
        </form>
      </div>

      <div class="bk-success" id="bk-success" style="display:none;">
        <div class="bk-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12.5l4 4 10-10"/>
          </svg>
        </div>
        <h2>Thank you — this is a beginning.</h2>
        <p>Your request has arrived. We'll reach out personally within two days to find a time that feels right.</p>
        <button id="bk-done">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const modalEl = backdrop.querySelector('.booking-modal');
  const formView = backdrop.querySelector('.bk-form-view');
  const successView = backdrop.querySelector('#bk-success');
  const form = backdrop.querySelector('#bk-form');
  let lastFocused = null;

  // ─── Open / close ─────────────────────────────────────────────────────
  function isGalaxyActive() {
    // On the ALIIA Method page the body scrolls through sections; the dark
    // galaxy section is the last one. Detect it the same way the nav does.
    const vh = window.innerHeight;
    const section = Math.round(window.scrollY / vh);
    const galaxy = document.querySelector('.section-galaxy');
    return galaxy ? section >= 5 : false;
  }

  function openBooking() {
    lastFocused = document.activeElement;
    backdrop.classList.toggle('bk-dark', isGalaxyActive());
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => backdrop.querySelector('#bk-name')?.focus(), 320);
  }

  function closeBooking() {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      formView.style.display = '';
      successView.style.display = 'none';
      form.reset();
      form.querySelectorAll('.bk-invalid').forEach((el) => el.classList.remove('bk-invalid'));
    }, 450);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  // ─── Wire up every Book Now trigger ───────────────────────────────────
  function bindTriggers() {
    document.querySelectorAll('.book-btn, [data-book]').forEach((el) => {
      if (el.dataset.bkBound) return;
      el.dataset.bkBound = '1';
      el.addEventListener('click', (e) => { e.preventDefault(); openBooking(); });
    });
    // Also catch CTA links labeled like booking buttons
    document.querySelectorAll('a').forEach((a) => {
      if (a.dataset.bkBound) return;
      const t = (a.textContent || '').toLowerCase();
      if (t.includes('book a discovery') || t.includes('discovery conversation') || t.includes('book a')) {
        a.dataset.bkBound = '1';
        a.addEventListener('click', (e) => { e.preventDefault(); openBooking(); });
      }
    });
  }
  bindTriggers();

  // ─── Events ───────────────────────────────────────────────────────────
  backdrop.querySelector('#bk-close').addEventListener('click', closeBooking);
  backdrop.querySelector('#bk-done').addEventListener('click', closeBooking);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeBooking(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) closeBooking();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#bk-name');
    const email = form.querySelector('#bk-email');
    const interest = form.querySelector('#bk-interest');
    let valid = true;

    [name, email, interest].forEach((f) => f.classList.remove('bk-invalid'));

    if (!name.value.trim()) { name.classList.add('bk-invalid'); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.classList.add('bk-invalid'); valid = false; }
    if (!interest.value) { interest.classList.add('bk-invalid'); valid = false; }

    if (!valid) {
      modalEl.querySelector('.bk-invalid')?.focus();
      return;
    }

    formView.style.display = 'none';
    successView.style.display = '';
    modalEl.scrollTop = 0;
  });

  // Expose for programmatic use if needed
  window.openBooking = openBooking;
  window.closeBooking = closeBooking;
})();