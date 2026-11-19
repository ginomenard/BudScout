# BudScout Ohio partner demonstration checklist

**Prelaunch demonstration only.** Ohio dispensary locations are a reviewed directory, not evidence of current stock, authorized menus, partnerships, or live prices. Product cards and comparisons are fictional samples.

## Before showing the demo (Friday Nov 20 readiness gate)

- [ ] Open the deployed site on an actual mobile device and desktop browser; confirm no broken layouts, dead navigation, or horizontal overflow. **Manual check required.**
- [ ] Home: verify Explore Dispensaries opens the Ohio directory and Compare Products opens the clearly fictional product demo.
- [ ] Map: verify Ohio overview shows clustered counts, cluster tap zooms in, individual store pin and directory entry open the correct popup, and directions links target the selected location.
- [ ] Map: search an Ohio city, reset to Ohio, and confirm map remains usable after switching tabs, dragging, and zooming.
- [ ] Products: tap Blue Dream, Gelato, Summit, and Clear filters on a phone; none should open the keyboard or jump the page. Deliberately tapping the text field should open the keyboard.
- [ ] Products: verify Compare checkbox alignment on narrow screens, selecting and removing comparison rows, and visible **FICTIONAL DEMO / not a live offer** price disclosures on cards and table.
- [ ] Partner page: verify private `mailto:budscout.partners@gmail.com?subject=BudScout%20Retailer%20Partnership%20Inquiry` action and selectable address; no public GitHub Issues inquiry CTA or implied signed partners.
- [ ] Check accessibility basics: keyboard focus, meaningful button labels, tap targets, and readable disclosure text.
- [ ] Inspect latest `main`, open PRs, and GitHub Actions. Require green mobile Chromium and WebKit tests; record run URL, test count, failures, and duration.
- [ ] Confirm reviewed Ohio location provenance/freshness disclosures and that missing prices remain absent rather than invented.
- [ ] Do not claim automatic directory updates, authorized pricing feeds, active partnerships, or live availability.

## Suggested 3-minute retailer walkthrough

1. **Discovery (45s):** Introduce BudScout as an Ohio-first prelaunch discovery prototype. Show statewide clusters, zoom, and a directory listing.
2. **Navigation (45s):** Search a city and show how a visitor could find an Ohio dispensary and follow its directions link.
3. **Future comparison concept (45s):** Open the product search and compare fictional samples; explicitly say **these are illustrative prices, not real retailer offers**.
4. **Pilot discussion (45s):** Open Partner With BudScout, explain that an authorized retailer pilot would require consent and verified menu access, and invite feedback without promising results.

## Capture feedback (only after user-approved outreach)

- What would be most useful to your store and customers?
- What feels confusing, untrustworthy, or missing?
- Would you consider discussing a permissioned pilot? What approval and data constraints apply?
- Record concrete objections and requested changes; do not treat interest as authorization.

**Release decision:** Mark the demo outreach-ready only after manual device review and passing CI. This checklist is a plan, not a claim that these checks have been performed.
