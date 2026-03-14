/**
 * Lupon InRead v1 — Vanilla JS wrapper around Fluid Player
 * Scans for div[data-lupon-inread], IntersectionObserver trigger, lazy-loads Fluid Player, VAST from data-* attrs.
 * cdn.luponmedia.com/inread/v1/player.js
 */
(function () {
  'use strict';

  var SLOT_SEL = 'div[data-lupon-inread]';
  var VAST_BASE = 'https://vast.luponmedia.com/v1';
  var DEFAULT_FLOOR = '0.10';
  var fluidScriptLoaded = false;
  var fluidScriptLoading = null;

  function getScriptBase() {
    var s = document.currentScript;
    return (s && s.src) ? s.src.replace(/\/[^/]+$/, '/') : '';
  }

  function loadFluidPlayer(base, done) {
    if (typeof window.fluidPlayer === 'function') {
      done();
      return;
    }
    if (fluidScriptLoading) {
      fluidScriptLoading.then(done);
      return;
    }
    var script = document.createElement('script');
    script.src = base + 'fluidplayer.min.js';
    script.async = true;
    fluidScriptLoading = new Promise(function (resolve) {
      script.onload = function () {
        fluidScriptLoaded = true;
        resolve();
        done();
      };
      script.onerror = function () {
        done(new Error('Fluid Player failed to load'));
      };
    });
    document.head.appendChild(script);
  }

  function buildVastUrl(pubId, siteId, floor) {
    var params = new URLSearchParams();
    if (pubId) params.set('pub', pubId);
    if (siteId) params.set('site', siteId);
    params.set('floor', floor != null && floor !== '' ? String(floor) : DEFAULT_FLOOR);
    params.set('pos', 'inread');
    return VAST_BASE + '?' + params.toString();
  }

  function collapseSlot(slot) {
    if (slot && slot.style) {
      slot.style.display = 'none';
      slot.style.height = '0';
      slot.style.overflow = 'hidden';
    }
  }

  function initSlot(slot, index) {
    if (slot._luponInreadInit) return;
    slot._luponInreadInit = true;

    var pubId = slot.getAttribute('data-pub-id') || '';
    var siteId = slot.getAttribute('data-site-id') || '';
    var floor = slot.getAttribute('data-floor');
    var vastUrl = buildVastUrl(pubId, siteId, floor);

    var videoId = 'lupon-inread-' + index + '-' + Math.random().toString(36).slice(2, 9);
    var video = document.createElement('video');
    video.id = videoId;
    video.setAttribute('playsinline', '');
    video.className = 'lupon-inread-video';
    slot.innerHTML = '';
    slot.appendChild(video);

    var base = getScriptBase();
    loadFluidPlayer(base, function (err) {
      if (err) {
        collapseSlot(slot);
        return;
      }
      try {
        var instance = window.fluidPlayer(videoId, {
          vastOptions: {
            adList: [{ roll: 'preRoll', vastTag: vastUrl }]
          },
          layoutControls: {
            autoPlay: true,
            mute: true
          }
        });
        slot._luponPlayer = instance;
        slot._luponVideo = video;
        if (instance && instance.vast && typeof instance.vast.getVastResponse === 'function') {
          instance.vast.on('vastNoFill', function () { collapseSlot(slot); });
        }
        if (instance && instance.vast && instance.vast.vastPlayer) {
          instance.vast.vastPlayer.on('error', function () { collapseSlot(slot); });
        }
        video.addEventListener('error', function () {
          if (video.error && video.error.code >= 2) collapseSlot(slot);
        });
      } catch (e) {
        collapseSlot(slot);
      }
    });
  }

  function setupPauseResume(slot) {
    var video = slot._luponVideo;
    if (!video) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.target !== slot) return;
          if (entry.isIntersecting) {
            if (video && video.play) video.play().catch(function () {});
          } else {
            if (video && video.pause) video.pause();
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    io.observe(slot);
    slot._luponPauseResumeObserver = io;
  }

  function run() {
    var base = getScriptBase();
    var slots = document.querySelectorAll(SLOT_SEL);
    var index = 0;
    slots.forEach(function (slot) {
      var i = index++;
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.target !== slot || !entry.isIntersecting) return;
            observer.disconnect();
            slot._luponTriggered = true;
            initSlot(slot, i);
            setTimeout(function () { setupPauseResume(slot); }, 1500);
          });
        },
        { threshold: 0.5 }
      );
      observer.observe(slot);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
