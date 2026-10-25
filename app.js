(() => {
  // === Einstellungen ===
  const CONFIG = {
    json: 'gallery.json',
    imgDir: 'img/',
    email: 'hello@example.com',
    subjectPrefix: 'Print inquiry: '
  };

  // Fallback-Muster, falls ein Eintrag keine Position hat (span = Breite, start = Startspalte)
  const PATTERN = [
    { span: 6, start: 1 }, { span: 4, start: 9 }, { span: 5, start: 3 },
    { span: 7, start: 6 }, { span: 3, start: 2 }, { span: 8, start: 5 }
  ];

  const $ = id => document.getElementById(id);
  const grid = $('gallery'), viewer = $('viewer'), vImg = $('viewer-img');

  $('contact-link').href = 'mailto:' + CONFIG.email;

  fetch(CONFIG.json)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(() => { grid.innerHTML = '<p>gallery.json konnte nicht geladen werden. Bitte über einen Webserver öffnen, nicht per Doppelklick.</p>'; });

  function render(items) {
    const frag = document.createDocumentFragment();
    items.forEach((it, i) => {
      const p = PATTERN[i % PATTERN.length];
      const span = it.span || p.span;
      const start = Math.min(it.start || p.start, 13 - span);
      const b = document.createElement('button');
      b.className = 'tile';
      b.type = 'button';
      b.style.setProperty('--span', span);
      b.style.setProperty('--start', start);
      b.style.setProperty('--ratio', it.ratio || '3 / 2');

      const frame = document.createElement('span');
      frame.className = 'frame';
      const img = new Image();
      img.alt = it.title || it.file;
      img.draggable = false;
      img.loading = i < 2 ? 'eager' : 'lazy';
      img.onload = () => img.classList.add('ready');
      img.src = CONFIG.imgDir + it.file;
      frame.appendChild(img);

      const cap = document.createElement('span');
      cap.className = 'cap';
      cap.textContent = [it.title, it.year].filter(Boolean).join(', ');

      b.append(frame, cap);
      b.addEventListener('click', () => open(it));
      frag.appendChild(b);
    });
    grid.appendChild(frag);
  }

  function open(it) {
    vImg.src = CONFIG.imgDir + it.file;
    vImg.alt = it.title || it.file;
    $('viewer-title').textContent = it.title || '';
    const name = it.title ? `${it.title} (${it.file})` : it.file;
    $('viewer-inquire').href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(CONFIG.subjectPrefix + name)}`;
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function close() {
    viewer.hidden = true;
    vImg.removeAttribute('src');
    document.body.style.overflow = '';
  }

  viewer.addEventListener('click', e => { if (!e.target.closest('#viewer-inquire')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !viewer.hidden) close(); });

  // Schutz gegen Laien: kein Rechtsklick, kein Drag auf Bildern
  const onImage = e => e.target.closest('.tile, .viewer') && e.target.tagName !== 'A';
  document.addEventListener('contextmenu', e => { if (onImage(e) || e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });
})();
