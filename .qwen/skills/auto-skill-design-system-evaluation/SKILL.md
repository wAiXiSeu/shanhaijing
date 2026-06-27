---
name: design-system-evaluation
description: Evaluate multiple external design system specs against a project's domain, select the best fit, and map design tokens to domain-specific categories
source: auto-skill
extracted_at: '2026-06-27T15:02:27.278Z'
---

# Evaluating and Adapting External Design System Specs

Use when a user provides multiple design system specification files (YAML frontmatter + markdown analysis of real websites) and asks you to pick one to reuse for a new project.

## Procedure

### 1. Read all design specs thoroughly

Design spec files are often 500+ lines. Read each one completely — don't skim. Key sections to extract:
- **Colors**: primary, surface, text, semantic, and any signature/branded colors
- **Typography**: font families, size scale, weight range, letter-spacing patterns
- **Components**: buttons, cards, inputs, navigation, and any signature components
- **Layout**: spacing system, grid, breakpoints, whitespace philosophy
- **Elevation**: shadow strategy, depth devices
- **Shapes**: border radius scale, image/illustration geometry
- **Do's and Don'ts**: explicit design constraints

### 2. Evaluate each against the project domain

For each design system, assess fit along these axes:

- **Content type alignment**: Does the design's visual mood match the content? (e.g., a dark tech-startup aesthetic doesn't fit an ancient mythology encyclopedia)
- **Component availability**: Do the design system's components map to the UI you need? (e.g., if the spec has "category cards" in different colors, that maps naturally to content categories)
- **Color palette suitability**: Can the palette serve the domain's categories? (e.g., multiple distinct accent colors can map to content categories)
- **Typography tone**: Does the type voice fit? (e.g., extreme negative letter-spacing reads as "poster/billboard" — fine for marketing, odd for reading-heavy content)
- **Constraint compatibility**: Do the design's "don'ts" conflict with project needs? (e.g., "don't ship light mode" is a problem if the project needs light mode)

Present each evaluation concisely (2-3 sentences per system), then recommend one with reasoning.

### 3. Map design tokens to domain categories

After selecting a design system, create explicit mappings between its visual tokens and the project's domain concepts. Example pattern:

| Domain category | Design token | Token value | Visual rationale |
|---|---|---|---|
| Category A | `block-lime` | `#dceeb1` | association 1 |
| Category B | `block-coral` | `#f3c9b6` | association 2 |

The rationale column matters — it explains *why* this color fits this category, which helps future contributors understand the design intent.

### 4. Identify font substitution requirements

Most external design specs use proprietary fonts. Identify open-source substitutes early:

| Proprietary font | Open-source substitute | Adjustment notes |
|---|---|---|
| (e.g. figmaSans) | Inter | line-height down ~0.02 (taller x-height) |
| (e.g. figmaMono) | JetBrains Mono | — |

Include these in the Tailwind config / design token setup so the substitution is documented, not implicit.

### 5. Translate to implementation tokens

Convert the design spec's YAML tokens into the project's styling system (e.g., Tailwind CSS `theme.extend`). Copy exact values — don't round or approximate. The design spec's `fontWeight: 340` should become `fontWeight: '340'` in Tailwind, not `fontWeight: '300'`.

## Experiential notes

- **Directory listing truncation**: When listing a directory that returns 20+ items, the output may be truncated with "...". If you make count-based assumptions (e.g., "13 story files") from a truncated listing, **always re-list the directory** to verify before committing to a count. Discovered 15 stories instead of 13 after the spec was already "confirmed" — required retroactive spec correction.
- **Chinese slug feasibility**: Chinese characters work as URL slugs in Next.js dynamic routes. Don't assume you need pinyin transliteration — test with the actual characters first.
- **Design spec "description" field is valuable**: The YAML frontmatter `description` field in design specs often contains a one-paragraph summary of the design's philosophy. Use it as the starting point for your evaluation — it captures the designer's intent better than individual token values.
