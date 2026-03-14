/**
 * Lupon InRead v1 — Vanilla JS wrapper around Fluid Player
 * cdn.luponmedia.com/inread/v1/player.js
 */
(function () {
  'use strict';

  var SLOT_SEL = 'div[data-lupon-inread]';
  var VAST_BASE = 'https://vast.luponmedia.com/v1';
  var DEFAULT_FLOOR = '0.10';
  var fluidScriptLoading = null;

  function getScriptBase() {
    var s = document.currentScript;
    return (s && s.src) ? s.src.replace(/\/[^/]+$/, '/') : '';
  }

  function loadFluidPlayer(base, done) {
    if (typeof window.fluidPlayer === 'function') { done(); return; }
    if (fluidScriptLoading) { fluidScriptLoading.then(function(){ done(); }); return; }
    var script = document.createElement('script');
    script.src = base + 'fluidplayer.min.js';
    script.async = true;
    fluidScriptLoading = new Promise(function (resolve) {
      script.onload = function () { resolve(); done(); };
      script.onerror = function () { done(new Error('fluidplayer.min.js failed to load')); };
    });
    document.head.appendChild(script);
  }

  function buildVastUrl(pubId, siteId, floor) {
    var p = [];
    if (pubId) p.push('pub=' + encodeURIComponent(pubId));
    if (siteId) p.push('site=' + encodeURIComponent(siteId));
    p.push('floor=' + encodeURIComponent(floor || DEFAULT_FLOOR));
    p.push('pos=inread');
    return VAST_BASE + '?' + p.join('&');
  }

  function collapseSlot(slot) {
    slot.style.display = 'none';
    slot.style.height = '0';
    slot.style.overflow = 'hidden';
  }

  function initSlot(slot, index) {
    if (slot._luponInit) return;
    slot._luponInit = true;

    var pubId  = slot.getAttribute('data-pub-id')   || '';
    var siteId = slot.getAttribute('data-site-id')  || '';
    var floor  = slot.getAttribute('data-floor')    || DEFAULT_FLOOR;
    var vastUrl = buildVastUrl(pubId, siteId, floor);

    // Create video element
    var videoId = 'lupon-ir-' + index + '-' + Math.random().toString(36).slice(2, 8);
    var video = document.createElement('video');
    video.id = videoId;
    video.setAttribute('playsinline', '');
    video.style.width = '100%';
    slot.innerHTML = '';
    slot.appendChild(video);
    slot._luponVideo = video;

    var base = getScriptBase();
    loadFluidPlayer(base, function (err) {
      if (err) { collapseSlot(slot); return; }

      try {
        window.fluidPlayer(videoId, {
          vastOptions: {
            adList: [{ roll: 'preRoll', vastTag: vastUrl }],
            // Fluid Player fires vastError callback on no-fill / error
            vastAdvError: function () { collapseSlot(slot); },
            vastTimeout: 5000
          },
          layoutControls: {
            autoPlay: true,
            mute: true,
            fillToContainer: true
          }
        });
      } catch (e) {
        collapseSlot(slot);
      }

      // Collapse on video element error (network / decode)
      video.addEventListener('error', function () {
        if (video.error && video.error.code >= 2) collapseSlot(slot);
      });
    });
  }

  function setupPauseResume(slot) {
    var video = slot._luponVideo;
    if (!video) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          video.play && video.play().catch(function(){});
        } else {
          video.pause && video.pause();
        }
      });
    }, { threshold: 0.3 }).observe(slot);
  }

  function run() {
    var base = getScriptBase();
    var slots = document.querySelectorAll(SLOT_SEL);
    slots.forEach(function (slot, i) {
      // Trigger observer — fires once at 50% viewport
      var trigger = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          trigger.disconnect();
          initSlot(slot, i);
          // Setup pause/resume after player has had time to init
          setTimeout(function () { setupPauseResume(slot); }, 1000);
        });
      }, { threshold: 0.5 });
      trigger.observe(slot);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
