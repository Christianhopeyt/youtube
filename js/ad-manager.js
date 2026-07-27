/* ========================
   Norlytics Ad Manager
   ======================== */
'use strict';

(() => {
  const CONFIG = window.NORLYTICS_ADS || {};
  const SLOT_CLASS = 'ad-slot';
  const SLOT_SELECTOR = `.${SLOT_CLASS}`;

  const PLACEMENTS = {
    home: [
      { id: 'home-below-hero', type: 'banner', anchor: '#hero', position: 'after' },
      { id: 'home-between-features', type: 'banner', anchor: '#features', position: 'after' },
      { id: 'home-above-footer', type: 'banner', anchor: '#footer', position: 'before' },
    ],
    analyzer: [
      { id: 'analyzer-below-results', type: 'banner', anchor: '#results .container', position: 'append' },
    ],
    blog: [
      { id: 'blog-after-intro', type: 'banner', articleIndex: 2 },
      { id: 'blog-middle-article', type: 'rectangle', articleIndex: 'middle' },
      { id: 'blog-before-conclusion', type: 'banner', beforeConclusion: true },
    ],
    creator: [
      { id: 'creator-after-public-stats', type: 'banner', anchor: '#creator-channel-overview', position: 'after' },
    ],
    niche: [
      { id: 'niche-below-charts', type: 'banner', anchor: '#metrics-grid', position: 'after' },
    ],
  };

  const AdManager = {
    observer: null,
    consentReady: false,

    init() {
      if (!CONFIG.enabled) return;
      this.injectSlots();
      this.prepareSlots();
      this.listenForConsent();
      this.refreshConsent();
    },

    injectSlots() {
      const page = this.detectPage();
      if (page === 'home') {
        PLACEMENTS.home.forEach(place => this.placeSlot(place));
        PLACEMENTS.analyzer.forEach(place => this.placeSlot(place));
        return;
      }

      if (page === 'blog') {
        this.placeBlogSlots();
        return;
      }

      if (page === 'creator') {
        PLACEMENTS.creator.forEach(place => this.placeSlot(place));
        return;
      }

      if (page === 'niche') {
        PLACEMENTS.niche.forEach(place => this.placeSlot(place));
      }
    },

    detectPage() {
      const path = window.location.pathname.toLowerCase();
      if (document.querySelector('.creator-page')) return 'creator';
      if (document.querySelector('.niche-page')) return 'niche';
      if (document.querySelector('.article-body') && path.includes('/blog/')) return 'blog';
      if (document.getElementById('hero') && document.getElementById('analyzer')) return 'home';
      return 'other';
    },

    placeSlot(place) {
      const anchor = document.querySelector(place.anchor);
      if (!anchor || document.getElementById(`ad-${place.id}`)) return;
      const slot = this.createSlot(place);

      if (place.position === 'after') anchor.insertAdjacentElement('afterend', slot);
      if (place.position === 'before') anchor.insertAdjacentElement('beforebegin', slot);
      if (place.position === 'append') anchor.appendChild(slot);
    },

    placeBlogSlots() {
      const body = document.querySelector('article .article-body') || document.querySelector('.article-body');
      if (!body) return;
      const paragraphs = Array.from(body.querySelectorAll(':scope > p'));
      const headings = Array.from(body.querySelectorAll(':scope > h2'));

      this.insertAfter(paragraphs[1], this.createSlot({ id: 'blog-after-intro', type: 'banner' }));
      this.insertAfter(paragraphs[Math.max(2, Math.floor(paragraphs.length / 2))], this.createSlot({ id: 'blog-middle-article', type: 'rectangle' }));

      const conclusion = headings.find(heading => /conclusion|final thoughts|frequently asked questions|sources|methodology/i.test(heading.textContent || ''));
      if (conclusion) {
        conclusion.insertAdjacentElement('beforebegin', this.createSlot({ id: 'blog-before-conclusion', type: 'banner' }));
      } else if (paragraphs.length) {
        this.insertAfter(paragraphs[paragraphs.length - 2] || paragraphs[paragraphs.length - 1], this.createSlot({ id: 'blog-before-conclusion', type: 'banner' }));
      }
    },

    insertAfter(anchor, slot) {
      if (!anchor || !slot || document.getElementById(slot.id)) return;
      anchor.insertAdjacentElement('afterend', slot);
    },

    createSlot({ id, type }) {
      const slot = document.createElement('div');
      slot.id = `ad-${id}`;
      slot.className = `${SLOT_CLASS} ad-${type}`;
      slot.dataset.adPlacement = id;
      slot.dataset.adType = type;
      slot.setAttribute('aria-label', 'Advertisement');
      slot.setAttribute('role', 'complementary');
      slot.innerHTML = '<div class="ad-slot-inner" aria-hidden="true"></div>';
      return slot;
    },

    prepareSlots() {
      document.querySelectorAll(SLOT_SELECTOR).forEach(slot => {
        slot.classList.add('is-waiting');
      });
    },

    listenForConsent() {
      [
        'cookieyes_consent_update',
        'CookieYesConsentUpdate',
        'cky_consent_update',
        'cookieyes_banner_load',
      ].forEach(eventName => {
        window.addEventListener(eventName, () => this.refreshConsent(), { passive: true });
        document.addEventListener(eventName, () => this.refreshConsent(), { passive: true });
      });

      setTimeout(() => this.refreshConsent(), 1200);
      setTimeout(() => this.refreshConsent(), 3000);
    },

    refreshConsent() {
      const allowed = this.hasAdConsent();
      this.consentReady = allowed;
      document.querySelectorAll(SLOT_SELECTOR).forEach(slot => {
        slot.classList.toggle('has-consent', allowed);
        slot.classList.toggle('no-consent', !allowed);
      });
      if (allowed) this.observeSlots();
    },

    hasAdConsent() {
      const category = CONFIG.consentCategory || 'advertisement';

      // HilltopAds Integration
      // Localhost-only verification hook because CookieYes blocks unregistered preview domains.
      if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) {
        const previewConsent = new URLSearchParams(window.location.search).get('norlytics_ads_consent');
        if (previewConsent === 'granted') return true;
        if (previewConsent === 'denied') return false;
      }

      try {
        const consent = typeof window.getCkyConsent === 'function' ? window.getCkyConsent() : null;
        if (consent?.categories?.[category] === true) return true;
        if (consent?.categories?.marketing === true) return true;
      } catch (_) {}

      const globals = [window.Cookieyes, window.CookieYes, window.ckyConsent];
      for (const item of globals) {
        if (!item) continue;
        if (item.consent?.[category] === true || item.consent?.marketing === true) return true;
        if (item.categories?.[category] === true || item.categories?.marketing === true) return true;
      }

      const cookie = document.cookie
        .split('; ')
        .find(row => /^(cookieyes-consent|cky-consent)=/i.test(row));
      if (!cookie) return false;
      const value = decodeURIComponent(cookie.split('=').slice(1).join('='));
      return new RegExp(`(?:^|[,;&\\s])(?:${category}|marketing)\\s*[:=]\\s*(?:yes|true|1)`, 'i').test(value);
    },

    observeSlots() {
      if (!this.consentReady) return;
      const slots = Array.from(document.querySelectorAll(`${SLOT_SELECTOR}:not(.is-loaded):not(.is-observed):not(.is-empty)`));
      if (!slots.length) return;

      if (!CONFIG.lazyLoad || !('IntersectionObserver' in window)) {
        slots.forEach(slot => this.loadSlot(slot));
        return;
      }

      this.observer = this.observer || new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          this.observer.unobserve(entry.target);
          this.loadSlot(entry.target);
        });
      }, { rootMargin: '240px 0px', threshold: 0.01 });

      slots.forEach(slot => {
        slot.classList.add('is-observed');
        this.observer.observe(slot);
      });
    },

    loadSlot(slot) {
      if (!slot || slot.classList.contains('is-loaded') || !this.hasAdConsent()) return;
      slot.classList.remove('is-waiting');
      slot.classList.add('is-loading');

      Promise.resolve()
        .then(() => providers[CONFIG.provider]?.load(slot, CONFIG))
        .then(loaded => {
          slot.classList.remove('is-loading');
          slot.classList.toggle('is-loaded', Boolean(loaded));
          slot.classList.toggle('is-empty', !loaded);
        })
        .catch(() => {
          slot.classList.remove('is-loading');
          slot.classList.add('is-empty');
        });
    },
  };

  const providers = {
    // HilltopAds Integration
    hilltopads: {
      load(slot, config) {
        const type = slot.dataset.adType || 'banner';
        const settings = {
          ...(config.hilltopads?.slots?.[type] || {}),
          ...(config.hilltopads?.placements?.[slot.dataset.adPlacement] || {}),
        };
        const inner = slot.querySelector('.ad-slot-inner') || slot;

        if (settings.html) {
          inner.innerHTML = settings.html;
          inner.querySelectorAll('script').forEach(original => {
            const script = document.createElement('script');
            Array.from(original.attributes).forEach(attr => script.setAttribute(attr.name, attr.value));
            script.text = original.textContent || '';
            original.replaceWith(script);
          });
          return true;
        }

        const scriptUrl = settings.scriptUrl || config.hilltopads?.scriptUrl;
        if (!scriptUrl) return false;

        Object.entries(settings.dataset || {}).forEach(([key, value]) => {
          inner.dataset[key] = String(value);
        });

        const script = document.createElement('script');
        script.async = true;
        script.src = scriptUrl;
        script.dataset.norlyticsAd = slot.dataset.adPlacement;
        inner.appendChild(script);
        return new Promise(resolve => {
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
        });
      },
    },
  };

  document.addEventListener('DOMContentLoaded', () => AdManager.init());
  window.NorlyticsAdManager = AdManager;
})();
