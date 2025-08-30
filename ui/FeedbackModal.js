
// ui/FeedbackModal.js
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mldwbjbn'; 

export function openFeedbackModal(scene) {
  const { width, height } = scene.scale;

// Przyciemnione tło (klik poza modalem ma zamykać)
const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.6)
.setOrigin(0, 0).setDepth(2000).setInteractive();

// HTML formularz (DOMElement)
const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <style>
      .fbx {
        width: min(620px, 92vw);
        background:#141820; color:#e6e6e6; border:2px solid #3a3f46;
        border-radius:14px; padding:18px 18px 12px; font-family: system-ui, Arial, sans-serif;
        box-shadow: 0 10px 30px rgba(0,0,0,.45);
      }
      .fbx h2 { margin: 0 0 8px; font-size: 22px; }
      .fbx p.hint { margin: 0 0 12px; font-size: 14px; color:#b8b9bd }
      .fbx label { font-size: 14px; color:#cfd1d4; display:block; margin:10px 0 6px; }
      .fbx input, .fbx textarea, .fbx select {
        width: 100%; background:#0f131a; color:#e6e6e6; border:1px solid #2c313a; border-radius:10px;
        padding:10px 12px; font-size:14px; outline:none;
      }
      .fbx textarea { min-height: 120px; resize: vertical; }
      .fbx .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .fbx .actions { display:flex; gap:10px; justify-content:flex-end; margin-top:12px; }
      .fbx button {
        border:0; border-radius:10px; padding:10px 14px; font-weight:600; cursor:pointer;
      }
      .fbx .btn-primary { background:#9ef01a; color:#0e1014; }
      .fbx .btn-secondary { background:#262b34; color:#e6e6e6; }
      .fbx .msg { margin-top:10px; font-size: 14px; }
      .fbx small { color:#8b8f96 }
    </style>

    <form class="fbx" id="feedbackForm" novalidate>
      <h2>💬 Feedback o grze</h2>
      <p class="hint">Twoje uwagi pomogą mi ulepszyć „Gra Overemployment”. Dziękuję!</p>

      <div class="row">
        <div>
          <label>Ocena wrażeń (1–5)</label>
          <select name="rating" required>
            <option value="">Wybierz…</option>
            <option>1</option><option>2</option><option>3</option>
            <option>4</option><option>5</option>
          </select>
        </div>
        <div>
          <label>Email (opcjonalnie)</label>
          <input type="email" name="email" placeholder="kontakt@...">
        </div>
      </div>

      <label>Co mogę poprawić?</label>
      <textarea name="message" placeholder="Napisz, co działa/nie działa, co dodać..."></textarea>

      <label>Technicznie (opcjonalne)</label>
      <input type="text" name="context" placeholder="Przeglądarka/urządzenie, wersja gry, itp.">

      <div class="actions">
        <button type="button" class="btn-secondary" id="fbx-cancel">Anuluj</button>
        <button type="submit" class="btn-primary">Wyślij</button>
      </div>
      <div class="msg" id="fbx-msg"></div>
      <small>Wysyłka przez Formspree. Nie zapisuję Twoich danych na serwerze gry.</small>
    </form>
  `;

    const dom = scene.add.dom(width / 2, height / 2, wrapper).setDepth(2001);

    // UX: zablokuj scroll strony na czas modala
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Zamknięcie (sprzątanie)
    const close = () => {
        try { document.body.style.overflow = prevOverflow; } catch (_) {}
        dom.destroy();
        overlay.destroy();
    };

    // przycisk „Anuluj”
    wrapper.querySelector('#fbx-cancel').addEventListener('click', (e) => {
        e.preventDefault();
        close();
    });

    // Klik w overlay: zamknij TYLKO jeśli kliknięto poza prostokątem modala
    overlay.on('pointerdown', (pointer) => {
        const rect = dom.node.getBoundingClientRect();
        const x = pointer.event?.clientX ?? -1;
        const y = pointer.event?.clientY ?? -1;
        const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        if (!inside) close();
    });

    // (opcjonalnie) niech klik wewnątrz formularza nie „przecieka”
    ['pointerdown','mousedown','touchstart','click'].forEach(evt =>
        dom.node.addEventListener(evt, (e) => e.stopPropagation(), { passive: true })
    );
    

  // Submit → Formspree
  wrapper.querySelector('#feedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = wrapper.querySelector('#fbx-msg');
    msgEl.textContent = 'Wysyłam…';

    const data = Object.fromEntries(new FormData(e.target).entries());
    // dorzuć odrobinę kontekstu z gry
    try {
      data.gameRole = scene.role || '';
      data.gameTurn = scene.turn || 0;
      data.gameVersion = window.__GAME_VERSION__ || '';
    } catch(_) {}

    try {
      const resp = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (resp.ok) {
        msgEl.textContent = 'Dziękuję! Feedback dotarł 📬';
        scene.cameras.main.flash(160, 158, 240, 26);
        scene.sound?.play?.('sfx_success', { volume: 0.6 });
        setTimeout(close, 1000);
      } else {
        const j = await resp.json().catch(() => ({}));
        msgEl.textContent = 'Ups… nie udało się wysłać. Spróbuj ponownie później.';
        console.warn('Formspree error', j);
        scene.sound?.play?.('sfx_fail', { volume: 0.6 });
      }
    } catch (err) {
      msgEl.textContent = 'Błąd sieci. Sprawdź połączenie.';
      console.error(err);
      scene.sound?.play?.('sfx_fail', { volume: 0.6 });
    }
  });

  // drobna animacja wejścia
  dom.setScale(0.95).setAlpha(0);
  scene.tweens.add({ targets: dom, alpha: 1, scaleX: 1, scaleY: 1, duration: 160, ease: 'Quad.easeOut' });
}
