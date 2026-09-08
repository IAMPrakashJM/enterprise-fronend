# Illustrated frontend platform handover

- [Read the PDF](frontend-platform-guide.pdf)
- [Edit the Markdown source](frontend-platform-guide.md)
- [Browse original screenshots](screenshots/)

The illustrated edition includes 19 actual desktop screenshots with numbered
captions alongside the user instructions. Images use fictional, isolated demo data.

Coverage: Monday 7 September 2026, separately identified follow-on work through
Tuesday 8 September 2026, user instructions, architecture, integration examples,
completion boundaries, pending work, deployment and troubleshooting.

The guide describes the inspected working tree and deployed demo. Its release
history is distinct from Git source publication. Older feature notes may refer to
previous release/test milestones; the guide reconciles those dates explicitly.

## Rebuild

Use Python 3, a virtual environment, and DejaVu Sans fonts:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python build_pdf.py
```

Run these commands from this folder. Install your OS's Python venv support if it
is missing. Do not commit `.venv`. `--font-dir` accepts another directory containing
DejaVuSans.ttf, DejaVuSans-Bold.ttf and DejaVuSansMono.ttf.

The generator runs offline once its dependencies are installed. It produces a
searchable PDF with an internal linked contents page, bookmarks, page numbers,
repeatable table headers and numbered flow diagrams. Review rendered pages after
content changes. PyMuPDF is included for extraction/rendering verification; it is
not needed by the application or by the generator itself.

## Recapture screenshots

Use the developed application checkout, Node 24, Playwright/Chromium and a **fresh**
isolated API data directory. The full capture creates personal views, attachments,
comments, related links, imported customers, approval configuration and decisions.
It must not run against a shared deployment. Both URLs must use loopback hosts;
external browser requests are blocked by the capture script.

Start the API/frontend pair using section 15 of the guide. From desktop-clients:

```sh
SCREENSHOT_BASE=http://127.0.0.1:3109 \
SCREENSHOT_API=http://127.0.0.1:3330 \
node docs/handbook/capture_screenshots.mjs
```

Set `PLAYWRIGHT_PATH` when using an existing Playwright installation. Screenshots
are written to `screenshots/`. The capture uses the demo's seeded accounts and
1440×1000 desktop viewport; use a new data directory for every full run.
`SCREENSHOT_NAV_ONLY=1` recaptures only login, worklist and command-palette images.

After capture, regenerate the PDF, check all images/captions and links, and update
VALIDATION.md. Screenshots are captured directly from the browser; focused dialog
and panel images avoid shrinking the important controls into a full-window image.
