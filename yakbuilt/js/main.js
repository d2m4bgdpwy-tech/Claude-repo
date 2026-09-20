/* Yakbuilt, LLC — site behaviour. No dependencies. */
(function () {
  'use strict';

  /* --- Mobile navigation ------------------------------------------------ */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggle.focus();
      }
    });
  }

  /* --- Header shadow on scroll ------------------------------------------ */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- Reveal on scroll -------------------------------------------------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.reveal');

  if (!reduced && 'IntersectionObserver' in window && targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* --- Current year in the footer ---------------------------------------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  /* --- Bid request form --------------------------------------------------
     The form posts to whatever endpoint is set in the <form action="">.
     Until a real endpoint is connected it falls back to opening the
     visitor's mail client with the message pre-filled, so no lead is lost.
     ---------------------------------------------------------------------- */
  var form = document.querySelector('[data-bid-form]');
  if (form) {
    var status = form.querySelector('.form-status');

    form.addEventListener('submit', function (e) {
      var action = form.getAttribute('action') || '';
      var isPlaceholder = action === '' || action.indexOf('REPLACE_WITH') !== -1;
      if (!isPlaceholder) return; // a real endpoint is wired up — let it post

      e.preventDefault();
      if (!form.reportValidity()) return;

      var data = new FormData(form);
      var lines = [];
      data.forEach(function (value, key) {
        if (String(value).trim() === '') return;
        var label = key.replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        lines.push(label + ': ' + value);
      });

      var to = form.dataset.mailto || 'office@yakbuilt.com';
      var subject = 'Bid request — ' + (data.get('project') || 'Yakbuilt.com');
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));

      if (status) {
        status.textContent = 'Opening your email app with these details attached. ' +
          'If nothing happens, send the same information to ' + to + '.';
        status.classList.add('is-visible');
      }
    });
  }
})();
