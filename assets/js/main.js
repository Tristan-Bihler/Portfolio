(function () {
  'use strict';

  var nav = document.getElementById('site-nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 48);
    }, { passive: true });
  }

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.anim').forEach(function (el) {
      obs.observe(el);
    });
  } else {
    document.querySelectorAll('.anim').forEach(function (el) {
      el.classList.add('visible');
    });
  }
})();
