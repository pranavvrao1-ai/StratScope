# Asset Inventory

All assets were served from `media.base44.com/images/public/6a5791d01a8c87f21561df5f/`. Each was downloaded byte-for-byte and committed under `public/images/migrated/`. SHA-256 checksums are in [`migration/base44-export/asset-checksums.txt`](../migration/base44-export/asset-checksums.txt).

| Original file | Used as | Size | Dimensions | New location |
| --- | --- | --- | --- | --- |
| `fe95762a2_logo.png` (actually JPEG data) | Favicon, PWA icon | 49 KB | 1024×1024 | `public/images/migrated/fe95762a2_logo.jpg`, `src/app/icon.jpg`, `src/app/apple-icon.jpg` |
| `febd0efb5_images2.jpg` | Home hero background (alt: "Missile launch at sea") | 19 KB | 739×415 | `public/images/migrated/febd0efb5_images2.jpg` |
| `2d0f47e45_1446370961-BRAHMOS-Kol.jpg` | Hero image, "BrahMos: The Game Changer" | 26 KB | 670×613 | `public/images/migrated/2d0f47e45_1446370961-BRAHMOS-Kol.jpg` |
| `2a25343e7_images1.jpg` | Gallery image 1, BrahMos article | 1.4 KB | 220×148 | `public/images/migrated/2a25343e7_images1.jpg` |
| `6f6d510d0_download1.jpg` | Gallery image 2, BrahMos article | 6.5 KB | 266×148 | `public/images/migrated/6f6d510d0_download1.jpg` |

No images are embedded inside article bodies. No image captions or credits existed in the original data, so none were added.

**Note on gallery images:** the two gallery files are low resolution (220 and 266 px wide). They are reproduced as-is. Replace them with higher-resolution originals through the admin panel if you have them.

## Brand identity (recovered from the bundle and CSS)

| Token | Value | Use |
| --- | --- | --- |
| Ink (page background) | `#080B11` | Main background |
| Abyss (deep background) | `#010204` | Footer, cards, alternating sections |
| Gold (accent) | `#D4AF37` | Wordmark "SCOPE", labels, links, buttons, rules |
| Text | `#F9FAFB` / Tailwind `gray-300…600` | Body and secondary text |
| Heading font | Playfair Display (400–900, italic) | Serif headlines |
| Body font | DM Sans | Body copy |
| Mono font | JetBrains Mono | Labels, nav, metadata, tables |
| Wordmark | `STRAT` (white) + `SCOPE` (gold), serif, tracking 0.2em | Header/footer |
| Shapes | Square corners, 1px `white/10` hairline borders, gold top-rule on hover | Cards |

Fonts are now self-hosted through `next/font` (no runtime Google Fonts request).
