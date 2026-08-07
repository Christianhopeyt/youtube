# Norlytics AdSense Readiness Report

Audit date: June 14, 2026

Update note: This report has been superseded by the July 22, 2026 weak-page upgrade in `ADSENSE_CONTENT_UPGRADE_REPORT.md`. The articles listed below as temporarily quarantined were later rewritten, made indexable, restored to discovery surfaces, and re-added to the sitemap.

Update note (August 7, 2026): The advertising stack was switched from the consent-gated HilltopAds manager to a Google AdSense provider. `js/ads.js` now configures `provider: 'adsense'` with the `ca-pub-8121112277976862` publisher ID; `js/ad-manager.js` lazily loads `adsbygoogle.js` and injects in-page `ins.adsbygoogle` display units only after the visitor accepts the CookieYes `advertisement` category. All `HilltopAds` markers were removed from HTML, the cookie policy was updated to reference Google AdSense only, and the regression tests now enforce the AdSense provider. Real ad-unit slot IDs must be pasted into `js/ads.js` (`slots.banner.slotId`, `slots.rectangle.slotId`, `slots.sidebar.slotId`) from the AdSense dashboard before units can render.

Update note (August 7, 2026): The DNS inconsistency described below is **resolved**. The stale apex A (`54.232.119.62`) and AAAA (`2600:1f1e:7c1:c300::258`) records were deleted; the apex is now a DNS-only CNAME to `norlytics.netlify.app`. Verified at the authoritative Cloudflare nameservers: apex A → `35.157.26.135`/`63.176.8.218`, apex AAAA → `2a05:d014:58f:6200::258/259`, and `www.norcanto.com` CNAME → `norlytics.netlify.app` with no stale AAAA.

## Readiness After Repository Fixes

Estimated readiness: **moderate, pending content expansion** (DNS records are now consistent and consolidated on Netlify targets).

The repository now has a substantially safer AdSense-review posture, and the live domain's DNS records are consolidated on Netlify targets. Repeated external requests should be re-verified from multiple regions before submitting to AdSense.

## Passed

- `ads.txt` contains the configured Google publisher ID.
- `robots.txt` allows public crawling and excludes dynamic `/channel/` result routes.
- Public pages use clean canonical URLs and reciprocal EN/FR hreflang metadata.
- Legal, privacy, cookie, About, and contact pages are present.
- API keys remain server-side.
- Clean Netlify rewrites and legacy URL redirects remain intact.
- Retained blog articles identify the author and explain the public-data estimation methodology.

## Fixed

- Removed unsupported `500K+ Channels Analyzed` and `98% Estimation Accuracy` claims from EN/FR home and About pages.
- Replaced those claims with honest product facts.
- Removed direct Google Analytics and AdSense script tags from public HTML.
- CookieYes is installed globally before Google Analytics and AdSense.
- Google Analytics and AdSense are marked as CookieYes-controlled analytics and advertisement categories.
- Updated EN/FR privacy and cookie disclosures to describe the implemented behavior.
- Added founder/contact credibility to EN/FR About pages.
- Temporarily marked thin duplicate articles `noindex, follow` during the June remediation. Superseded July 22, 2026: those pages were rewritten and restored as indexable resources.
- Removed quarantined articles from `sitemap.xml` during the June remediation. Superseded July 22, 2026: rewritten pages were re-added to the sitemap.
- Removed quarantined articles from homepage and blog discovery surfaces during the June remediation. Superseded July 22, 2026: rewritten pages were restored to blog discovery surfaces.
- Corrected the contact-form success redirect from the stale `analyzer.norcanto.com` host.
- Added automated AdSense-readiness regression tests.

## Quarantined Articles

These pages were quarantined in June, but were substantially rewritten on July 22, 2026 and are no longer recommended for `noindex`:

- `/blog/ai-tools-for-youtube-creators`
- `/blog/grow-youtube-channel-fast`
- `/blog/youtube-cpm-countries`
- `/blog/youtube-rpm-by-niche`
- `/blog/youtube-shorts-monetization`
- `/blog/youtube-sponsorship-guide`
- Their corresponding `/fr/blog/...` pages

Each is approximately 335-340 words and shares a near-identical template.

## Remaining Risks

### Resolved: DNS inconsistency and intermittent delivery

Previously, external DNS resolvers returned different production targets:

- Cloudflare DNS returned Netlify targets `35.157.26.135` and `63.176.8.218`.
- Google DNS and the local resolver returned `54.232.119.62` and a different IPv6 target.

Requests routed through the latter target were extremely slow, incomplete, or failed. **Fixed August 7, 2026:** the stale apex A/AAAA records were removed and the apex now points to `norlytics.netlify.app` via a DNS-only CNAME. Verified at the authoritative nameservers that apex A/AAAA and `www` all resolve to Netlify targets. No action remains; only residual resolver cache expiry should be observed.

### High: Google-certified CMP

The repository now prevents non-essential Google scripts from loading before explicit acceptance. For serious EEA/UK/Swiss AdSense traffic, configure a Google-certified consent management platform and verify Google Consent Mode behavior.

### Medium: Content depth

Several retained articles remain below 1,000 words. They are distinct enough to stay indexed, but should receive original examples, clearer sourcing, and deeper practical analysis over time.

### Medium: Trailing-slash consistency

Some directory-backed Netlify pages resolve to trailing-slash URLs while canonical tags use clean URLs without a trailing slash. The current routing tests show no redirect loop, but live canonical/redirect behavior should be rechecked after the DNS consolidation above.

## Manual Testing Checklist

1. Confirm authoritative DNS contains only Netlify-recommended records. **Done August 7, 2026:** apex A/AAAA and `www` resolve to Netlify targets at the authoritative nameservers.
2. Test `http`, `https`, `www`, and apex-domain behavior from multiple networks.
3. Confirm every sitemap URL returns a complete HTTP `200` response consistently.
4. Open a private browser session and confirm no Google Analytics or AdSense request occurs before consent.
5. Select Reject and confirm Google scripts remain absent after navigation.
6. Select Accept and confirm Google scripts load once.
7. Validate the sitemap in Google Search Console.
8. Request indexing only for pages that remain in the sitemap.
9. Validate structured data for retained articles.
10. Install and test a Google-certified CMP before substantial EEA/UK/Swiss ad traffic.
