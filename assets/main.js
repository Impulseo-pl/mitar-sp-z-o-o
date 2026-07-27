/* ============================================================
   MITAR — interakcje: menu, reveal, lightbox, formularz.
   Zasada: gdy cokolwiek tu padnie, strona zostaje w pełni czytelna.
   ============================================================ */

/* ---------- menu mobilne + kondensacja nagłówka ---------- */
(function () {
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (!nav) return;

  function setNavH() {
    document.documentElement.style.setProperty('--nav-h', nav.getBoundingClientRect().bottom + 'px');
  }
  setNavH();
  addEventListener('resize', setNavH, { passive: true });

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var ticking = false;
  function upd() {
    nav.classList.toggle('is-stuck', scrollY > 20);
    setNavH();
    ticking = false;
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(upd); }
  }, { passive: true });
  upd();
})();

/* ---------- pływające wezwanie: po hero, ale nie na stopce ---------- */
(function () {
  var call = document.querySelector('.call');
  var foot = document.querySelector('footer');
  if (!call) return;
  var footVisible = false;
  if (foot && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      footVisible = es[0].isIntersecting;
      upd();
    }, { rootMargin: '0px 0px -30% 0px' }).observe(foot);
  }
  function upd() {
    call.classList.toggle('show', scrollY > 520 && !footVisible);
  }
  addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true });
  upd();
})();

/* ---------- odsłanianie sekcji przy przewijaniu ---------- */
(function () {
  var els = [].slice.call(document.querySelectorAll('.reveal'));
  if (!els.length) return;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function (el) { io.observe(el); });
  // to, co widać od razu, pokazujemy bez czekania na przewinięcie
  requestAnimationFrame(function () {
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) { el.classList.add('in'); io.unobserve(el); }
    });
  });
  // bezpiecznik: nic nie ma prawa zostać niewidoczne
  setTimeout(function () {
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add('in');
    });
  }, 2600);
})();

/* ---------- podświetlenie aktywnej sekcji w menu ---------- */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var map = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (id) map[id] = a;
  });
  var secs = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (!secs.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var a = map[e.target.id];
      if (a && e.isIntersecting) {
        document.querySelectorAll('.nav-links a.active').forEach(function (x) { x.classList.remove('active'); });
        a.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(function (s) { io.observe(s); });
})();

/* ---------- lightbox galerii ---------- */
(function () {
  var lb = document.getElementById('lb');
  var img = document.getElementById('lbImg');
  var cap = document.getElementById('lbCap');
  var gal = document.getElementById('gallery');
  if (!lb || !img || !gal) return;

  var tiles = [].slice.call(gal.querySelectorAll('.tile'));
  var i = 0;

  function show(n) {
    i = (n + tiles.length) % tiles.length;
    var t = tiles[i];
    img.src = t.getAttribute('data-full');
    img.alt = t.getAttribute('data-cap') || '';
    cap.textContent = (i + 1) + ' / ' + tiles.length + ' · ' + (t.getAttribute('data-cap') || '');
  }
  function open(n) {
    show(n);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    img.removeAttribute('src');
  }

  tiles.forEach(function (t, n) {
    t.setAttribute('tabindex', '0');
    t.setAttribute('role', 'button');
    t.addEventListener('click', function () { open(n); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n); }
    });
  });

  document.getElementById('lbX').addEventListener('click', close);
  document.getElementById('lbP').addEventListener('click', function (e) { e.stopPropagation(); show(i - 1); });
  document.getElementById('lbN').addEventListener('click', function (e) { e.stopPropagation(); show(i + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === img) close(); });
  addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
})();

/* ---------- formularz: składa gotową wiadomość e-mail ----------
   Świadomie NIE udajemy wysyłki po stronie serwera: strona jest statyczna,
   więc zapytanie trafia do programu pocztowego z wypełnioną treścią.       */
(function () {
  var f = document.getElementById('askForm');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var g = function (n) { var el = f.elements[n]; return el ? String(el.value || '').trim() : ''; };
    var topic = g('topic') || 'Zapytanie ze strony';
    var body = [
      'Imię / firma: ' + g('name'),
      'Telefon: ' + g('phone'),
      'E-mail: ' + g('email'),
      'Temat: ' + topic,
      '',
      'Szczegóły:',
      g('message')
    ].join('\n');
    location.href = 'mailto:mitarmeble@gmail.com'
      + '?subject=' + encodeURIComponent('Zapytanie ze strony: ' + topic)
      + '&body=' + encodeURIComponent(body);
  });
})();

/* === licznik otwarć demo (buy-signal) + geo === */
(function(){try{if(String(location.protocol).indexOf('http')!==0)return;try{if(/[?&#]team=1/.test(location.search+location.hash)){localStorage.setItem('nb_team','1');}}catch(e){}try{if(localStorage.getItem('nb_team')==='1')return;}catch(e){}if((document.referrer||'').indexOf('crm-newbeginning')>-1)return;if(sessionStorage.getItem('_dv'))return;sessionStorage.setItem('_dv','1');var seg=(location.pathname.split('/').filter(Boolean)[0])||'';var base=location.origin+(seg?('/'+seg):'');var ua='';try{ua=(navigator.userAgent||'').slice(0,300);}catch(e){}var EP='https://zngfubfinbojfgaxdrbf.supabase.co/rest/v1/demo_views';var KEY='sb_publishable_MWwoyGlSCWnJ4awtOPF0ow_ZVS0Y8qK';function send(g){try{fetch(EP,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json','apikey':KEY,'Authorization':'Bearer '+KEY,'Prefer':'return=minimal'},body:JSON.stringify({demo_url:base,page:location.pathname,referrer:(document.referrer||null),user_agent:(ua||null),ip:(g&&g.ip)||null,country:(g&&g.cc)||null,city:(g&&g.city)||null})}).catch(function(){});}catch(e){}}var done=false;function once(g){if(done)return;done=true;send(g);}try{var t=setTimeout(function(){once(null);},1500);fetch('https://ipwho.is/?fields=ip,success,country_code,city',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){clearTimeout(t);once(d&&d.success!==false?{ip:d.ip,cc:d.country_code,city:d.city}:null);}).catch(function(){clearTimeout(t);once(null);});}catch(e){once(null);}}catch(e){}})();
