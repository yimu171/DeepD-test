/* DeepD homepage — no dependencies. */
(() => {
  'use strict';

  /* Set this to the preprint URL once it is public; every [data-preprint] link picks it up. */
  const PREPRINT_URL = '';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------- preprint */

  function initPreprint() {
    const links = $$('[data-preprint]');
    if (PREPRINT_URL) {
      links.forEach((a) => {
        a.href = PREPRINT_URL;
        a.target = '_blank';
        a.rel = 'noopener';
      });
      $$('[data-preprint-status]').forEach((el) => {
        el.textContent = 'Read now';
        el.classList.add('res__status--live');
      });
      return;
    }
    links.forEach((a) => {
      a.classList.add('is-pending');
      a.setAttribute('aria-disabled', 'true');
      a.removeAttribute('href');
      a.title = 'Preprint link coming soon';
      if (a.closest('.nav') || a.closest('.hero')) {
        const badge = document.createElement('span');
        badge.className = 'soon';
        badge.textContent = 'Soon';
        a.appendChild(badge);
      }
    });
    const label = $('[data-preprint-label]');
    if (label) label.textContent = 'Preprint';
  }

  /* ------------------------------------------------------------------ nav */

  function initNav() {
    const nav = $('#nav');
    const hero = $('.hero');
    const burger = $('#burger');
    const links = $('#navLinks');

    const onScroll = () => {
      const past = window.scrollY > (hero ? hero.offsetHeight - 90 : 40);
      nav.classList.toggle('is-solid', past || links.classList.contains('is-open'));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    burger.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      onScroll();
    });
    links.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        links.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        onScroll();
      }
    });

    const map = new Map($$('a', links).map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        map.forEach((a) => a.classList.remove('is-active'));
        const a = map.get(en.target.id);
        if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* --------------------------------------------------------------- reveal */

  function initReveal() {
    const els = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------ count-up */

  function initCounters() {
    const els = $$('[data-count]');
    if (reduceMotion) return;
    els.forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const t0 = performance.now() + 250;
      const dur = 1400;
      el.textContent = (0).toFixed(dec);
      const tick = (now) => {
        const k = Math.min(1, Math.max(0, (now - t0) / dur));
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = (target * e).toFixed(dec);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ------------------------------------------------ hero helix + ticker */

  const BASES = ['A', 'C', 'G', 'T'];
  const PAIR = { A: 'T', T: 'A', C: 'G', G: 'C' };
  const BASE_COLORS = { A: '#15803d', C: '#1d4ed8', G: '#b45309', T: '#c2352f' };

  /* deterministic pseudo-random so the backdrop is identical on every load */
  function rng(seed) {
    let s = seed || 1;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  function initHelix() {
    const canvas = $('#helix');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rand = rng(7);
    let w = 0, h = 0, motes = [], running = false, raf = 0;

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes = [];
      const n = Math.round(Math.min(80, w / 16));
      for (let i = 0; i < n; i++) {
        motes.push({
          x: rand() * w, y: rand() * h,
          b: BASES[Math.floor(rand() * 4)],
          s: 9 + rand() * 13,
          v: 0.06 + rand() * 0.22,
          a: 0.07 + rand() * 0.16,
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      const cy = h * 0.62;
      const amp = Math.min(150, h * 0.17);
      const phase = t * 0.00028;

      /* rungs */
      for (let x = -40; x < w + 40; x += 26) {
        const k = x * 0.0072 + phase;
        const y1 = cy + Math.sin(k) * amp;
        const y2 = cy + Math.sin(k + Math.PI) * amp;
        const depth = (Math.cos(k) + 1) / 2;
        const b = BASES[Math.abs(Math.round(x / 26)) % 4];
        ctx.globalAlpha = 0.05 + depth * 0.16;
        ctx.strokeStyle = BASE_COLORS[b];
        ctx.lineWidth = 1 + depth * 1.6;
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();

        if (depth > 0.72) {
          ctx.globalAlpha = (depth - 0.72) * 1.2;
          ctx.fillStyle = BASE_COLORS[b];
          ctx.font = '600 11px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(b, x, y1 - 7);
          ctx.fillStyle = BASE_COLORS[PAIR[b]];
          ctx.fillText(PAIR[b], x, y2 + 15);
        }
      }

      /* strands */
      [0, Math.PI].forEach((off, idx) => {
        ctx.beginPath();
        for (let x = -40; x <= w + 40; x += 9) {
          const y = cy + Math.sin(x * 0.0072 + phase + off) * amp;
          if (x === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, idx ? 'rgba(29,78,216,.12)' : 'rgba(4,153,140,.34)');
        g.addColorStop(0.5, idx ? 'rgba(4,153,140,.22)' : 'rgba(4,153,140,.24)');
        g.addColorStop(1, idx ? 'rgba(240,153,10,.16)' : 'rgba(240,153,10,.34)');
        ctx.globalAlpha = 1;
        ctx.strokeStyle = g;
        ctx.lineWidth = idx ? 1.6 : 2.4;
        ctx.stroke();
      });

      /* drifting bases */
      ctx.textAlign = 'left';
      motes.forEach((m) => {
        m.y -= m.v;
        if (m.y < -20) { m.y = h + 20; m.x = rand() * w; }
        ctx.globalAlpha = m.a;
        ctx.fillStyle = BASE_COLORS[m.b];
        ctx.font = `600 ${m.s.toFixed(0)}px ui-monospace, monospace`;
        ctx.fillText(m.b, m.x, m.y);
      });
      ctx.globalAlpha = 1;
    }

    function loop(t) { draw(t); if (running) raf = requestAnimationFrame(loop); }
    function start() { if (running || reduceMotion) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(0); });
    if (reduceMotion) { draw(0); return; }
    new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop())).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }

  function initTicker() {
    const host = $('#ticker');
    if (!host) return;
    const rand = rng(23);
    let out = '';
    for (let i = 0; i < 260; i++) {
      const b = BASES[Math.floor(rand() * 4)];
      out += `<b class="${b.toLowerCase()}">${b}</b>`;
    }
    host.innerHTML = out;
    if (reduceMotion) return;
    let offset = 0;
    setInterval(() => {
      offset = (offset + 1) % 26;
      host.style.transform = `translateX(${-offset}px)`;
    }, 90);
  }

  /* --------------------------------------------------------------- corpus */

  function initCorpus() {
    const list = $('#corpusBars');
    if (!list) return;
    const fmt = {
      dna: (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} Tb` : `${v.toFixed(2)} Gb`),
      genomes: (v) => v.toLocaleString('en-US'),
    };
    const floor = { dna: 1, genomes: 100 };
    function render(metric) {
      const rows = $$('li', list);
      const vals = rows.map((li) => parseFloat(li.dataset[metric]));
      const max = Math.log10(Math.max(...vals));
      const lo = Math.log10(floor[metric]);
      rows.forEach((li, i) => {
        const pct = ((Math.log10(vals[i]) - lo) / (max - lo)) * 100;
        $('i', li).style.width = `${Math.max(4, pct)}%`;
        $('.corpus__val', li).textContent = fmt[metric](vals[i]);
      });
    }
    const tabs = $$('.seg button', list.parentElement);
    tabs.forEach((b) => b.addEventListener('click', () => {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t === b)));
      render(b.dataset.metric);
    }));
    $$('li', list).forEach((li) => { $('.corpus__val', li).textContent = fmt.dna(parseFloat(li.dataset.dna)); });
    new IntersectionObserver(([en], io) => {
      if (en.isIntersecting) { render('dna'); io.disconnect(); }
    }, { threshold: 0.3 }).observe(list);
  }

  /* --------------------------------------------------------------- ladder */

  function initLadder() {
    const root = $('#ladder');
    if (!root) return;
    const stops = $$('.ladder__stop', root);
    const fill = $('#ladderFill');
    const text = $('#ladderText');
    const copy = [
      '<b>8K</b> pretraining on 5.69T tokens learns local sequence grammar and coding regularities.',
      'Midtraining warm-starts from the previous stage and extends the window to <b>32K</b> tokens.',
      'At <b>128K</b> tokens, whole-genome sequence makes up a growing share of each batch.',
      'At <b>512K</b> tokens, YaRN-scaled rotary positions keep extrapolation stable.',
      'At <b>1M</b> tokens, validation perplexity is the lowest of all stages (Figure 1F).',
    ];
    let idx = 0, timer = 0, user = false;
    function set(i) {
      idx = i;
      stops.forEach((s, k) => {
        s.classList.toggle('is-active', k === i);
        s.classList.toggle('is-done', k < i);
      });
      fill.style.width = `${(i / (stops.length - 1)) * 80}%`;
      text.innerHTML = copy[i];
    }
    stops.forEach((s, i) => s.addEventListener('click', () => { user = true; clearInterval(timer); set(i); }));
    set(0);
    if (reduceMotion) return;
    new IntersectionObserver(([en], io) => {
      if (!en.isIntersecting || user) return;
      io.disconnect();
      timer = setInterval(() => {
        if (idx >= stops.length - 1) { clearInterval(timer); return; }
        set(idx + 1);
      }, 1600);
    }, { threshold: 0.6 }).observe(root);
  }

  /* ------------------------------------------------------------ explorers */

  function initExplorers() {
    $$('[data-explorer]').forEach((root) => {
      const tabs = $$('[role="tab"]', root);
      const panels = tabs.map((t) => document.getElementById(t.dataset.panel));
      tabs.forEach((t, i) => {
        t.setAttribute('aria-controls', t.dataset.panel);
        panels[i].setAttribute('role', 'tabpanel');
        t.addEventListener('click', () => select(i));
        t.addEventListener('keydown', (e) => {
          const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
          if (!d) return;
          e.preventDefault();
          const n = (i + d + tabs.length) % tabs.length;
          select(n);
          tabs[n].focus();
        });
      });
      function select(i) {
        tabs.forEach((t, k) => {
          t.setAttribute('aria-selected', String(k === i));
          t.tabIndex = k === i ? 0 : -1;
          panels[k].classList.toggle('is-active', k === i);
        });
      }
      select(0);

      const stage = $('.explorer__stage', root);
      const list = $('.explorer__tabs', root);
      const fit = () => {
        const h = Math.max(list.getBoundingClientRect().height, 420);
        stage.style.setProperty('--stage-h', `${Math.round(h)}px`);
      };
      fit();
      window.addEventListener('resize', fit);
    });
  }

  /* ------------------------------------------------------ human benchmark */

  const BENCH_MODELS = ['DeepD-60B', 'Evo 2 40B', 'Evo 2 20B', 'Evo 2 7B', 'Evo 2 1B', 'Evo 1', 'NT-2.5B', 'NT-500M', 'AlphaGenome'];
  const BENCH_COLOR = { Evo: '#6f8fae', 'Evo 1': '#c9d3dc', 'NT-2.5B': '#4fa69e', 'NT-500M': '#9dd6d0', AlphaGenome: '#e8a15a', PLM: '#bcc38c' };
  const benchColor = (name) => BENCH_COLOR[name] || (name.startsWith('Evo 2') ? BENCH_COLOR.Evo : BENCH_COLOR.PLM);

  const BENCH = {
    protein: {
      metric: 'Mean |Spearman ρ| · zero-shot · 5 datasets',
      img: 'f4-protein',
      cap: '<b>Figure 4A.</b> Human protein fitness: bars show mean |ρ| across datasets, dots show individual datasets.',
      rows: [['DeepD-60B', 0.6274], ['Evo 2 40B', 0.6178], ['Evo 2 1B', 0.6168], ['Evo 2 20B', 0.6148], ['Evo 2 7B', 0.5752],
        ['ESM-2 650M', 0.5707], ['ESM-2 3B', 0.5227], ['ESM-1v', 0.4737], ['CARP 640M', 0.4431], ['ProGen2-L', 0.4248],
        ['ProGen2-XL', 0.3996], ['NT-2.5B', 0.3849], ['Evo 1', 0.289], ['NT-500M', 0.2887], ['AlphaGenome', 0.2191]],
      note: 'Trained on genomic DNA rather than protein sequence, DeepD (<b>0.627</b>) edges past the strongest Evo 2 model (40B, 0.618) and every protein language model evaluated, led by ESM-2 650M (0.571).',
    },
    snv: {
      metric: 'pathogenic vs benign · overall · n = 5,458',
      img: 'f4-clinvar',
      cap: '<b>Figure 4B.</b> ClinVar SNVs (left) and non-SNVs (right), overall and by coding annotation.',
      auroc: [0.9343, 0.9501, 0.9499, 0.9455, 0.9266, 0.5669, 0.798, 0.8239, 0.5756],
      auprc: [0.9472, 0.9548, 0.9545, 0.9568, 0.9452, 0.6342, 0.8501, 0.8872, 0.7109],
      note: {
        auroc: 'DeepD (<b>0.934</b>) is close to the larger Evo 2 models (0.946–0.950) and well ahead of NT v2 and AlphaGenome. By class it reaches <b>0.965</b> on non-coding and <b>0.873</b> on coding SNVs.',
        auprc: 'By AUPRC DeepD (<b>0.947</b>) sits within the Evo 2 range (0.945–0.957), ahead of NT v2 (0.850–0.887) and AlphaGenome (0.711).',
      },
    },
    nonsnv: {
      metric: 'pathogenic vs benign · overall · n = 5,267',
      img: 'f4-clinvar',
      cap: '<b>Figure 4B.</b> ClinVar SNVs (left) and non-SNVs (right), overall and by coding annotation.',
      auroc: [0.965, 0.9897, 0.9896, 0.9696, 0.9151, 0.5181, 0.779, 0.7793, 0.4846],
      auprc: [0.998, 0.9993, 0.9993, 0.9982, 0.9948, 0.9549, 0.9872, 0.9865, 0.949],
      note: {
        auroc: 'DeepD (<b>0.965</b>) trails only the larger Evo 2 models (0.970–0.990). On non-coding non-SNVs it reaches <b>0.974</b>, close to the strongest Evo 2 models (0.978–0.981).',
        auprc: 'AUPRC is near saturation on this set (0.949–0.999 for every model); DeepD scores <b>0.998</b>.',
      },
    },
    splice: {
      metric: 'splice-altering vs control · overall · n = 23,877',
      img: 'f4-splice',
      cap: '<b>Figure 4C.</b> SpliceVarDB, overall and for exonic and intronic variants (AlphaGenome not shown in this panel).',
      auroc: [0.8143, 0.8233, 0.8223, 0.8326, 0.812, 0.4626, 0.7788, 0.8558, 0.9558],
      auprc: [0.8433, 0.8287, 0.8276, 0.8525, 0.8421, 0.4946, 0.7807, 0.8871, 0.9698],
      note: {
        auroc: 'AlphaGenome, trained on human splicing readouts, leads at 0.956. Without splicing supervision DeepD (<b>0.814</b>) is on par with Evo 2 (0.812–0.833) and reaches <b>0.919</b> on intronic variants, near the best Evo 2 model (0.936).',
        auprc: 'AlphaGenome leads (0.970), then NT-500M (0.887). DeepD (<b>0.843</b>) is ahead of Evo 2 40B, 20B and 1B.',
      },
    },
    brca1: {
      metric: 'functional effect · overall · n = 3,893',
      img: 'f4-brca1',
      cap: '<b>Figure 4D.</b> BRCA1 variants, overall and by consequence class.',
      auroc: [0.8247, 0.8744, 0.8743, 0.8771, 0.7324, 0.4561, 0.6929, 0.7473, 0.6948],
      auprc: [0.5751, 0.6418, 0.6418, 0.682, 0.5227, 0.2056, 0.3868, 0.5418, 0.5203],
      note: {
        auroc: 'The larger Evo 2 models lead (0.874–0.877). DeepD (<b>0.825</b>) exceeds NT v2 and AlphaGenome, reaches <b>0.915</b> on splice-region variants and is the best general genome language model on synonymous variants.',
        auprc: 'DeepD (<b>0.575</b>) follows the three larger Evo 2 models (0.642–0.682) and is ahead of NT v2, Evo 2 1B and AlphaGenome.',
      },
    },
    brca2: {
      metric: 'functional effect · overall · n = 6,837',
      img: 'f4-brca2',
      cap: '<b>Figure 4E.</b> BRCA2 variants, overall and by consequence class.',
      auroc: [0.825, 0.8444, 0.8437, 0.8342, 0.7568, 0.4597, 0.7124, 0.765, 0.6176],
      auprc: [0.5598, 0.5323, 0.5307, 0.5687, 0.4982, 0.1554, 0.366, 0.5775, 0.3783],
      note: {
        auroc: 'DeepD (<b>0.825</b>) is close to the larger Evo 2 models (0.834–0.844), is best of all models on canonical splice variants (<b>0.730</b>, vs 0.668 for AlphaGenome) and reaches 0.813 on silent variants.',
        auprc: 'DeepD (<b>0.560</b>) is close to the top (NT-500M 0.578, Evo 2 7B 0.569) and ahead of Evo 2 40B and 20B.',
      },
    },
  };

  function initBench() {
    const root = $('#bench');
    if (!root) return;
    const bars = $('#benchBars');
    const tabs = $$('[data-bench]', root);
    const modeSeg = $('#benchMode');
    const modes = $$('button', modeSeg);
    const img = $('#benchImg');
    let key = 'protein';
    let mode = 'auroc';
    function render() {
      const d = BENCH[key];
      const paired = !d.rows;
      const rows = paired
        ? BENCH_MODELS.map((m, i) => [m, d[mode][i]]).sort((a, b) => b[1] - a[1])
        : d.rows;
      modeSeg.hidden = !paired;
      $('#benchMetric').textContent = paired ? `${mode.toUpperCase()} · ${d.metric}` : d.metric;
      $('#benchNote').innerHTML = paired ? d.note[mode] : d.note;
      $('#benchCap').innerHTML = d.cap;
      img.src = `assets/fig/${d.img}.webp`;
      img.alt = d.cap.replace(/<[^>]+>/g, '');
      img.dataset.caption = img.alt;
      bars.innerHTML = rows.map(([name, v]) => `
        <li class="${name.startsWith('DeepD') ? 'is-us' : ''}" style="--c:${benchColor(name)}">
          <span class="nm">${name}</span>
          <span class="tr"><i data-w="${v * 100}"></i></span>
          <span class="v">${v.toFixed(3)}</span>
        </li>`).join('');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        $$('i', bars).forEach((i) => { i.style.width = `${i.dataset.w}%`; });
      }));
    }
    tabs.forEach((t) => t.addEventListener('click', () => {
      tabs.forEach((x) => x.setAttribute('aria-selected', String(x === t)));
      key = t.dataset.bench;
      render();
    }));
    modes.forEach((b) => b.addEventListener('click', () => {
      modes.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      mode = b.dataset.mode;
      render();
    }));
    render();
  }

  /* ------------------------------------------------- supervised regulatory */

  const REG_MODELS = [
    { name: 'DeepD-60B', color: 'url(#regUs)', swatch: 'linear-gradient(90deg, #046b62, #04998c)' },
    { name: 'Evo 2 40B', color: '#46698c' },
    { name: 'Evo 2 20B', color: '#6f8fae' },
    { name: 'Evo 2 7B', color: '#98b0c7' },
    { name: 'Evo 2 1B', color: '#bfcfdd' },
    { name: 'Evo 1', color: '#e3e9ef', stroke: '#9aa9b6' },
  ];
  const REG_TASKS = [
    ['Promoter', [0.8599, null, 0.8266, 0.7728, 0.6176, 0.5136]],
    ['Core promoter', [0.6202, 0.5186, 0.5058, 0.4423, 0.4268, 0.3442]],
    ['Splice site', [0.7139, null, null, 0.2326, 0.1743, 0]],
    ['TF 0', [0.6883, 0.4026, 0.3256, 0.454, 0.3751, 0.2019]],
    ['TF 1', [0.6535, 0.4383, 0.3798, 0.4989, 0.3653, 0.1726]],
    ['TF 2', [0.5566, 0.2865, 0.2734, 0.3499, 0.3208, 0.1607]],
    ['TF 3', [0.4974, 0.2066, 0.2661, 0.1828, 0.2042, 0.0442]],
    ['TF 4', [0.664, 0.3669, 0.3834, 0.4452, 0.432, 0.1307]],
  ];

  function initReg() {
    const plot = $('#regPlot');
    if (!plot) return;
    const legend = $('#regLegend');
    legend.innerHTML = REG_MODELS.map((m, i) => `
      <li data-m="${i}"><i style="background:${m.swatch || m.color};${m.stroke ? `border-color:${m.stroke}` : ''}"></i>${m.name}</li>`).join('');

    const tip = el('div', { class: 'reg__tip', role: 'presentation' });
    plot.appendChild(tip);
    let drawn = false;
    let lastW = 0;

    function highlight(m) {
      const s = $('svg', plot);
      if (!s) return;
      s.classList.toggle('is-hl', m != null);
      $$('[data-m]', s).forEach((n) => n.classList.toggle('is-on', n.dataset.m === String(m)));
      $$('li', legend).forEach((n) => n.classList.toggle('is-off', m != null && n.dataset.m !== String(m)));
    }

    function render() {
      const W = Math.round(plot.clientWidth);
      if (!W || W === lastW) return;
      lastW = W;
      $$('svg', plot).forEach((n) => n.remove());
      const vertical = W >= 680;
      const H = vertical ? 360 : REG_TASKS.length * 86 + 30;
      const s = svg('svg', { class: 'chart reg__svg', viewBox: `0 0 ${W} ${H}`, width: W, height: H });
      s.innerHTML = `<defs>
        <linearGradient id="regUs" x1="0" y1="1" x2="${vertical ? 0 : 1}" y2="${vertical ? 0 : 1}">
          <stop offset="0" stop-color="#046b62"/><stop offset="1" stop-color="#04998c"/></linearGradient></defs>`;
      const n = REG_MODELS.length;

      if (vertical) {
        const L = 40, R = 8, T = 40, B = 40;
        const ph = H - T - B;
        const gw = (W - L - R) / REG_TASKS.length;
        const bw = Math.min(16, (gw * 0.8) / n);
        const y = (v) => T + ph * (1 - v);
        [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
          s.appendChild(svg('line', { class: 'grid-line', x1: L, x2: W - R, y1: y(t), y2: y(t) }));
          s.appendChild(svg('text', { x: L - 8, y: y(t) + 3.5, 'text-anchor': 'end' }, t.toFixed(2)));
        });
        s.appendChild(svg('text', { class: 'lbl', x: 12, y: T + ph / 2, transform: `rotate(-90 12 ${T + ph / 2})`, 'text-anchor': 'middle' }, 'AUROC'));
        REG_TASKS.forEach(([task, vals], gi) => {
          const x0 = L + gi * gw + (gw - bw * n) / 2;
          vals.forEach((v, mi) => {
            const m = REG_MODELS[mi];
            const x = x0 + mi * bw;
            if (v == null) {
              const cx = x + bw / 2 + 3.5;
              s.appendChild(svg('text', { class: 'reg__na', x: cx, y: y(0) - 4, transform: `rotate(-90 ${cx} ${y(0) - 4})`, 'data-m': mi }, 'n/a'));
              return;
            }
            const r = svg('rect', {
              class: 'bar', x: x + 1, y: y(v), width: Math.max(bw - 2, 2), height: Math.max(ph * v, 1.5), rx: 2,
              fill: m.color, stroke: m.stroke || 'none', 'data-m': mi, 'data-t': task, 'data-v': v,
              style: `transition-delay:${gi * 60 + mi * 25}ms`,
            });
            s.appendChild(r);
          });
          const us = vals[0];
          const best = Math.max(...vals.slice(1).filter((v) => v != null));
          s.appendChild(svg('text', { class: 'reg__us', x: x0 + bw / 2, y: y(us) - 6, 'text-anchor': 'middle' }, us.toFixed(3)));
          s.appendChild(svg('text', { class: 'reg__delta', x: L + gi * gw + gw / 2, y: 18, 'text-anchor': 'middle' }, `+${(us - best).toFixed(3)}`));
          s.appendChild(svg('text', { class: 'lbl', x: L + gi * gw + gw / 2, y: H - B + 20, 'text-anchor': 'middle' }, task));
        });
      } else {
        const L = 8, R = 44, T = 22;
        const bh = 8, gap = 2;
        const pw = W - L - R;
        const x = (v) => L + pw * v;
        [0, 0.5, 1].forEach((t) => {
          s.appendChild(svg('line', { class: 'grid-line', x1: x(t), x2: x(t), y1: T, y2: H - 6 }));
          s.appendChild(svg('text', { x: x(t), y: 12, 'text-anchor': t === 0 ? 'start' : t === 1 ? 'end' : 'middle' }, t.toFixed(1)));
        });
        REG_TASKS.forEach(([task, vals], gi) => {
          const y0 = T + gi * 86;
          const us = vals[0];
          const best = Math.max(...vals.slice(1).filter((v) => v != null));
          s.appendChild(svg('text', { class: 'lbl', x: L, y: y0 + 14 }, task));
          s.appendChild(svg('text', { class: 'reg__delta', x: W - 2, y: y0 + 14, 'text-anchor': 'end' }, `+${(us - best).toFixed(3)}`));
          vals.forEach((v, mi) => {
            const m = REG_MODELS[mi];
            const yy = y0 + 22 + mi * (bh + gap);
            if (v == null) {
              s.appendChild(svg('text', { class: 'reg__na', x: L + 2, y: yy + bh - 0.5, 'data-m': mi }, 'n/a'));
              return;
            }
            s.appendChild(svg('rect', {
              class: 'bar bar--h', x: L, y: yy, width: Math.max(pw * v, 1.5), height: bh, rx: 2,
              fill: m.color, stroke: m.stroke || 'none', 'data-m': mi, 'data-t': task, 'data-v': v,
              style: `transition-delay:${gi * 50 + mi * 20}ms`,
            }));
            if (mi === 0) s.appendChild(svg('text', { class: 'reg__us', x: x(v) + 5, y: yy + bh - 0.5 }, v.toFixed(3)));
          });
        });
      }
      plot.insertBefore(s, tip);
      if (drawn) s.classList.add('is-drawn');
    }

    plot.addEventListener('pointermove', (ev) => {
      const r = ev.target.closest('rect[data-m]');
      if (!r) { tip.classList.remove('is-on'); highlight(null); return; }
      const box = plot.getBoundingClientRect();
      tip.textContent = `${REG_MODELS[r.dataset.m].name} · ${r.dataset.t}: ${(+r.dataset.v).toFixed(3)}`;
      tip.style.left = `${ev.clientX - box.left}px`;
      tip.style.top = `${ev.clientY - box.top}px`;
      tip.classList.add('is-on');
      highlight(r.dataset.m);
    });
    plot.addEventListener('pointerleave', () => { tip.classList.remove('is-on'); highlight(null); });
    legend.addEventListener('pointerover', (ev) => {
      const li = ev.target.closest('li');
      if (li) highlight(li.dataset.m);
    });
    legend.addEventListener('pointerleave', () => highlight(null));

    render();
    let raf = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(render);
    });
    onVisible(plot, () => {
      drawn = true;
      requestAnimationFrame(() => { const s = $('svg', plot); if (s) s.classList.add('is-drawn'); });
    });
  }

  /* ------------------------------------------------------- API key request */

  const APPLY = {
    minFillMs: 3000,
    cooldownMs: 60000,
    dailyMax: 5,
    timeoutMs: 90000,
    store: 'deepd-api-apply',
  };

  function initApply() {
    const form = $('#apiForm');
    if (!form) return;
    const status = $('#apiStatus');
    const btn = $('.apply__submit', form);
    const label = btn.textContent;
    const shownAt = Date.now();
    let busy = false;

    const clean = (v) => v.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim();
    const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
    const URLISH = /(https?:\/\/|www\.)/i;

    function readLog() {
      try {
        const log = JSON.parse(localStorage.getItem(APPLY.store)) || {};
        const today = new Date().toDateString();
        return log.day === today ? log : { day: today, count: 0, next: log.next || 0 };
      } catch { return { day: new Date().toDateString(), count: 0, next: 0 }; }
    }
    function writeLog(log) {
      try { localStorage.setItem(APPLY.store, JSON.stringify(log)); } catch { /* storage disabled */ }
    }
    function say(msg, kind) {
      status.textContent = msg;
      status.className = `apply__status${kind ? ` is-${kind}` : ''}`;
    }
    function invalid(input, msg) {
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      say(msg, 'err');
      return false;
    }

    $$('input', form).forEach((i) => i.addEventListener('input', () => i.removeAttribute('aria-invalid')));

    function validate() {
      const name = form.username;
      const org = form.organization;
      const email = form.email;
      name.value = clean(name.value);
      org.value = clean(org.value);
      email.value = email.value.trim().toLowerCase();
      if (name.value.length < 2 || name.value.length > 64 || URLISH.test(name.value)) return invalid(name, 'Please enter your name (2–64 characters).');
      if (org.value.length < 2 || org.value.length > 128 || URLISH.test(org.value)) return invalid(org, 'Please enter your institution or university (2–128 characters).');
      if (email.value.length > 254 || !EMAIL.test(email.value)) return invalid(email, 'Please enter a valid email address.');
      if (!form.agree.checked) { form.agree.focus(); say('Please accept the CC BY-NC 4.0 terms to continue.', 'err'); return false; }
      return true;
    }

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (busy) return;
      if (!validate()) return;

      if (form.website.value) { say('Thank you. Your request has been received.', 'ok'); form.reset(); return; }
      if (Date.now() - shownAt < APPLY.minFillMs) { say('Please take a moment to check your details, then submit again.', 'err'); return; }

      const log = readLog();
      if (log.next > Date.now()) {
        say(`Please wait ${Math.ceil((log.next - Date.now()) / 1000)} s before submitting again.`, 'err');
        return;
      }
      if (log.count >= APPLY.dailyMax) { say('Too many requests from this browser today. Please try again tomorrow or contact research@biomap.com.', 'err'); return; }
      log.count += 1;
      log.next = Date.now() + APPLY.cooldownMs;
      writeLog(log);

      busy = true;
      btn.disabled = true;
      btn.textContent = 'Submitting…';
      say('Submitting your request. This can take up to a minute.');

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), APPLY.timeoutMs);
      try {
        let res;
        try {
          res = await fetch(form.dataset.endpoint, {
            method: 'POST',
            credentials: 'omit',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: form.email.value,
              username: form.username.value,
              organization: form.organization.value,
            }),
            signal: ctrl.signal,
          });
        } catch {
          say('The request did not complete, so the result is unknown. Please check your email before submitting again.', 'err');
          return;
        }
        const body = await res.json().catch(() => null);
        if (res.status === 429) {
          const wait = parseInt(res.headers.get('Retry-After'), 10) || 60;
          log.next = Date.now() + wait * 1000;
          writeLog(log);
          say(body?.message || 'Too many requests. Please try again later.', 'err');
          return;
        }
        if (!res.ok || body?.success !== true || body?.code !== 200) {
          say(body?.message || `Request failed (HTTP ${res.status}). Please try again later.`, 'err');
          return;
        }
        say(body.result?.message || body.message || 'Your request has been submitted.', 'ok');
        form.reset();
      } finally {
        clearTimeout(timer);
        busy = false;
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  }

  /* ------------------------------------------------------------------ CAB */

  function initCAB() {
    const track = $('#cabTrack');
    if (!track) return;
    const status = $('#cabStatus');
    const aLabel = $('#cabA');
    const playBtn = $('#cabPlay');
    let n = 12, step = 0, phase = 0, playing = !reduceMotion, timer = 0;

    function build() {
      n = window.matchMedia('(max-width: 600px)').matches ? 8 : 12;
      track.innerHTML = '';
      for (let i = 0; i < 12; i++) {
        const c = document.createElement('div');
        c.className = 'cab__cell';
        track.appendChild(c);
      }
    }

    function paint() {
      const cells = $$('.cab__cell', track);
      const anchor = step, body = step + 1, context = step + 2;
      cells.forEach((c, i) => {
        c.className = 'cab__cell';
        c.textContent = '';
        if (i === 0 && anchor !== 0) c.classList.add('is-ref');
        else if (i > 0 && i < anchor) c.classList.add('is-gen');
        if (i === anchor) { c.classList.add('is-anchor', 'is-window'); c.textContent = 'A'; }
        if (i === body) {
          c.classList.add('is-window');
          if (phase === 1) { c.classList.add('is-body'); c.textContent = 'B'; }
        }
        if (i === context && context < n) { c.classList.add('is-ctx', 'is-window'); c.textContent = 'C'; }
        if (i > context) c.classList.add('is-ref');
      });
      aLabel.innerHTML = step === 0 ? 'A' : 'A<sup>gen</sup>';
      const kb = (step + (phase === 1 ? 1 : 0)) * 8;
      status.textContent = phase === 0
        ? `Round ${step + 1}: prompt with Context + Anchor`
        : `Round ${step + 1}: Body generated · ${kb} kb written`;
    }

    function advance() {
      if (phase === 0) { phase = 1; }
      else if (step + 2 < n) { step += 1; phase = 0; }
      else { step = 0; phase = 0; }
      paint();
    }

    function loop() {
      clearInterval(timer);
      if (playing) timer = setInterval(advance, 1100);
      playBtn.textContent = playing ? 'Pause' : 'Play';
      playBtn.setAttribute('aria-pressed', String(playing));
    }

    playBtn.addEventListener('click', () => { playing = !playing; loop(); });
    $('#cabStep').addEventListener('click', () => { playing = false; loop(); advance(); });
    $('#cabReset').addEventListener('click', () => { step = 0; phase = 0; paint(); });
    window.addEventListener('resize', () => {
      const m = window.matchMedia('(max-width: 600px)').matches ? 8 : 12;
      if (m !== n) { build(); step = 0; phase = 0; paint(); }
    });

    build();
    paint();
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) loop(); else clearInterval(timer);
    }).observe(track);
  }

  /* ----------------------------------------------- interactive lab helpers */

  const SVGNS = 'http://www.w3.org/2000/svg';
  const INK = '#252f3b', TEAL = '#04998c', TEAL_DEEP = '#046b62', AMBER = '#f0990a';

  function el(tag, attrs, html) {
    const node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
    if (html != null) node.innerHTML = html;
    return node;
  }
  function svg(tag, attrs, text) {
    const node = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
    if (text != null) node.textContent = text;
    return node;
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function onVisible(node, cb, once) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { cb(); if (once !== false) io.disconnect(); } });
    }, { threshold: 0.25 });
    io.observe(node);
  }
  function segControl(root, onPick) {
    if (!root) return;
    root.addEventListener('click', (ev) => {
      const btn = ev.target.closest('button');
      if (!btn || btn.classList.contains('is-on')) return;
      $$('button', root).forEach((b) => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      onPick(btn);
    });
  }

  /* ------------------------------------------------- attention head roles */

  function initHeads() {
    const host = $('#heads');
    const canvas = $('#maskCanvas');
    const note = $('#maskNote');
    if (!host || !canvas) return;
    const ctx = canvas.getContext('2d');
    const N = 24, WIN = 6;

    function drawMask(kind) {
      const size = canvas.width, cell = size / N;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = 'rgba(37,47,59,.035)';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const on = kind === 'fa' ? j <= i : (j <= i && i - j < WIN);
          if (!on) continue;
          const d = kind === 'fa' ? 0.22 + 0.5 * (1 - (i - j) / N) : 0.45 + 0.5 * (1 - (i - j) / WIN);
          ctx.fillStyle = kind === 'fa' ? `rgba(4,153,140,${d.toFixed(3)})` : `rgba(29,78,216,${d.toFixed(3)})`;
          ctx.fillRect(j * cell + 0.5, i * cell + 0.5, cell - 1, cell - 1);
        }
      }
      ctx.strokeStyle = 'rgba(37,47,59,.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    }

    const notes = {
      swa: '<b style="color:#1d4ed8">Sliding-window attention</b> — sees only nearby tokens, so cost grows linearly with length. Captures local sequence patterns.',
      fa: '<b style="color:#046b62">Full attention</b> — can look back across every previous token to hold long-range dependencies, at quadratic cost.',
    };

    for (let i = 0; i < 32; i++) {
      const isFA = i >= 24;
      host.appendChild(el('button', {
        class: 'head' + (isFA ? ' head--fa' : ''), type: 'button', role: 'listitem',
        'data-kind': isFA ? 'fa' : 'swa',
        'aria-label': (isFA ? 'Full-attention head ' : 'Sliding-window attention head ') + (i + 1),
      }, String(i + 1)));
    }

    function activate(kind, node) {
      $$('.head', host).forEach((h) => h.classList.remove('is-on'));
      if (node) node.classList.add('is-on');
      drawMask(kind);
      note.innerHTML = notes[kind];
    }
    host.addEventListener('mouseover', (ev) => { const h = ev.target.closest('.head'); if (h) activate(h.getAttribute('data-kind'), h); });
    host.addEventListener('focusin', (ev) => { const h = ev.target.closest('.head'); if (h) activate(h.getAttribute('data-kind'), h); });

    drawMask('swa');
    note.innerHTML = 'Every block uses 24 SWA heads on a short window and 8 FA heads. Hover a head to see its mask.';
  }

  /* ---------------------------------------------------- MoE expert routing */

  const SPECIES = [
    { id: 'human', name: 'Human', tag: 'Homo sapiens [TaxID 9606]', seed: 11 },
    { id: 'maize', name: 'Maize', tag: 'Zea mays [TaxID 4577]', seed: 29 },
    { id: 'yeast', name: 'Yeast', tag: 'S. cerevisiae [TaxID 4932]', seed: 41 },
    { id: 'ecoli', name: 'E. coli', tag: 'E. coli [TaxID 562]', seed: 53 },
    { id: 'none', name: 'No label', tag: 'unlabeled', seed: 71 },
  ];

  function initRouting() {
    const host = $('#moeViz');
    const tabs = $('#routeSpecies');
    const note = $('#routeNote');
    if (!host || !tabs) return;

    SPECIES.forEach((s, i) => tabs.appendChild(el('button', { type: 'button', 'data-sp': s.id, class: i === 0 ? 'is-on' : '' }, s.name)));

    const W = 520, H = 300, EXPERTS = 9;
    const root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H });
    host.appendChild(root);

    const defs = svg('defs');
    const grad = svg('linearGradient', { id: 'routeGrad', x1: '0', y1: '0', x2: '1', y2: '0' });
    grad.appendChild(svg('stop', { offset: '0', 'stop-color': TEAL }));
    grad.appendChild(svg('stop', { offset: '1', 'stop-color': AMBER }));
    defs.appendChild(grad);
    root.appendChild(defs);

    const rand = rng(5);
    const tokenY = [];
    for (let i = 0; i < 8; i++) {
      const y = 26 + i * 32;
      tokenY.push(y);
      const b = BASES[Math.floor(rand() * 4)];
      root.appendChild(svg('rect', { x: 8, y: y - 11, width: 30, height: 22, rx: 6, fill: BASE_COLORS[b], 'fill-opacity': '.12', stroke: BASE_COLORS[b], 'stroke-opacity': '.5' }));
      const t = svg('text', { x: 23, y: y + 4, 'text-anchor': 'middle', fill: BASE_COLORS[b] }, b);
      t.setAttribute('class', 'token-pill');
      root.appendChild(t);
      root.appendChild(svg('path', { d: 'M40 ' + y + ' C 80 ' + y + ', 110 150, 150 150', stroke: 'rgba(37,47,59,.16)', fill: 'none', 'stroke-width': '1' }));
    }

    const tagRect = svg('rect', { x: 148, y: 42, width: 176, height: 26, rx: 13, fill: 'rgba(181,98,155,.1)', stroke: 'rgba(181,98,155,.45)' });
    root.appendChild(tagRect);
    const tagText = svg('text', { x: 236, y: 59, 'text-anchor': 'middle', fill: '#9c437f' }, '');
    root.appendChild(tagText);
    root.appendChild(svg('path', { d: 'M236 68 L236 118', stroke: 'rgba(181,98,155,.45)', 'stroke-dasharray': '3 3' }));

    root.appendChild(svg('rect', { x: 158, y: 120, width: 156, height: 60, rx: 14, fill: 'rgba(4,153,140,.08)', stroke: 'rgba(4,153,140,.45)' }));
    const rt = svg('text', { x: 236, y: 146, 'text-anchor': 'middle', fill: TEAL_DEEP }, 'Species-informed router');
    rt.setAttribute('class', 'lbl');
    root.appendChild(rt);
    root.appendChild(svg('text', { x: 236, y: 165, 'text-anchor': 'middle', fill: '#6b7684' }, '1 shared + 8 routed'));

    const experts = [], paths = [];
    for (let e = 0; e < EXPERTS; e++) {
      const ey = 22 + e * 32;
      const shared = e === 0;
      const path = svg('path', { d: 'M314 150 C 350 150, 360 ' + ey + ', 396 ' + ey, fill: 'none', stroke: 'rgba(37,47,59,.12)', 'stroke-width': '1.2' });
      root.appendChild(path);
      paths.push(path);
      const g = svg('g', { class: 'expert' });
      g.appendChild(svg('rect', { x: 396, y: ey - 12, width: 108, height: 24, rx: 8, fill: shared ? 'rgba(14,139,168,.12)' : 'rgba(37,47,59,.04)', stroke: shared ? 'rgba(14,139,168,.5)' : 'rgba(37,47,59,.14)' }));
      const lab = svg('text', { x: 408, y: ey + 4, fill: shared ? '#0b6f86' : '#6b7684' }, shared ? 'shared expert' : 'expert ' + e);
      g.appendChild(lab);
      root.appendChild(g);
      experts.push({ g, rect: g.firstChild, text: lab, y: ey, shared });
    }

    const dots = [];
    for (let d = 0; d < 14; d++) {
      const c = svg('circle', { r: 2.6, fill: 'url(#routeGrad)', opacity: '0' });
      root.appendChild(c);
      dots.push({ node: c, p: Math.random(), target: 0 });
    }

    let active = [];
    function pick(sp) {
      const r = rng(sp.seed);
      active = [0];
      const pool = [];
      for (let i = 1; i < EXPERTS; i++) pool.push(i);
      const k = sp.id === 'none' ? 2 : 3;
      for (let n = 0; n < k; n++) active.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
      experts.forEach((x, i) => {
        const on = active.indexOf(i) >= 0;
        x.rect.setAttribute('fill', on ? (x.shared ? 'rgba(14,139,168,.2)' : 'rgba(4,153,140,.18)') : 'rgba(37,47,59,.03)');
        x.rect.setAttribute('stroke', on ? (x.shared ? 'rgba(14,139,168,.85)' : 'rgba(4,153,140,.75)') : 'rgba(37,47,59,.1)');
        x.text.setAttribute('fill', on ? INK : '#8b95a3');
        x.g.style.opacity = on ? '1' : '.7';
      });
      paths.forEach((p, i) => {
        const on = active.indexOf(i) >= 0;
        p.setAttribute('stroke', on ? 'rgba(4,153,140,.55)' : 'rgba(37,47,59,.07)');
        p.setAttribute('stroke-width', on ? '1.8' : '1');
      });
      tagText.textContent = sp.tag;
      tagRect.setAttribute('stroke', sp.id === 'none' ? 'rgba(37,47,59,.22)' : 'rgba(181,98,155,.45)');
      note.innerHTML = sp.id === 'none'
        ? 'Without a species label, routing falls back to a lineage-agnostic set of experts, and the GC content of generated sequence collapses to a baseline near 39%.'
        : 'DeepD-60B holds <b>576 experts</b>, one shared, and activates <b style="color:#046b62">8 per token</b>; the nine drawn here stand in for that pool, and the indices are illustrative. The species label allocates capacity across lineages, so the same stretch of sequence is handled by a different combination of experts under a different species.';
    }

    segControl(tabs, (btn) => pick(SPECIES.filter((s) => s.id === btn.getAttribute('data-sp'))[0]));
    pick(SPECIES[0]);

    if (reduceMotion) return;
    (function loop() {
      dots.forEach((d, i) => {
        d.p += 0.006 + (i % 3) * 0.0016;
        if (d.p > 1) { d.p -= 1; d.target = active[Math.floor(Math.random() * active.length)]; }
        const ey = experts[d.target || 0].y;
        const p = d.p;
        let x, y;
        if (p < 0.42) {
          const q = p / 0.42, m = 1 - q, ty = tokenY[i % tokenY.length];
          x = m * m * m * 40 + 3 * m * m * q * 80 + 3 * m * q * q * 110 + q * q * q * 150;
          y = m * m * m * ty + 3 * m * m * q * ty + 3 * m * q * q * 150 + q * q * q * 150;
        } else {
          const q = (p - 0.42) / 0.58, m = 1 - q;
          x = m * m * m * 314 + 3 * m * m * q * 350 + 3 * m * q * q * 360 + q * q * q * 396;
          y = m * m * m * 150 + 3 * m * m * q * 150 + 3 * m * q * q * ey + q * q * q * ey;
        }
        d.node.setAttribute('cx', x.toFixed(1));
        d.node.setAttribute('cy', y.toFixed(1));
        d.node.setAttribute('opacity', (p > 0.05 && p < 0.95 ? 0.9 : 0).toString());
      });
      requestAnimationFrame(loop);
    })();
  }

  /* ------------------------------------------------ GC expert heatmap */

  function initGcHeat() {
    const canvas = $('#gcHeat');
    const range = $('#gcRange');
    if (!canvas || !range) return;
    const ctx = canvas.getContext('2d');
    const ROWS = 22, COLS = 64, GAP = 18;
    const noise = [];
    const rand = rng(97);
    for (let r = 0; r < ROWS; r++) { noise[r] = []; for (let c = 0; c < COLS; c++) noise[r][c] = rand(); }

    function zAt(r, c) {
      const gcNorm = c / (COLS - 1);
      const isAT = r < ROWS / 2;
      const base = isAT ? (0.5 - gcNorm) : (gcNorm - 0.5);
      const strength = 0.65 + 0.35 * noise[r][(c + r) % COLS];
      return Math.max(-1, Math.min(1, base * 2.5 * strength + (noise[r][c] - 0.5) * 0.28));
    }
    function color(z) {
      const t = Math.min(1, Math.abs(z));
      if (z >= 0) return 'rgb(255,' + Math.round(255 - 215 * t) + ',' + Math.round(255 - 217 * t) + ')';
      return 'rgb(' + Math.round(255 - 210 * t) + ',' + Math.round(255 - 150 * t) + ',' + Math.round(255 - 40 * t) + ')';
    }

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    function draw() {
      const w = canvas.clientWidth || 520, h = 300;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const padL = 96, padR = 12, padT = 10, padB = 10;
      const cw = (w - padL - padR) / COLS;
      const ch = (h - padT - padB - GAP) / ROWS;
      for (let r = 0; r < ROWS; r++) {
        const y = padT + r * ch + (r >= ROWS / 2 ? GAP : 0);
        for (let c = 0; c < COLS; c++) { ctx.fillStyle = color(zAt(r, c)); ctx.fillRect(padL + c * cw, y, cw + 0.6, ch + 0.6); }
      }
      ctx.fillStyle = '#c2352f'; ctx.font = '600 11px ui-monospace, monospace'; ctx.textAlign = 'right';
      ctx.fillText('AT-activated', padL - 10, padT + (ROWS / 4) * ch + 4);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillText('GC-activated', padL - 10, padT + GAP + (ROWS * 0.75) * ch + 4);
      const gc = parseInt(range.value, 10) / 10;
      const q = (gc - 25) / 50;
      const mx = padL + q * (w - padL - padR);
      ctx.strokeStyle = 'rgba(4,153,140,.95)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(mx, padT - 4); ctx.lineTo(mx, h - padB + 2); ctx.stroke();
      ctx.fillStyle = 'rgba(4,153,140,.95)';
      ctx.beginPath(); ctx.moveTo(mx - 5, padT - 5); ctx.lineTo(mx + 5, padT - 5); ctx.lineTo(mx, padT + 2); ctx.closePath(); ctx.fill();
      const col = Math.max(0, Math.min(COLS - 1, Math.round(q * (COLS - 1))));
      let at = 0, gcv = 0;
      for (let i = 0; i < ROWS / 2; i++) at += zAt(i, col);
      for (let j = ROWS / 2; j < ROWS; j++) gcv += zAt(j, col);
      at /= ROWS / 2; gcv /= ROWS / 2;
      $('#gcVal').textContent = gc.toFixed(1) + '%';
      $('#atExperts').textContent = (at >= 0 ? '+' : '') + at.toFixed(2);
      $('#gcExperts').textContent = (gcv >= 0 ? '+' : '') + gcv.toFixed(2);
      $('#atExperts').style.color = at >= 0 ? '#c2352f' : '#1d4ed8';
      $('#gcExperts').style.color = gcv >= 0 ? '#c2352f' : '#1d4ed8';
    }
    range.addEventListener('input', draw);
    window.addEventListener('resize', draw);
    draw();
    onVisible(canvas, () => {
      if (reduceMotion) return;
      let v = 250, dir = 1, steps = 0;
      const timer = setInterval(() => {
        v += dir * 9;
        if (v > 750) { v = 750; dir = -1; }
        range.value = v; draw();
        if (++steps > 56) clearInterval(timer);
      }, 22);
    });
  }

  /* ------------------------------------------------ generated GC scatter */

  const GC_POINTS = [
    { name: 'C. elegans', gc: 35.6, gen: 36.7 }, { name: 'S. cerevisiae', gc: 38.4, gen: 40.1 },
    { name: 'O. aries', gc: 41.8, gen: 41.5 }, { name: 'S. scrofa', gc: 41.8, gen: 41.5 },
    { name: 'M. musculus', gc: 41.8, gen: 41.5 }, { name: 'C. bacterium', gc: 42.8, gen: 43.3 },
    { name: 'O. sativa', gc: 43.0, gen: 41.8 }, { name: 'G. bacterium', gc: 44.3, gen: 45.0 },
    { name: 'A. bacterium', gc: 46.0, gen: 44.9 }, { name: 'C. bacterium', gc: 46.4, gen: 44.7 },
    { name: 'C. bacterium', gc: 57.5, gen: 55.0 },
  ];

  function initGcScatter() {
    const root = $('#gcScatter');
    if (!root) return;
    const W = 520, H = 260, padL = 46, padB = 34, padT = 12, padR = 14;
    const lo = 34, hi = 60;
    const sx = (v) => padL + ((v - lo) / (hi - lo)) * (W - padL - padR);
    const sy = (v) => H - padB - ((v - lo) / (hi - lo)) * (H - padB - padT);

    clear(root);
    root.setAttribute('class', 'chart');
    for (let g = 35; g <= 60; g += 5) {
      root.appendChild(svg('line', { x1: sx(g), y1: padT, x2: sx(g), y2: H - padB, class: 'grid-line' }));
      root.appendChild(svg('line', { x1: padL, y1: sy(g), x2: W - padR, y2: sy(g), class: 'grid-line' }));
      root.appendChild(svg('text', { x: sx(g), y: H - padB + 14, 'text-anchor': 'middle' }, g + '%'));
      root.appendChild(svg('text', { x: padL - 8, y: sy(g) + 3, 'text-anchor': 'end' }, g + '%'));
    }
    root.appendChild(svg('line', { x1: sx(lo), y1: sy(lo), x2: sx(hi), y2: sy(hi), stroke: 'rgba(37,47,59,.3)', 'stroke-dasharray': '4 4' }));
    root.appendChild(svg('line', { x1: padL, y1: sy(39.2), x2: W - padR, y2: sy(39.2), stroke: 'rgba(240,153,10,.75)', 'stroke-dasharray': '2 4' }));
    root.appendChild(svg('text', { x: W - padR - 2, y: sy(39.2) - 6, 'text-anchor': 'end', fill: '#b26a00' }, 'no-label baseline ≈ 39%'));
    root.appendChild(svg('text', { x: (W + padL) / 2, y: H - 4, 'text-anchor': 'middle', class: 'lbl' }, 'Natural genomic GC content'));
    const yl = svg('text', { x: 14, y: (H - padB + padT) / 2, 'text-anchor': 'middle', class: 'lbl' }, 'Generated GC content');
    yl.setAttribute('transform', 'rotate(-90 14 ' + ((H - padB + padT) / 2) + ')');
    root.appendChild(yl);

    const rand = rng(1337);
    const pts = GC_POINTS.map((p) => {
      const node = svg('circle', { cx: sx(p.gc), cy: sy(p.gen), r: 4.6, fill: 'rgba(4,153,140,.75)', stroke: TEAL_DEEP, 'stroke-width': '1' });
      node.style.transition = 'cy .8s cubic-bezier(.2,.8,.2,1), fill .5s';
      node.appendChild(svg('title', {}, p.name + ' · generated GC ' + p.gen + '%'));
      root.appendChild(node);
      const mark = svg('path', { d: 'M' + sx(p.gc) + ' ' + (sy(p.gc) - 5) + ' l5 5 l-5 5 l-5 -5 z', fill: 'rgba(37,47,59,.85)' });
      mark.appendChild(svg('title', {}, p.name + ' · natural GC ' + p.gc + '%'));
      root.appendChild(mark);
      return { node, y: sy(p.gen), base: sy(39.2 + (rand() - 0.5) * 1.6) };
    });

    segControl($('#tagMode'), (btn) => {
      const on = btn.getAttribute('data-tag') === 'on';
      pts.forEach((o) => {
        o.node.setAttribute('cy', on ? o.y : o.base);
        o.node.setAttribute('fill', on ? 'rgba(4,153,140,.75)' : 'rgba(240,153,10,.7)');
        o.node.setAttribute('stroke', on ? TEAL_DEEP : '#b26a00');
      });
    });
  }

  /* ------------------------------------------------------------- lightbox */

  function initLightbox() {
    const lb = $('#lightbox');
    const img = $('#lbImg');
    const cap = $('#lbCap');
    const fullBtn = $('#lbFull');
    const zoomBtn = $('#lbZoom');
    let lastFocus = null, full = '';

    function open(src, caption, fullKey) {
      lastFocus = document.activeElement;
      img.src = src;
      img.alt = caption;
      cap.textContent = caption;
      full = fullKey || '';
      fullBtn.hidden = !full;
      lb.classList.remove('is-zoomed');
      zoomBtn.textContent = 'Zoom';
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      $('#lbClose').focus();
    }
    function close() {
      lb.hidden = true;
      document.body.style.overflow = '';
      img.removeAttribute('src');
      if (lastFocus) lastFocus.focus();
    }
    function toggleZoom() {
      const z = lb.classList.toggle('is-zoomed');
      zoomBtn.textContent = z ? 'Fit' : 'Zoom';
    }

    document.addEventListener('click', (e) => {
      const target = e.target.closest('.zoomable img');
      if (!target) return;
      open(target.currentSrc || target.src, target.dataset.caption || target.alt, target.dataset.full);
    });
    fullBtn.addEventListener('click', () => {
      const num = full.split('-')[1];
      img.src = `assets/fig/${full}.webp`;
      cap.textContent = `Figure ${num}, full figure.`;
      img.alt = cap.textContent;
      fullBtn.hidden = true;
      lb.classList.remove('is-zoomed');
      zoomBtn.textContent = 'Zoom';
    });
    zoomBtn.addEventListener('click', toggleZoom);
    img.addEventListener('click', toggleZoom);
    $('#lbClose').addEventListener('click', close);
    $('#lbStage').addEventListener('click', (e) => { if (e.target.id === 'lbStage') close(); });
    document.addEventListener('keydown', (e) => { if (!lb.hidden && e.key === 'Escape') close(); });
  }

  /* ------------------------------------------------------------- citation */

  function initCite() {
    const btn = $('#copyCite');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const text = $('#citeCode').textContent;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const r = document.createRange();
        r.selectNodeContents($('#citeCode'));
        const s = window.getSelection();
        s.removeAllRanges(); s.addRange(r);
        document.execCommand('copy');
        s.removeAllRanges();
      }
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = 'Copy BibTeX'; }, 1600);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPreprint();
    initNav();
    initReveal();
    initCounters();
    initHelix();
    initTicker();
    initCorpus();
    initLadder();
    initExplorers();
    initHeads();
    initRouting();
    initGcHeat();
    initGcScatter();
    initBench();
    initReg();
    initApply();
    initCAB();
    initLightbox();
    initCite();
  });
})();
