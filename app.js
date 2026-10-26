(() => {
  // === Einstellungen ===
  const CONFIG = {
    json: 'gallery.json',
    imgDir: 'img/',
    email: 'vamn22@protonmail.com',
    subjectPrefix: 'Print inquiry: '
  };

  const PATTERN = [
    { span: 6, start: 1 }, { span: 4, start: 9 }, { span: 5, start: 3 },
    { span: 7, start: 6 }, { span: 3, start: 2 }, { span: 8, start: 5 }
  ];

  const $ = id => document.getElementById(id);
  const grid = $('gallery'), viewer = $('viewer'), vImg = $('viewer-img');

  let galleryItems = []; // Speichert die Bilder für die Navigation
  let currentIndex = -1; // Speichert das aktuell offene Bild

  if ($('contact-link')) {
    $('contact-link').href = 'mailto:' + CONFIG.email;
  }

  fetch(CONFIG.json)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(items => {
      // Fisher-Yates Shuffle für zufällige Reihenfolge
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      galleryItems = items; // Global speichern für die Weiterklicken-Logik
      render(items);
    })
    .catch(() => { grid.innerHTML = '<p>gallery.json konnte nicht geladen werden.</p>'; });

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
      cap.textContent = it.title || '';

      b.append(frame, cap);
      // Den Index übergeben, damit wir wissen, wo wir in der Liste stehen
      b.addEventListener('click', () => open(i));
      frag.appendChild(b);
    });
    grid.appendChild(frag);
  }

  function open(index) {
    currentIndex = index;
    const it = galleryItems[index];
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

  function navigate(direction) {
    if (currentIndex === -1) return;
    let nextIndex = currentIndex + direction;
    // Endlosschleife: Wenn Ende erreicht, springe zum Anfang und umgekehrt
    if (nextIndex >= galleryItems.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = galleryItems.length - 1;
    open(nextIndex);
  }

  viewer.addEventListener('click', e => { 
    if (e.target.closest('#viewer-inquire')) return; // Klick auf Mail-Link durchlassen
    
    if (e.target.id === 'viewer-img') {
      // Prüfen, auf welche Hälfte des Bildes geklickt wurde
      const rect = e.target.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX > rect.width / 2) {
        navigate(1); // Rechte Hälfte -> Vorwärts
      } else {
        navigate(-1); // Linke Hälfte -> Rückwärts
      }
      return;
    }
    
    close(); // Klick außerhalb des Bildes schließt den Viewer
  });

  document.addEventListener('keydown', e => { 
    if (viewer.hidden) return;
    if (e.key === 'Escape') close(); 
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'ArrowLeft') navigate(-1);
  });

  // Schutz gegen Rechtsklick und Drag & Drop
  const onImage = e => e.target.closest('.tile, .viewer') && e.target.tagName !== 'A';
  document.addEventListener('contextmenu', e => { if (onImage(e) || e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });
})();