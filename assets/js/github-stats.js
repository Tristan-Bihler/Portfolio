/* ──────────────────────────────────────────────────────
   GITHUB STATS — live activity on the projects page.
   Unauthenticated API (60 req/h per IP); the whole
   section stays hidden if the API is unreachable.
   ────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const root = document.getElementById('gh-stats');
  if (!root) return;
  const user = root.dataset.user;

  const LANG_COLORS = {
    Python: '#c95b38', 'C++': '#a33d1e', C: '#a33d1e',
    JavaScript: '#d96b42', HTML: '#4a4540', SCSS: '#4a4540', CSS: '#4a4540',
  };

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function timeAgo(iso) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days < 1) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return days + ' days ago';
    if (days < 365) return Math.floor(days / 30) + ' months ago';
    return Math.floor(days / 365) + ' years ago';
  }

  Promise.all([
    fetch('https://api.github.com/users/' + user).then(function (r) { if (!r.ok) throw 0; return r.json(); }),
    fetch('https://api.github.com/users/' + user + '/repos?per_page=100&sort=updated').then(function (r) { if (!r.ok) throw 0; return r.json(); }),
  ]).then(function (res) {
    const profile = res[0];
    const repos = res[1].filter(function (r) { return !r.fork; });
    const stars = repos.reduce(function (a, r) { return a + r.stargazers_count; }, 0);

    // stat tiles
    const row = el('div', 'gh-stats-row');
    [
      [repos.length, 'Public repos'],
      [stars, 'Stars earned'],
      [profile.followers, 'Followers'],
    ].forEach(function (s) {
      row.appendChild(el('div', 'gh-stat',
        '<span class="gh-stat-num">' + s[0] + '</span>' +
        '<span class="gh-stat-label">' + s[1] + '</span>'));
    });
    root.querySelector('.gh-stats-body').appendChild(row);

    // recent repos
    const grid = el('div', 'gh-repo-grid');
    repos.slice(0, 6).forEach(function (r) {
      const lang = r.language
        ? '<span class="gh-lang"><span class="gh-lang-dot" style="background:' +
          (LANG_COLORS[r.language] || '#8a8078') + '"></span>' + esc(r.language) + '</span>'
        : '';
      const a = el('a', 'gh-repo',
        '<span class="gh-repo-name">' + esc(r.name) + '</span>' +
        '<span class="gh-repo-desc">' + esc(r.description || 'No description yet.') + '</span>' +
        '<span class="gh-repo-meta">' + lang +
        (r.stargazers_count ? '<span>★ ' + r.stargazers_count + '</span>' : '') +
        '<span>Updated ' + timeAgo(r.pushed_at) + '</span></span>');
      a.href = r.html_url;
      a.target = '_blank';
      a.rel = 'noopener';
      grid.appendChild(a);
    });
    root.querySelector('.gh-stats-body').appendChild(grid);

    root.hidden = false;
  }).catch(function () {
    /* API down or rate-limited — section simply stays hidden */
  });
})();
