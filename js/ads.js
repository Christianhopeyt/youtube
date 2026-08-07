/* ========================
   Norlytics Advertising Configuration
   ======================== */
'use strict';

// Google AdSense Integration
// Ad units are injected by ad-manager.js only after the visitor accepts the
// 'advertisement' consent category, so no Google ad tag runs before consent.
window.NORLYTICS_ADS = {
  provider: 'adsense',
  enabled: true,
  lazyLoad: true,
  consentCategory: 'advertisement',
  adsense: {
    // Publisher ID shown in the AdSense account (Account > Settings).
    client: 'ca-pub-8121112277976862',
    // In-page display ad units. Each unit's slot ID comes from the AdSense
    // dashboard: Ads > Ad units > (unit) > "Ad unit code" > data-ad-slot value.
    // Paste the real slot IDs here. Units without a slot ID stay hidden and
    // never fire a request.
    slots: {
      banner: { slotId: '', format: 'auto', width: 728, height: 90 },
      rectangle: { slotId: '', format: 'auto', width: 336, height: 280 },
      sidebar: { slotId: '', format: 'auto', width: 300, height: 600 },
    },
  },
};
