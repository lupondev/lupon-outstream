# Lupon Prebid Config

**Host:** `cdn.luponmedia.com/prebid/`

## Files

| File | Description |
|------|-------------|
| `prebid.js` | Custom Prebid.js build (download from prebid.org with selected bidders) |
| `lupon-prebid-config.js` | Lupon master config — all bidders, all formats |

## Usage

```html
<!-- 1. Set publisher config BEFORE scripts -->
<script>
window.LuponPrebid = {
  publisherId: 'novi-ba',
  bidTimeout:  1500,
  magnite:  { accountId: 12398, siteId: 529542, zoneId: 4059987 },
  adform:   { mid: 2236422 },
  criteo:   { networkId: 12345 },
  pubmatic: { publisherId: '159668' },
  ix:       { siteId: 'ABC123' },
  appnexus: { placementId: 99999 },
  sovrn:    { tagid: '555555' },
};
</script>

<!-- 2. Load Prebid.js -->
<script src="https://cdn.luponmedia.com/prebid/prebid.js" async></script>

<!-- 3. Load Lupon config -->
<script src="https://cdn.luponmedia.com/prebid/lupon-prebid-config.js" async></script>

<!-- 4. Add slot divs -->
<div id="lupon-300x250"></div>
<div id="lupon-728x90"></div>
<div id="lupon-outstream"></div>
<div id="lupon-native"></div>
```

## Supported Bidders

### Display
| Bidder | Status | Formats |
|--------|--------|---------|
| Magnite / Rubicon | ✅ Active | Display, Video, Native |
| Adform | ✅ Active | Display, Video |
| Criteo | 🔧 Config needed | Display, Video, Native |
| PubMatic | 🔧 Config needed | Display, Video |
| Index Exchange | 🔧 Config needed | Display, Video |
| Xandr / AppNexus | 🔧 Config needed | Display, Video, Native |
| Sovrn | 🔧 Config needed | Display |
| OneTag | 🔧 Config needed | Display |

### Video
| Bidder | Status | Notes |
|--------|--------|-------|
| Magnite Video | ✅ Active | zone_id: 4059987, size_id: 203 |
| Adform Video | ✅ Active | VAST outstream |
| 33Across | 🔧 Config needed | Outstream specialist |
| Teads | ✅ Active (direct) | page_id: 240401 |

### Native
| Bidder | Status | Notes |
|--------|--------|-------|
| Seedtag | 🔧 Config needed | Contextual AI |
| Criteo | 🔧 Config needed | |
| Magnite | ✅ Config ready | |

## Ad Unit Div IDs

| Div ID | Format | Size |
|--------|--------|------|
| `lupon-300x250` | Display | 300x250, 300x600 |
| `lupon-728x90` | Display | 728x90, 970x90 |
| `lupon-970x250` | Display | 970x250 |
| `lupon-320x50` | Display | 320x50 (mobile) |
| `lupon-outstream` | Video | 640x360 outstream |
| `lupon-native` | Native | Flexible |

## Prebid.js Custom Build

Download from https://prebid.org/download/ with these adapters:
- rubicon, adform, criteo, pubmatic, ix, appnexus, sovrn, onetag, ttd, seedtag, teads, 33across
- Modules: priceFloors, consentManagement, currency, schain

## Floor Prices (default)

| Format | Min CPM |
|--------|----------|
| 300x250 | $0.30 |
| 728x90 | $0.25 |
| 970x250 | $0.50 |
| 320x50 | $0.20 |
| Video outstream | $1.00 |
| Native | $0.40 |
