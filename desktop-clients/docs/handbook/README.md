# Frontend platform handover

- [Read the PDF](frontend-platform-guide.pdf)
- [Edit the Markdown source](frontend-platform-guide.md)

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
