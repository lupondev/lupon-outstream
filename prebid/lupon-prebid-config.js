/**
 * Lupon Media — Prebid.js Master Config
 * Version: 1.0.0
 * Bidders: 12 (display + video + native)
 * Host: cdn.luponmedia.com/prebid/lupon-prebid-config.js
 *
 * Usage:
 *   <script src="https://cdn.luponmedia.com/prebid/prebid.js"></script>
 *   <script src="https://cdn.luponmedia.com/prebid/lupon-prebid-config.js"></script>
 *
 * Publisher config overrides:
 *   window.LuponPrebid = {
 *     publisherId: 'novi-ba',
 *     magnite:  { accountId: 12398, siteId: 529542, zoneId: 4059987 },
 *     adform:   { mid: 2236422 },
 *     criteo:   { networkId: 12345 },
 *     pubmatic: { publisherId: '159668' },
 *   };
 */

(function () {
  'use strict';

  var w = window;
  var pbjs = w.pbjs || {};
  pbjs.que = pbjs.que || [];

  // ─── PUBLISHER CONFIG ────────────────────────────────────────────────────
  var pub = w.LuponPrebid || {};

  var CFG = {
    publisherId:  pub.publisherId  || 'lupon-default',
    bidTimeout:   pub.bidTimeout   || 1500,
    priceGranularity: 'high',   // $0.01 increments up to $20
    currency: 'USD',

    // Per-bidder account IDs (override via window.LuponPrebid)
    magnite:   pub.magnite   || { accountId: 12398, siteId: 529542, zoneId: 4059987, zoneIdVideo: 4059987 },
    adform:    pub.adform    || { mid: 2236422 },
    criteo:    pub.criteo    || { networkId: 0 },           // set per publisher
    pubmatic:  pub.pubmatic  || { publisherId: '159668' },
    ix:        pub.ix        || { siteId: '0' },            // set per publisher
    appnexus:  pub.appnexus  || { placementId: 0 },         // set per publisher
    sovrn:     pub.sovrn     || { tagid: '0' },             // set per publisher
    onetag:    pub.onetag    || { pubId: '0' },             // set per publisher
    ttd:       pub.ttd       || { supplySourceId: 'lupon' },
    seedtag:   pub.seedtag   || { publisherId: '0', adUnitId: '0' },
    across33:  pub.across33  || { siteId: '0' },
    teads:     pub.teads     || { pageId: 240401, placementId: 0 },
  };

  // ─── PREBID GLOBAL SETTINGS ──────────────────────────────────────────────
  pbjs.que.push(function () {

    pbjs.setConfig({
      bidderTimeout: CFG.bidTimeout,
      priceGranularity: CFG.priceGranularity,
      currency: { adServerCurrency: CFG.currency },
      enableSendAllBids: true,   // send all bids to ad server for analytics
      userSync: {
        filterSettings: {
          iframe: { bidders: '*', filter: 'include' },
          image:  { bidders: '*', filter: 'include' },
        },
        syncsPerBidder: 5,
        syncDelay: 3000,
      },
      // GDPR / TCF2
      consentManagement: {
        gdpr: {
          cmpApi: 'iab',
          timeout: 3000,
          defaultGdprScope: true,
        },
      },
      // Floors — minimum CPM per format
      floors: {
        enforcement: { floorDeals: false },
        data: {
          currency: 'USD',
          modelVersion: 'lupon-v1',
          schema: { fields: ['mediaType', 'size'] },
          values: {
            'banner|300x250':  0.30,
            'banner|728x90':   0.25,
            'banner|970x250':  0.50,
            'banner|320x50':   0.20,
            'video|640x480':   1.00,
            'native|*':        0.40,
            '*|*':             0.20,
          },
        },
      },
    });

    // ─── AD UNITS ──────────────────────────────────────────────────────────
    var adUnits = [];

    // ── 1. DISPLAY: 300x250 ──────────────────────────────────────────────
    if (document.getElementById('lupon-300x250')) {
      adUnits.push({
        code: 'lupon-300x250',
        mediaTypes: { banner: { sizes: [[300, 250], [300, 600]] } },
        bids: displayBidders('300x250'),
      });
    }

    // ── 2. DISPLAY: 728x90 ──────────────────────────────────────────────
    if (document.getElementById('lupon-728x90')) {
      adUnits.push({
        code: 'lupon-728x90',
        mediaTypes: { banner: { sizes: [[728, 90], [970, 90]] } },
        bids: displayBidders('728x90'),
      });
    }

    // ── 3. DISPLAY: 970x250 (billboard) ────────────────────────────────
    if (document.getElementById('lupon-970x250')) {
      adUnits.push({
        code: 'lupon-970x250',
        mediaTypes: { banner: { sizes: [[970, 250], [970, 90]] } },
        bids: displayBidders('970x250'),
      });
    }

    // ── 4. DISPLAY: 320x50 (mobile) ────────────────────────────────────
    if (document.getElementById('lupon-320x50')) {
      adUnits.push({
        code: 'lupon-320x50',
        mediaTypes: { banner: { sizes: [[320, 50], [320, 100]] } },
        bids: displayBidders('320x50'),
      });
    }

    // ── 5. VIDEO: Outstream in-article ──────────────────────────────────
    if (document.getElementById('lupon-outstream')) {
      adUnits.push({
        code: 'lupon-outstream',
        mediaTypes: {
          video: {
            context:        'outstream',
            playerSize:     [[640, 360]],
            mimes:          ['video/mp4', 'video/webm'],
            protocols:      [1, 2, 3, 4, 5, 6, 7, 8],
            playbackmethod: [2],       // autoplay with sound off
            skip:           1,
            skipafter:      5,
            placement:      3,         // IAB outstream
            linearity:      1,
            minduration:    5,
            maxduration:    60,
          },
        },
        bids: videoBidders(),
      });
    }

    // ── 6. NATIVE: In-feed ─────────────────────────────────────────────
    if (document.getElementById('lupon-native')) {
      adUnits.push({
        code: 'lupon-native',
        mediaTypes: {
          native: {
            title:       { required: true,  len: 80 },
            body:        { required: true,  len: 150 },
            image:       { required: true,  sizes: [[300, 200], [600, 400]] },
            icon:        { required: false, sizes: [[50, 50]] },
            clickUrl:    { required: true },
            cta:         { required: false, len: 30 },
            sponsoredBy: { required: false },
          },
        },
        bids: nativeBidders(),
      });
    }

    if (!adUnits.length) return;

    pbjs.addAdUnits(adUnits);

    pbjs.requestBids({
      timeout: CFG.bidTimeout,
      bidsBackHandler: function (bids) {
        w._luponBids = bids;   // expose for Lab status panel
        w.dispatchEvent(new CustomEvent('lupon:bids', { detail: bids }));
      },
    });
  });

  // ─── BIDDER BUILDERS ─────────────────────────────────────────────────────

  function displayBidders(size) {
    var bids = [];

    // Magnite / Rubicon
    if (CFG.magnite.accountId) bids.push({
      bidder: 'rubicon',
      params: {
        accountId: CFG.magnite.accountId,
        siteId:    CFG.magnite.siteId,
        zoneId:    CFG.magnite.zoneId,
      },
    });

    // Criteo
    if (CFG.criteo.networkId) bids.push({
      bidder: 'criteo',
      params: { networkId: CFG.criteo.networkId },
    });

    // PubMatic
    if (CFG.pubmatic.publisherId) bids.push({
      bidder: 'pubmatic',
      params: {
        publisherId: CFG.pubmatic.publisherId,
        adSlot:      'lupon_' + size.replace('x', 'x') + '@' + size,
      },
    });

    // Index Exchange
    if (CFG.ix.siteId !== '0') bids.push({
      bidder: 'ix',
      params: {
        siteId: CFG.ix.siteId,
        size:   size.split('x').map(Number),
      },
    });

    // Xandr / AppNexus
    if (CFG.appnexus.placementId) bids.push({
      bidder: 'appnexus',
      params: { placementId: CFG.appnexus.placementId },
    });

    // Sovrn
    if (CFG.sovrn.tagid !== '0') bids.push({
      bidder: 'sovrn',
      params: { tagid: CFG.sovrn.tagid },
    });

    // OneTag
    if (CFG.onetag.pubId !== '0') bids.push({
      bidder: 'onetag',
      params: { pubId: CFG.onetag.pubId },
    });

    // Adform Display
    if (CFG.adform.mid) bids.push({
      bidder: 'adform',
      params: { mid: CFG.adform.mid },
    });

    return bids;
  }

  function videoBidders() {
    var bids = [];

    // Magnite Video
    if (CFG.magnite.accountId) bids.push({
      bidder: 'rubicon',
      params: {
        accountId: CFG.magnite.accountId,
        siteId:    CFG.magnite.siteId,
        zoneId:    CFG.magnite.zoneIdVideo || CFG.magnite.zoneId,
        video: {
          language:  'bs',
          playerWidth:  640,
          playerHeight: 360,
          size_id:   203,
        },
      },
    });

    // Adform Video
    if (CFG.adform.mid) bids.push({
      bidder: 'adform',
      params: {
        mid:     CFG.adform.mid,
        adType: 'vast',
      },
    });

    // PubMatic Video
    if (CFG.pubmatic.publisherId) bids.push({
      bidder: 'pubmatic',
      params: {
        publisherId: CFG.pubmatic.publisherId,
        adSlot:      'lupon_outstream@640x360',
      },
    });

    // Index Exchange Video
    if (CFG.ix.siteId !== '0') bids.push({
      bidder: 'ix',
      params: {
        siteId: CFG.ix.siteId,
        size:   [640, 360],
      },
    });

    // Xandr Video
    if (CFG.appnexus.placementId) bids.push({
      bidder: 'appnexus',
      params: {
        placementId: CFG.appnexus.placementId,
        video: { skippable: true, playback_method: ['auto_play_sound_off'] },
      },
    });

    // 33Across (outstream specialist)
    if (CFG.across33.siteId !== '0') bids.push({
      bidder: 'ttd',
      params: { supplySourceId: CFG.ttd.supplySourceId },
    });

    // Teads Video
    if (CFG.teads.pageId) bids.push({
      bidder: 'teads',
      params: {
        pageId:      CFG.teads.pageId,
        placementId: CFG.teads.placementId || CFG.teads.pageId,
      },
    });

    return bids;
  }

  function nativeBidders() {
    var bids = [];

    // Magnite Native
    if (CFG.magnite.accountId) bids.push({
      bidder: 'rubicon',
      params: {
        accountId: CFG.magnite.accountId,
        siteId:    CFG.magnite.siteId,
        zoneId:    CFG.magnite.zoneId,
      },
    });

    // Criteo Native
    if (CFG.criteo.networkId) bids.push({
      bidder: 'criteo',
      params: { networkId: CFG.criteo.networkId },
    });

    // Seedtag (contextual native)
    if (CFG.seedtag.publisherId !== '0') bids.push({
      bidder: 'seedtag',
      params: {
        publisherId: CFG.seedtag.publisherId,
        adUnitId:    CFG.seedtag.adUnitId,
        placement:   'inBanner',
      },
    });

    // AppNexus Native
    if (CFG.appnexus.placementId) bids.push({
      bidder: 'appnexus',
      params: { placementId: CFG.appnexus.placementId },
    });

    return bids;
  }

})();
