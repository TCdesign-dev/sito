# E2E Test Infra: Mobile 3D Solar System Portfolio

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Intro Sequence & Liveness | ORIGINAL_REQUEST | 5      | 5      | ✓      |
| 2 | 3D Solar System View | ORIGINAL_REQUEST §R1 | 5      | 5      | ✓      |
| 3 | Planet/System Navigation | ORIGINAL_REQUEST §R2 | 5      | 5      | ✓      |
| 4 | Moon Selection & Bottom Sheet | ORIGINAL_REQUEST §R3 | 5      | 5      | ✓      |
| 5 | Mobile UI & Interactions | ORIGINAL_REQUEST §R1-R3 | 5      | 5      | ✓      |

## Test Architecture
- Test runner: Playwright (with chromium desktop and mobile-chrome project configurations)
- Web Server: `python3 -m http.server 8000` (started dynamically by Playwright)
- Directory layout:
  - `playwright.config.js`
  - `tests/e2e/` for spec files

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Desktop Navigation Journey | Intro -> Galaxy -> System -> Project Detail -> Back | High |
| 2 | Full Mobile Interaction Journey | Intro -> Galaxy -> System -> Select Moon -> View Sheet -> Close | High |
| 3 | Multi-orientation Resize Stability | Portrait -> Landscape -> Portrait dynamic resizing | Medium |
| 4 | Rapid/Abusive User Interactions | Rapid double clicks/swipes during animations | Medium |
| 5 | Invalid Route / Error Redirection | Accessing non-existent project URL details | Low |

## Coverage Thresholds
- Tier 1: ≥5 per feature (Total: 25)
- Tier 2: ≥5 per feature (Total: 25)
- Tier 3: pairwise coverage of major feature interactions (Total: 5)
- Tier 4: ≥5 realistic application scenarios (Total: 5)
