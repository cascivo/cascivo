# Cascade Legal Framework Mapping

## Overview

Cascade targets WCAG 2.2 AA conformance at the component level. All three major accessibility
frameworks — EAA, EN 301 549, and US Section 508 — reference WCAG as their technical standard.

---

## European Accessibility Act (EAA)

- **Effective:** 28 June 2025
- **Scope:** Digital products and services in EU markets
- **Technical standard:** EN 301 549 → references WCAG 2.1 AA minimum
- **Cascade provides:** WCAG 2.2 AA conformant components (exceeds the EAA minimum)
- **Consuming application must:** ensure overall product conformance, provide accessible content,
  integrate components correctly

---

## EN 301 549

- The EU harmonized standard for ICT accessibility
- Clause 9 references WCAG 2.1 AA for web content
- **Cascade provides:** conformant component primitives at 2.2 AA
- **Not provided by cascade:** end-to-end product VPAT, application-level conformance

---

## US Section 508

- References WCAG 2.0 AA as the normative standard (as of 2017 refresh)
- Cascade at WCAG 2.2 AA exceeds the 508 threshold
- **Consuming application must:** meet all WCAG 2.0 AA criteria in the complete product

---

## What cascade provides vs. what the integrator must do

| Responsibility                                  | Cascade         | Integrator |
| ----------------------------------------------- | --------------- | ---------- |
| Component-level WCAG conformance                | ✅              |            |
| APG pattern keyboard interactions               | ✅              |            |
| Media features (reduced-motion, forced-colors)  | ✅              |            |
| Representative AT testing                       | ✅ (documented) |            |
| Accessible content (alt text, labels, headings) |                 | ✅         |
| End-to-end product conformance                  |                 | ✅         |
| VPAT / GPAT for the final product               |                 | ✅         |
| Third-party component conformance               |                 | ✅         |

---

## Scope + Limitations

- Conformance is at the component level, not the application level
- AT testing is representative (12 components × 4 stacks), not exhaustive
- No third-party VPAT has been issued for cascade
- Legal accessibility compliance of the final product is the integrator's responsibility
