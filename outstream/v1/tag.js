(function () {
  'use strict';

  var w = typeof window !== 'undefined' ? window : undefined;
  if (!w) return;
  var d = w.document;

  // ─── CONFIG ───────────────────────────────────────────────────────────────
  var cfg = Object.assign({
    publisherId:       '',
    placementId:       '',
    paragraphOffset:   3,
    paragraphSelector: 'p',
    vastUrl:           '',
    bidders:           [],
    playerHeight:      280,
    skipDelay:         5,
    bidTimeout:        1500
  }, (w.LuponOutstream && w.LuponOutstream.config) || {});

  // ─── SINGLETON GUARD ──────────────────────────────────────────────────────
  if (w.__luponOutstreamLoaded) return;
  w.__luponOutstreamLoaded = true;

  // ─── STYLES ───────────────────────────────────────────────────────────────
  function injectStyles() {
    var css = [
      '.lpo-wrap{position:relative;width:100%;max-width:640px;margin:16px auto;background:#000;overflow:hidden;border-radius:4px;box-shadow:0 2px 12px rgba(0,0,0,.35)}',
      '.lpo-wrap video{width:100%;display:block;height:' + cfg.playerHeight + 'px;object-fit:contain;background:#000}',
      '.lpo-bar{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:linear-gradient(180deg,rgba(0,0,0,.6) 0%,transparent 100%);pointer-events:none}',
      '.lpo-label{color:#fff;font:11px/1 sans-serif;opacity:.8;letter-spacing:.3px}',
      '.lpo-close{position:absolute;top:6px;right:6px;width:24px;height:24px;background:rgba(0,0,0,.55);border:none;border-radius:50%;color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:9}',
      '.lpo-skip{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.7);color:#fff;font:12px sans-serif;padding:5px 10px;border:none;border-radius:3px;cursor:pointer;z-index:9}',
      '.lpo-skip:disabled{opacity:.6;cursor:default}',
      '.lpo-progress{position:absolute;bottom:0;left:0;height:3px;background:#f60;transition:width .25s linear}',
      '.lpo-mute{position:absolute;bottom:10px;left:10px;background:rgba(0,0,0,.7);color:#fff;font:11px sans-serif;padding:5px 8px;border:none;border-radius:3px;cursor:pointer;z-index:9}'
    ].join('');
    var s = d.createElement('style');
    s.textContent = css;
    d.head.appendChild(s);
  }

  // ─── FIND INSERTION POINT ─────────────────────────────────────────────────
  function findInsertionPoint() {
    var paras = d.querySelectorAll(cfg.paragraphSelector);
    var idx = Math.min(cfg.paragraphOffset, paras.length - 1);
    return paras[idx] || null;
  }

  // ─── BUILD PLAYER (samo kad imamo potvrđen MP4 URL) ───────────────────────
  function buildPlayer(mp4Url, anchor) {
    var wrap = d.createElement('div');
    wrap.className = 'lpo-wrap';

    var video = d.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    video.autoplay = false;
    wrap.appendChild(video);

    // top bar
    var bar = d.createElement('div');
    bar.className = 'lpo-bar';
    var label = d.createElement('span');
    label.className = 'lpo-label';
    label.textContent = 'Oglas';
    bar.appendChild(label);
    wrap.appendChild(bar);

    // close btn
    var closeBtn = d.createElement('button');
    closeBtn.className = 'lpo-close';
    closeBtn.innerHTML = '&#x2715;';
    closeBtn.setAttribute('aria-label', 'Zatvori oglas');
    wrap.appendChild(closeBtn);

    // mute toggle
    var muteBtn = d.createElement('button');
    muteBtn.className = 'lpo-mute';
    muteBtn.textContent = '\uD83D\uDD07';
    wrap.appendChild(muteBtn);

    // skip btn
    var skipBtn = d.createElement('button');
    skipBtn.className = 'lpo-skip';
    skipBtn.disabled = true;
    skipBtn.textContent = 'Presko\u010di za ' + cfg.skipDelay + 's';
    wrap.appendChild(skipBtn);

    // progress bar
    var progressBar = d.createElement('div');
    progressBar.className = 'lpo-progress';
    progressBar.style.width = '0%';
    wrap.appendChild(progressBar);

    // Ubaci u DOM tek ovdje — MP4 je potvrđen
    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);

    // ── EVENT HANDLERS ──
    var skipTimer = cfg.skipDelay;
    var skipInterval;

    closeBtn.addEventListener('click', function () {
      clearInterval(skipInterval);
      video.pause();
      wrap.remove();
    });

    muteBtn.addEventListener('click', function () {
      video.muted = !video.muted;
      muteBtn.textContent = video.muted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
    });

    skipBtn.addEventListener('click', function () {
      if (!skipBtn.disabled) {
        clearInterval(skipInterval);
        video.pause();
        wrap.remove();
      }
    });

    video.addEventListener('timeupdate', function () {
      if (video.duration) {
        var pct = (video.currentTime / video.duration) * 100;
        progressBar.style.width = pct + '%';
      }
    });

    video.addEventListener('ended', function () {
      clearInterval(skipInterval);
      wrap.style.transition = 'opacity .4s';
      wrap.style.opacity = '0';
      setTimeout(function () { wrap.remove(); }, 400);
    });

    // Postavi MP4 i play
    video.src = mp4Url;
    video.load();
    video.addEventListener('canplay', function () {
      video.play().catch(function () {});
      skipInterval = setInterval(function () {
        skipTimer--;
        if (skipTimer <= 0) {
          clearInterval(skipInterval);
          skipBtn.disabled = false;
          skipBtn.textContent = 'Presko\u010di \u203a';
        } else {
          skipBtn.textContent = 'Presko\u010di za ' + skipTimer + 's';
        }
      }, 1000);
    }, { once: true });
  }

  // ─── VAST PARSER — NO-FILL GUARD ─────────────────────────────────────────
  // FIX: player se NE ubacuje u DOM dok nema potvrđen MP4 URL iz VAST-a.
  // Ako VAST vrati prazan response, nema MediaFile, ili nema MP4 —
  // korisnik ne vidi ništa (nema bliceva).
  function loadVast(vastUrl, anchor) {
    if (!vastUrl) return;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', vastUrl, true);
    xhr.onload = function () {
      if (xhr.status !== 200) return; // HTTP greška — ništa

      try {
        var parser = new DOMParser();
        var xml = parser.parseFromString(xhr.responseText, 'text/xml');
        var mediaFiles = xml.querySelectorAll('MediaFile');

        if (!mediaFiles.length) return; // prazan VAST — ništa

        var mp4Url = '';
        for (var i = 0; i < mediaFiles.length; i++) {
          var mf = mediaFiles[i];
          var type = mf.getAttribute('type') || '';
          if (type.indexOf('mp4') !== -1 || type.indexOf('video/mp4') !== -1) {
            mp4Url = (mf.textContent || '').trim();
            break;
          }
        }
        if (!mp4Url && mediaFiles.length) {
          mp4Url = (mediaFiles[0].textContent || '').trim();
        }

        if (!mp4Url) return; // nema MP4 — ništa

        // Tek sada — gradimo player
        buildPlayer(mp4Url, anchor);

      } catch (e) {
        // parse greška — ništa
      }
    };
    xhr.onerror = function () {
      // network greška — ništa
    };
    xhr.send();
  }

  // ─── PREBID AUCTION ───────────────────────────────────────────────────────
  function buildAdUnits() {
    var defaultBidders = [
      {
        bidder: 'adagio',
        params: {
          organizationId: cfg.publisherId || '1234',
          site: cfg.placementId || 'luponmedia',
          adUnitElementId: 'lupon-outstream-slot',
          environment: 'desktop',
          placement: '1'
        }
      },
      {
        bidder: 'rubicon',
        params: {
          accountId: cfg.publisherId || '25278',
          siteId: '424882',
          zoneId: '2274380'
        }
      },
      {
        bidder: 'criteo',
        params: {
          networkId: parseInt(cfg.publisherId) || 11867
        }
      },
      {
        bidder: 'sovrn',
        params: {
          tagid: cfg.placementId || '1234567'
        }
      },
      {
        bidder: 'pubmatic',
        params: {
          publisherId: cfg.publisherId || '159668',
          adSlot: (cfg.placementId || 'lupon_outstream') + '@640x480'
        }
      }
    ];

    var activeBidders = cfg.bidders && cfg.bidders.length ? cfg.bidders : defaultBidders;

    return [{
      code: 'lupon-outstream-slot',
      mediaTypes: {
        video: {
          context: 'outstream',
          playerSize: [[640, 480]],
          mimes: ['video/mp4', 'video/webm'],
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          playbackmethod: [2],
          skip: 1,
          skipafter: cfg.skipDelay,
          placement: 3
        }
      },
      bids: activeBidders
    }];
  }

  function runPrebidAuction(anchor) {
    var pbjs = w.pbjs;

    if (!pbjs || typeof pbjs.requestBids !== 'function') {
      if (cfg.vastUrl) loadVast(cfg.vastUrl, anchor);
      return;
    }

    pbjs.que = pbjs.que || [];
    pbjs.que.push(function () {
      pbjs.addAdUnits(buildAdUnits());
      pbjs.requestBids({
        timeout: cfg.bidTimeout,
        adUnitCodes: ['lupon-outstream-slot'],
        bidsBackHandler: function (bids) {
          var unitBids = bids['lupon-outstream-slot'];
          if (!unitBids || !unitBids.bids || !unitBids.bids.length) {
            if (cfg.vastUrl) loadVast(cfg.vastUrl, anchor);
            return;
          }
          var winner = unitBids.bids.reduce(function (best, b) {
            return b.cpm > best.cpm ? b : best;
          }, unitBids.bids[0]);

          var vastUrl = winner.vastUrl || winner.vastXml || cfg.vastUrl;
          if (vastUrl) loadVast(vastUrl, anchor);
          // Nema vastUrl — ništa se ne prikazuje
        }
      });
    });
  }

  // ─── INTERSECTION OBSERVER ────────────────────────────────────────────────
  function observeAnchor(anchor) {
    if (!w.IntersectionObserver) {
      runPrebidAuction(anchor);
      return;
    }
    var fired = false;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !fired) {
          fired = true;
          obs.disconnect();
          runPrebidAuction(anchor);
        }
      });
    }, { threshold: 0.5 });
    obs.observe(anchor);
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    var anchor = findInsertionPoint();
    if (!anchor) return;
    observeAnchor(anchor);
  }

  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
