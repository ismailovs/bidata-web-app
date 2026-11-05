# Product direction — tender productivity

Reference reviewed: https://autopilot.uz/ (2026-11-04). Public marketing descriptions, not independently tested software. Do not reuse its code, branding, testimonials or performance claims.

Its site advertises a consolidated marketplace workspace, automatic product publication/renewal, competitor pricing, Excel imports, invoice generation and Telegram alerts. It also describes a Windows application and a local E-IMZO/browser flow. These desktop capabilities are not automatically available inside an iPhone PWA.

## Bidata priorities

| Company task | Current implementation | Next production integration |
| --- | --- | --- |
| Stop checking many marketplaces | Unified feed UI with source label and link | Authorized UZEX / XT-Xarid / Cooperation / Ebirja source connectors, deduplication and source health |
| Find relevant procurement | Persistent company keywords + region, explainable keyword match | Product taxonomy and supplier catalog matching with user feedback |
| Act before a deadline | Deadline sorting, source refresh timestamp, foreground 60-second polling | Background Telegram/email/Web Push delivery with opt-in, retry and deduplication |
| Organize tender work | Saved opportunities and manual review/preparing/submitted/won/lost stages | Assignees, document checklist, reminders and audit history |
| Decide whether participation is worthwhile | Source price and CSV export | Cost/margin calculator, supplier history and validated competitor data |
| Reduce repeated entry | Common feed schema | CSV/Excel catalog import with validation, preview and duplicate handling |
| Choose a paid plan | Disabled-by-default hosted subscription integration | Validated pricing, active merchant account, legal/support pages and tested customer lifecycle |

AI price recommendations and win probabilities need historical outcomes, defensible methodology and evidence; do not invent them. Publication, bidding, E-IMZO signing, invoice creation and automatic renewal on third-party marketplaces require separate authorized integrations and user approval of consequential submissions. No such actions are implemented here.

A useful first pilot measures time from tender publication to discovery, relevant-match precision, missed deadlines and preparation time. Establish a baseline before claiming productivity gains.
