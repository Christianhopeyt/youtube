/* ========================
   Norlytics Advertising Configuration
   ======================== */
'use strict';

// HilltopAds Integration
// Switch providers by changing this configuration and the provider adapter in ad-manager.js.
window.NORLYTICS_ADS = {
  provider: 'hilltopads',
  enabled: true,
  lazyLoad: true,
  consentCategory: 'advertisement',
  hilltopads: {
    // HilltopAds Integration
    // Consent-gated global formats. These are loaded once after marketing/ad consent.
    globalScripts: [
      {
        id: 'hilltopads-popunder',
        format: 'popunder',
        src: 'https://nautical-hand.com/cfD.9Y6/bu2X5llzSCWlQU9_NtzfIN0AO-D/AG2uNqSU0E3MM/jZQd4/MjDAYL5D',
      },
      {
        id: 'hilltopads-multitag-inpage',
        format: 'inpage',
        src: 'https://quarrelsomebitter.com/bCXYV.sIdjG/lL0/YrWwcV/Kedmn9guoZFUOlXkSPUTsc/y-NiD/glxyO/DSkEtoNtzuIw0JOYDXEj5-MJwf',
      },
    ],
    slots: {
      banner: {
        width: 970,
        height: 250,
        scriptUrl: 'https://quarrelsomebitter.com/b/X-VjsCd.GMl_0PYBWQcZ/Pe/mf9cu-ZDUCltk/PSTycUykN/DGgZyEMdDGUpthN/zRIi0WOaDmI/wsOqQi',
      },
      rectangle: {
        width: 336,
        height: 280,
        scriptUrl: 'https://quarrelsomebitter.com/b/X-VjsCd.GMl_0PYBWQcZ/Pe/mf9cu-ZDUCltk/PSTycUykN/DGgZyEMdDGUpthN/zRIi0WOaDmI/wsOqQi',
      },
      sidebar: {
        width: 300,
        height: 600,
        scriptUrl: 'https://quarrelsomebitter.com/b/X-VjsCd.GMl_0PYBWQcZ/Pe/mf9cu-ZDUCltk/PSTycUykN/DGgZyEMdDGUpthN/zRIi0WOaDmI/wsOqQi',
      },
    },
  },
};
