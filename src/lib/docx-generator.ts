import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from 'docx'

// ─── Candidate constants ──────────────────────────────────────────────────────
const CANDIDATE = {
  name: 'Siddharth Jaiswal',
  email: 'siddharthjaiswal1993@gmail.com',
  linkedin: 'linkedin.com/in/siddharthjaiswal',
  location: 'India / Remote',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function spacer(before = 120, after = 0) {
  return { before, after, line: 276 }
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
    spacing: spacer(80, 80),
    children: [],
  })
}

function sectionHeading(text: string) {
  return new Paragraph({
    spacing: spacer(200, 60),
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 20,
        color: '1E3A5F',
        font: 'Calibri',
      }),
    ],
  })
}

function bulletLine(text: string) {
  return new Paragraph({
    spacing: spacer(40, 40),
    indent: { left: convertInchesToTwip(0.25) },
    numbering: undefined,
    children: [
      new TextRun({ text: '• ', bold: true, color: '4F6B8F', font: 'Calibri', size: 20 }),
      new TextRun({ text: text.trim(), font: 'Calibri', size: 20 }),
    ],
  })
}

function bodyText(text: string, options: { bold?: boolean; italic?: boolean; size?: number } = {}) {
  return new Paragraph({
    spacing: spacer(60, 60),
    children: [
      new TextRun({
        text,
        font: 'Calibri',
        size: options.size ?? 20,
        bold: options.bold,
        italics: options.italic,
      }),
    ],
  })
}

// ─── Parse bullets ─────────────────────────────────────────────────────────────

function parseBullets(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter((l) => l.length > 0)
}

function parseParagraphs(raw: string): string[] {
  return raw
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter((p) => p.length > 0)
}

// ─── Resume document ──────────────────────────────────────────────────────────

export async function generateResumeDocx(
  job: { company: string; title: string },
  resumeSummary: string,
  resumeBullets: string
): Promise<Buffer> {
  const bullets = parseBullets(resumeBullets)

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.9),
              right: convertInchesToTwip(0.9),
            },
          },
        },
        children: [
          // Name
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: spacer(0, 40),
            children: [
              new TextRun({
                text: CANDIDATE.name,
                bold: true,
                size: 36,
                font: 'Calibri',
                color: '1E3A5F',
              }),
            ],
          }),

          // Contact line
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: spacer(0, 40),
            children: [
              new TextRun({ text: CANDIDATE.email, font: 'Calibri', size: 18, color: '555555' }),
              new TextRun({ text: '  |  ', font: 'Calibri', size: 18, color: '999999' }),
              new TextRun({ text: CANDIDATE.linkedin, font: 'Calibri', size: 18, color: '555555' }),
              new TextRun({ text: '  |  ', font: 'Calibri', size: 18, color: '999999' }),
              new TextRun({ text: CANDIDATE.location, font: 'Calibri', size: 18, color: '555555' }),
            ],
          }),

          divider(),

          // Tailored for label
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: spacer(0, 120),
            children: [
              new TextRun({
                text: `Tailored for: ${job.title} at ${job.company}`,
                font: 'Calibri',
                size: 18,
                italics: true,
                color: '888888',
              }),
            ],
          }),

          // Professional Summary
          sectionHeading('Professional Summary'),
          divider(),
          bodyText(resumeSummary),

          // Tailored Highlights
          sectionHeading('Tailored Highlights'),
          divider(),
          ...bullets.map((b) => bulletLine(b)),

          // Footer note
          new Paragraph({
            spacing: spacer(400, 0),
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'This document contains tailored content generated for this specific application.',
                font: 'Calibri',
                size: 16,
                italics: true,
                color: 'AAAAAA',
              }),
            ],
          }),
        ],
      },
    ],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}

// ─── Cover letter document ────────────────────────────────────────────────────

export async function generateCoverLetterDocx(
  job: { company: string; title: string },
  coverLetter: string
): Promise<Buffer> {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const paragraphs = parseParagraphs(coverLetter)

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.1),
              right: convertInchesToTwip(1.1),
            },
          },
        },
        children: [
          // Date
          new Paragraph({
            spacing: spacer(0, 240),
            children: [new TextRun({ text: today, font: 'Calibri', size: 22, color: '555555' })],
          }),

          // Addressee
          bodyText(`Hiring Team`, { bold: true }),
          bodyText(job.company),

          new Paragraph({ spacing: spacer(120, 120), children: [] }),

          // Subject
          new Paragraph({
            spacing: spacer(0, 200),
            children: [
              new TextRun({ text: 'Re: ', font: 'Calibri', size: 22, bold: true }),
              new TextRun({ text: job.title, font: 'Calibri', size: 22, bold: true }),
            ],
          }),

          // Body paragraphs
          ...paragraphs.map((p) =>
            new Paragraph({
              spacing: spacer(80, 80),
              children: [new TextRun({ text: p, font: 'Calibri', size: 22 })],
            })
          ),

          // Sign-off
          new Paragraph({ spacing: spacer(200, 80), children: [new TextRun({ text: 'Regards,', font: 'Calibri', size: 22 })] }),
          new Paragraph({ spacing: spacer(40, 40), children: [new TextRun({ text: CANDIDATE.name, font: 'Calibri', size: 22, bold: true })] }),
          new Paragraph({ spacing: spacer(0, 0), children: [new TextRun({ text: CANDIDATE.email, font: 'Calibri', size: 20, color: '555555' })] }),
        ],
      },
    ],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}
