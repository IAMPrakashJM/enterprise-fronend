#!/usr/bin/env python3
"""Build the handover PDF from its Markdown source; no network access required."""
from pathlib import Path
import html
import re
import argparse
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, PageBreak,
    LongTable, TableStyle, Preformatted, KeepTogether, CondPageBreak,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parent
INK = colors.HexColor('#16324A')
TEAL = colors.HexColor('#087F8C')
MUTED = colors.HexColor('#536779')
PALE = colors.HexColor('#EDF5F7')
LINE = colors.HexColor('#CDDCE3')


def build(source, target, font_dir):
    for name, file in [('Body', 'DejaVuSans.ttf'), ('BodyBold', 'DejaVuSans-Bold.ttf'),
                       ('Mono', 'DejaVuSansMono.ttf')]:
        pdfmetrics.registerFont(TTFont(name, str(font_dir / file)))
    pdfmetrics.registerFontFamily('Body', normal='Body', bold='BodyBold', italic='Body', boldItalic='BodyBold')
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle('GuideBody', fontName='Body', fontSize=10, leading=15,
                              textColor=INK, spaceAfter=9, allowWidows=0, allowOrphans=0))
    styles.add(ParagraphStyle('GuideH1', fontName='BodyBold', fontSize=21, leading=27,
                              textColor=INK, spaceAfter=18, keepWithNext=True))
    styles.add(ParagraphStyle('GuideH2', fontName='BodyBold', fontSize=12, leading=17,
                              textColor=TEAL, spaceBefore=12, spaceAfter=7, keepWithNext=False))
    styles.add(ParagraphStyle('GuideCell', fontName='Body', fontSize=8.8, leading=12.5,
                              textColor=INK, wordWrap='CJK'))
    styles.add(ParagraphStyle('GuideCellHead', parent=styles['GuideCell'], fontName='BodyBold', textColor=colors.white))
    styles.add(ParagraphStyle('GuideCode', fontName='Mono', fontSize=8, leading=11.5,
                              textColor=INK, backColor=PALE, borderPadding=9, spaceBefore=7, spaceAfter=12))
    styles.add(ParagraphStyle('GuideBullet', parent=styles['GuideBody'], leftIndent=15,
                              firstLineIndent=-12, spaceAfter=6))
    styles.add(ParagraphStyle('GuideFlow', parent=styles['GuideBody'], fontSize=9.4,
                              leading=13, spaceAfter=0))
    styles.add(ParagraphStyle('GuideCover', fontName='BodyBold', fontSize=32, leading=40,
                              textColor=INK, spaceAfter=24))
    styles.add(ParagraphStyle('GuideKicker', fontName='BodyBold', fontSize=10, leading=16,
                              textColor=TEAL, spaceAfter=15))

    def inline(value):
        value = html.escape(value)
        value = re.sub(r'`([^`]+)`', r'<font name="Mono">\1</font>', value)
        value = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', value)
        value = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<link href="\2" color="#087F8C">\1</link>', value)
        return value

    class GuideDoc(BaseDocTemplate):
        def afterFlowable(self, flowable):
            if isinstance(flowable, Paragraph) and flowable.style.name == 'GuideH1':
                title = flowable.getPlainText()
                self.chapter = title
                key = 'section-' + title.split('.')[0]
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(title, key, level=0)
                self.notify('TOCEntry', (0, title, self.page, key))

    def page_frame(canvas, doc):
        canvas.saveState()
        w, h = A4
        if doc.page > 1:
            canvas.setStrokeColor(LINE)
            canvas.line(46, h - 43, w - 46, h - 43)
            canvas.setFont('BodyBold', 8)
            canvas.setFillColor(TEAL)
            canvas.drawString(46, h - 33, 'NEXORA  /  FRONTEND PLATFORM GUIDE')
        canvas.setFont('Body', 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(46, 29, 'Handover • 7–8 September 2026 • UTC')
        canvas.drawRightString(w - 46, 29, str(doc.page))
        canvas.restoreState()

    doc = GuideDoc(str(target), pagesize=A4, leftMargin=46, rightMargin=46,
                   topMargin=62, bottomMargin=49, title='Frontend Platform: User and Integration Guide',
                   author='Nexora project documentation', subject='Monday handover, user flows, architecture and SaaS integration',
                   invariant=1)
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='main',
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates(PageTemplate(id='guide', frames=[frame], onPage=page_frame))
    lines = source.read_text().splitlines()
    story = [Spacer(1, 65), Paragraph('DESKTOP-FIRST SAAS FOUNDATION', styles['GuideKicker']),
             Paragraph(inline(lines[0][2:]), styles['GuideCover'])]
    first_section = next(i for i, line in enumerate(lines) if line.startswith('## '))
    for line in lines[1:first_section]:
        if line.strip():
            story.append(Paragraph(inline(line), styles['GuideBody']))
    story.extend([Spacer(1, 22), Paragraph('USER WORKFLOWS  •  ARCHITECTURE  •  INTEGRATION  •  STATUS', styles['GuideKicker']), PageBreak(),
                  Paragraph('Contents', styles['GuideCover'])])
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle('GuideTOC', fontName='Body', fontSize=10, leading=16,
                                      textColor=INK, spaceBefore=6, leftIndent=0, firstLineIndent=0)]
    story.extend([toc, PageBreak()])
    i = first_section
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith('## '):
            story.extend([CondPageBreak(180), Spacer(1, 10), Paragraph(inline(line[3:]), styles['GuideH1'])])
            i += 1
        elif line.startswith('### '):
            story.extend([CondPageBreak(100), Paragraph(inline(line[4:]), styles['GuideH2'])])
            i += 1
        elif line.startswith('```'):
            kind = line[3:].strip()
            block = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                block.append(lines[i])
                i += 1
            i += 1
            if kind == 'flow':
                rows = [[Paragraph(f'<b>{n+1}</b>' + ('<br/>↓' if n+1<len(block) else ''), styles['GuideFlow']), Paragraph(inline(text), styles['GuideFlow'])]
                        for n, text in enumerate(block) if text.strip()]
                table = LongTable(rows, colWidths=[30, doc.width - 30], hAlign='LEFT')
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), PALE), ('BOX', (0, 0), (-1, -1), .7, LINE),
                    ('LINEBELOW', (0, 0), (-1, -2), .5, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                    ('TOPPADDING', (0, 0), (-1, -1), 9), ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
                ]))
                story.append(KeepTogether([table, Spacer(1, 12)]))
            else:
                story.append(Preformatted('\n'.join(block), styles['GuideCode'], maxLineLength=94))
        elif line.startswith('|'):
            raw = []
            while i < len(lines) and lines[i].startswith('|'):
                cells = [cell.strip() for cell in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[:\- ]+', cell) for cell in cells):
                    raw.append(cells)
                i += 1
            count = len(raw[0])
            weights = [.39, .61] if count == 2 else ([.07, .43, .50] if raw[0][0] == 'ID' else [.23, .37, .40])
            if count not in (2, 3):
                weights = [1 / count] * count
            cells = [[Paragraph(inline(cell), styles['GuideCellHead' if row == 0 else 'GuideCell']) for cell in cols]
                     for row, cols in enumerate(raw)]
            table = LongTable(cells, colWidths=[doc.width * w for w in weights], repeatRows=1, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), INK), ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, PALE]),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEBELOW', (0, 0), (-1, -1), .4, LINE),
                ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7),
                ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ]))
            story.extend([table, Spacer(1, 12)])
        elif line.startswith('- ') or re.match(r'^\d+\. ', line):
            text = '• ' + line[2:] if line.startswith('- ') else line
            story.append(Paragraph(inline(text), styles['GuideBullet']))
            i += 1
        else:
            block = [line]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|- |\d+\. )', lines[i]):
                block.append(lines[i])
                i += 1
            story.append(Paragraph(inline(' '.join(block)), styles['GuideBody']))
    doc.multiBuild(story)
    print(f'Generated {target.name} ({target.stat().st_size:,} bytes)')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'frontend-platform-guide.md')
    parser.add_argument('--output', type=Path, default=ROOT / 'frontend-platform-guide.pdf')
    parser.add_argument('--font-dir', type=Path, default=Path('/usr/share/fonts/truetype/dejavu'))
    args = parser.parse_args()
    build(args.source, args.output, args.font_dir)
