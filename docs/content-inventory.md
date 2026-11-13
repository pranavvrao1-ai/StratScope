# Content Inventory

Source of truth: the live Base44 site `https://strat-scope-intel.base44.app` (app id `6a5791d01a8c87f21561df5f`), inspected on **2026-11-13**.

## How the content was obtained

| Source | Method | Result |
| --- | --- | --- |
| `Article` entity | `GET /api/apps/{appId}/entities/Article?limit=1000` (public read endpoint used by the original frontend) | **1 record** returned |
| `Comment` entity | `GET /api/apps/{appId}/entities/Comment?limit=1000` | **2 records** returned |
| `Subscriber` entity | Same endpoint, count only (no addresses stored or printed) | 0 records visible publicly |
| Static page copy (Home, About, Contact, nav, footer, category definitions, "Coming Next" banner, newsletter copy, email templates) | Extracted from the production JS bundle `/assets/index-CRhbZ3jf.js` | Fully recovered — see [page-inventory.md](page-inventory.md) |

The raw, unmodified API responses are committed in [`migration/base44-export/`](../migration/base44-export/) and are the canonical record of the migrated content.

### Limitations — read this

- **Drafts and scheduled articles could not be retrieved.** The public endpoint only returned published records (a filtered query for `status=draft` returned `[]`). If drafts exist in Base44, export them from the Base44 dashboard (Data → Article → Export CSV) and import with the procedure in [migration-status.md](migration-status.md#importing-additional-base44-exports).
- **Subscriber emails were not exported** (none were visible publicly, and they are personal data). Export them from the Base44 dashboard if any exist.
- **User accounts / passwords** cannot be migrated (Base44 does not expose password hashes). See [migration-status.md](migration-status.md#users-and-authentication).

## Articles

| # | Base44 id | Slug | Title | Status | Category | Published | Author | Words | Body SHA-256 |
| - | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `6a58bb8a1c8ee3fa56aa6c4e` | `brahmos-the-game-changer` | BrahMos: The Game Changer | published, **featured** | `missile-technology` | 2026-07-16 | Pranav V Rao | 967 | `f78dc917…3efc6ca` |

### Article 1 — field-level record

| Field | Value / status |
| --- | --- |
| excerpt | Preserved verbatim (198 chars) |
| body | Preserved verbatim (6,525 chars HTML; 6 × `h2`, 14 × `p`, 1 list with 9 items) |
| headings | Introduction · Origins: The IGMDP and Dr. Kalam's Vision · The Indo-Russian Partnership · Development and Induction Timeline · Key Features · Future Developments |
| reading_time | 6 (stored value preserved) |
| tags | brahmos, cruise-missile, supersonic, india, drdo, missile-technology |
| specifications | 9 rows (Type, Speed, Range, Payload, Propulsion, Guidance, Precision (CEP), Platforms, Developer) |
| references | 4 entries |
| hero_image | `2d0f47e45_1446370961-BRAHMOS-Kol.jpg` → migrated |
| gallery_images | `2a25343e7_images1.jpg`, `6f6d510d0_download1.jpg` → migrated |
| seo_title | "BrahMos: The Game Changer — StratScope" |
| seo_description | Preserved verbatim (162 chars) |
| created / updated | 2026-07-16T11:07:54.507Z |
| image captions / attribution | **None existed in the original.** No captions were invented. |

## Comments

| Base44 id | Article | Author name | Likes | Created |
| --- | --- | --- | --- | --- |
| (see export) | brahmos-the-game-changer | Sudhanva | 1 | 2026-07-18 |
| (see export) | brahmos-the-game-changer | ABC | 0 | 2026-07-17 |

Content preserved verbatim; these were already publicly displayed on the original site.

## Categories (hard-coded in the original bundle)

| Domain | Slug | Name | Nav label | Description |
| --- | --- | --- | --- | --- |
| 01 | `naval-technology` | Naval Technology | Naval Tech | Sub-surface, surface action groups, and maritime projection. |
| 02 | `air-power` | Air Power | Air Power | Combat aircraft, strategic bombers, and aerial dominance systems. |
| 03 | `land-systems` | Land Systems | Land Systems | Armoured vehicles, artillery, and ground combat platforms. |
| 04 | `missile-technology` | Missile Technology | Missiles | Cruise, ballistic, and hypersonic precision strike systems. |

Each category also carries a "coming soon" title and description, used on the home page when the category has no published articles. All four are preserved verbatim in the `categories` table seed.

## Authors

| Name | Title (as shown on the original article byline) | Initials badge |
| --- | --- | --- |
| Pranav V Rao | Founder & Editor-in-Chief, StratScope | PVR |

## Editorial announcements

- **"Coming Next" banner** (home page and Naval Technology category page): *Varunastra — India's Heavyweight Torpedo*, with its description. Preserved verbatim in `src/lib/site.ts`.
