# Health Pilot Design System

This document defines the first official visual language for Health Pilot. It is based on the approved today-home mockup and the product principles that favor calm, clarity, and one clear action.

## Brand

Health Pilot is calm.

Health Pilot reduces cognitive load.

Health Pilot always feels trustworthy.

Health before technology.

Action before data.

The brand should feel like a supportive guide, not a dashboard. The interface should help a person decide what to do today with minimal effort and minimal visual noise.

## Color Palette

The palette is light, airy, and high-trust, with strong blue and green accents pulled from the approved mockup.

| Token | Approximate HEX | Usage |
| --- | --- | --- |
| Primary Blue | #1E73F2 | Core brand accent, navigation, mission emphasis, links |
| Primary Green | #16A34A | Completion, health success, positive state |
| Background | #F5F8FC | App shell and page background |
| Card | #FFFFFF | Mission card, check-in card, summary panels |
| Border | #DCE4EE | Subtle dividers, card outlines, input borders |
| Success | #16A34A | Completed mission state, healthy status |
| Warning | #F59E0B | Caution states, soft attention signals |
| Text Primary | #12244C | Main headings, mission titles, key values |
| Text Secondary | #5F6F86 | Supporting text, metadata, hints |

Color usage rules:

- Use blue for navigation and mission framing.
- Use green only when the UI is affirming progress or completion.
- Keep large surfaces neutral so the action stands out.
- Avoid introducing additional accent colors unless they map to a meaningful health state.

## Typography

Typography should be clear, compact, and easy to scan on mobile.

Recommended hierarchy:

| Token | Suggested Scale | Weight | Usage |
| --- | --- | --- | --- |
| Display | 32-40px | 700 | Hero brand wordmark, primary home headline |
| Title | 24-28px | 700 | Mission title, major screen heading |
| Section | 18-20px | 600 | Section headers such as Mission and Today's Check-In |
| Body | 15-16px | 400-500 | Supporting explanation, card content, status copy |
| Caption | 12-13px | 400-500 | Labels, timestamps, helper text, metadata |

Weight hierarchy:

- 700 for the primary mission and essential values.
- 600 for section labels and strong supporting structure.
- 400-500 for readable body text and secondary context.

Spacing rules:

- Use short line lengths for dense mission text.
- Increase line-height for explanatory copy so it remains calm and readable.
- Keep headings close to the content they introduce.
- Avoid stacked text blocks that feel heavy or promotional.

## Spacing

Health Pilot uses an 8-based spacing scale with a few smaller steps for tight icon and label work.

| Token | Use |
| --- | --- |
| 4 | Fine adjustments, icon alignment, micro gaps |
| 8 | Default internal spacing, label spacing |
| 12 | Compact card padding and group separation |
| 16 | Standard content spacing inside cards |
| 24 | Section separation and larger padding |
| 32 | Major layout spacing and card grouping |
| 48 | Hero-to-content separation and large vertical rhythm |

Spacing rules:

- Prefer 16 and 24 for most content surfaces.
- Use 8 for icon-label relationships and small controls.
- Use 32 or 48 only when the layout needs clear breathing room.

## Border Radius

The design language should feel soft, friendly, and approachable.

| Component | Radius |
| --- | --- |
| Cards | 24px |
| Buttons | 16px |
| Inputs | 16px |
| Hero | 28px or edge-to-edge with soft clipping |
| Icons | Circular or fully rounded containers |

Radius rules:

- Cards should feel gently elevated, not sharp.
- Interactive controls should be visibly touchable.
- Icon containers should remain circular or close to circular for a calm appearance.

## Shadows

Shadows are subtle and should support depth without making the interface feel heavy.

| Shadow | Use |
| --- | --- |
| Card shadow | Soft elevation for content surfaces |
| Floating shadow | Slightly stronger emphasis for overlay or prominent interactive surfaces |
| Hero overlay | Gentle lightening and contrast control over the background image |

Shadow rules:

- Use low-opacity, blurred shadows.
- Avoid harsh edges or dark glows.
- Shadows should suggest layers, not drama.

## Hero

Purpose:

- Establish the emotional tone of the day.
- Reinforce trust and calm before the mission content begins.
- Make the top of the home screen feel human and restorative.

Height:

- Use a tall hero region on the home screen, approximately 200-240px on a mobile-first layout.
- The hero should visually connect the brand area to the first mission card.

Image usage:

- The hero should use a serene landscape or morning-light photograph.
- The image must support the idea of recovery, clarity, and a new day.
- Avoid busy backgrounds that compete with text.

Gradient overlay:

- Apply a soft gradient overlay to preserve readability and keep the brand area legible.
- The overlay should lift contrast without making the image feel filtered or artificial.

Safe area:

- Keep top text and brand elements clear of the most visually active parts of the image.
- Preserve enough space for the status area, date, and top controls.

Text readability:

- Hero text must remain readable at a glance.
- Prefer dark navy text over light text when the background is bright.

Future asset:

- assets/hero/hero-lake-morning.webp

## Icons

Icon style should match the approved mockup: simple, rounded, calm, and immediately understandable.

Mission icons:

- Use line icons with rounded corners and generous interior space.
- Keep mission icons light and friendly rather than technical or angular.

Check-in icons:

- Use circular colored backgrounds with centered symbols.
- Keep icons visually distinct by state without becoming decorative.

Bottom Navigation:

- Use clear, compact icons with labels.
- Active state should be obvious through color and contrast.
- Inactive state should stay readable but quieter.

Icon weight:

- Prefer medium line weight.
- Avoid ultra-thin strokes that disappear on mobile.

Corner style:

- Rounded ends and rounded joins.
- No sharp terminals unless the symbol requires it.

Stroke width:

- Keep stroke width consistent across the system.
- Use a stroke width that remains legible at small sizes.

Rounded appearance:

- Icons should feel soft and approachable.
- The system should avoid hard geometric severity.

Future assets location:

- assets/icons/

## Cards

Cards are the primary information containers in the product. They should feel calm, structured, and easy to scan.

Mission card:

- Largest and most important card on the home screen.
- Presents the single daily action first.
- May include progress, reason, and a small supporting insight.

Check-in card:

- Secondary to the mission.
- Summarizes the day's inputs with compact iconography.

Sleep / Health card:

- Shows key summary values only.
- Must remain secondary to the mission and never compete with it.

History card:

- Used for trend or past-state context.
- Should stay visually lighter than the mission surface.

Card radius:

- 24px standard radius.

Card padding:

- 16-24px depending on density.

Header spacing:

- Keep headers close to the top edge but not cramped.
- Leave enough separation so each card reads as a distinct surface.

Internal spacing:

- Use 16px as the default internal rhythm.
- Use 8px for compact icon and text grouping.

Card rules:

- One card should equal one clear idea.
- Avoid duplicating the same data in multiple cards.
- Keep the mission card visually dominant.

## Motion

Motion should be restrained, useful, and nearly invisible unless it helps comprehension.

Small hover:

- Use a subtle lift or tint shift on pointer devices.

Small press:

- Use a short scale-down or opacity feedback on tap or click.

Small transitions:

- Use short fades and gentle position shifts for state changes.

Duration:

- 120-180ms for press and hover feedback.
- 180-240ms for card or section transitions.

Easing:

- Use a soft ease-out curve.
- Motion should feel calm, not playful.

No excessive animation:

- Do not add motion that delays decision making.
- Avoid continuous motion unless it communicates live state.

## Design Principles

Reduce cognition.

Action first.

People decide.

These principles should govern every future visual decision. If a visual treatment makes the app feel busier, louder, or more uncertain, it does not belong in the system.
