/* ──────────────────────────────────────────────────────
   SEARCH — tiny client-side search over posts,
   projects and arcade games (index: /search.json).
   ────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const count = document.getElementById('search-count');
  if (!input || !results) return;

  let index = null;

  fetch(input.dataset.index)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      index = data.map(function (d) {
        return Object.assign({}, d, {
          lcTitle: d.title.toLowerCase(),
          lcText: (d.text || '').toLowerCase(),
          lcCat: (d.category || '').toLowerCase(),
        });
      });
      run();
    })
    .catch(function () {
      count.textContent = 'Search index could not be loaded.';
    });

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function excerptAround(text, term) {
    const i = text.toLowerCase().indexOf(term);
    if (i < 0) return text.slice(0, 140) + (text.length > 140 ? '…' : '');
    const start = Math.max(0, i - 60);
    const end = Math.min(text.length, i + term.length + 80);
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }

  function search(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const scored = [];
    for (const d of index) {
      let score = 0;
      let ok = true;
      for (const t of terms) {
        let s = 0;
        if (d.lcTitle.indexOf(t) >= 0) s += 6;
        if (d.lcCat.indexOf(t) >= 0) s += 3;
        if (d.lcText.indexOf(t) >= 0) s += 1;
        if (!s) { ok = false; break; }
        score += s;
      }
      if (ok) scored.push({ d: d, score: score });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 20);
  }

  function render(q) {
    results.innerHTML = '';
    if (!q.trim()) {
      count.textContent = index ? index.length + ' pages indexed — start typing.' : '';
      return;
    }
    const hits = search(q);
    count.textContent = hits.length
      ? hits.length + (hits.length === 1 ? ' result' : ' results')
      : 'No results for “' + q + '”.';

    const firstTerm = q.toLowerCase().split(/\s+/)[0] || '';
    for (const h of hits) {
      const a = document.createElement('a');
      a.className = 'search-hit';
      a.href = h.d.url;
      a.innerHTML =
        '<span class="card-label">' + escapeHtml(h.d.type) +
        (h.d.category ? ' · ' + escapeHtml(h.d.category) : '') +
        ' · ' + escapeHtml(h.d.date) + '</span>' +
        '<span class="search-hit-title">' + escapeHtml(h.d.title) + '</span>' +
        '<span class="search-hit-text">' + escapeHtml(excerptAround(h.d.text || '', firstTerm)) + '</span>';
      results.appendChild(a);
    }
  }

  function run() {
    const q = input.value;
    render(q);
    const url = new URL(window.location);
    if (q.trim()) url.searchParams.set('q', q);
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }

  let deb;
  input.addEventListener('input', function () {
    clearTimeout(deb);
    deb = setTimeout(run, 120);
  });

  const initial = new URLSearchParams(window.location.search).get('q');
  if (initial) input.value = initial;
})();
