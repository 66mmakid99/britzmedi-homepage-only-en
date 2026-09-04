// Renders a chatbot message with the small Markdown subset the widget supports.
//
// Why not `marked` (which is already a dependency)? Every HTML-producing renderer
// ends at `dangerouslySetInnerHTML`, and this text is model output that a visitor
// can steer with prompt injection. Building React elements instead makes that whole
// class of XSS impossible without pulling in a sanitizer.
//
// Until 2026-09 the widget rendered messages as raw text, so 20% of answers reached
// visitors as literal `**Technical Specs:**` and, once, an entire Markdown table of
// pipes inside a 320px bubble.

import type { ReactNode } from 'react';
import { Fragment } from 'react';

// Site paths the bot is told to emit as bare paths (never as Markdown links).
const LINKABLE_PATHS = [
  '/contact',
  '/products',
  '/certifications',
  '/resources',
  '/about',
  '/faq',
  '/blog',
];

// One matcher for everything that becomes something other than plain text inside a
// line. Order matters: inline code first so its contents are never re-parsed.
const INLINE_PATTERN = new RegExp(
  [
    '`([^`]+)`', // 1: inline code
    '\\*\\*([^*]+)\\*\\*', // 2: bold
    '(https?://[^\\s<>()]+[^\\s<>().,;:!?])', // 3: absolute URL
    '([\\w.+-]+@[\\w-]+\\.[\\w.-]+)', // 4: email
    `(${LINKABLE_PATHS.join('|')})(?![\\w/-])`, // 5: site path
  ].join('|'),
  'g',
);

const LINK_CLASS = 'underline decoration-primary-400 underline-offset-2 font-medium text-primary-700 hover:text-primary-800';

interface InlineProps {
  text: string;
  onLinkClick?: (href: string) => void;
}

function InlineText({ text, onLinkClick }: InlineProps) {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  // `matchAll` needs a fresh lastIndex each call — the regex is module-level.
  INLINE_PATTERN.lastIndex = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(text.slice(cursor, index));

    const [full, code, bold, url, email, path] = match;

    if (code !== undefined) {
      nodes.push(
        <code key={key++} className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[0.85em] text-slate-800">
          {code}
        </code>,
      );
    } else if (bold !== undefined) {
      nodes.push(<strong key={key++} className="font-semibold">{bold}</strong>);
    } else if (url !== undefined) {
      nodes.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={LINK_CLASS}
          onClick={() => onLinkClick?.(url)}
        >
          {url}
        </a>,
      );
    } else if (email !== undefined) {
      nodes.push(
        <a key={key++} href={`mailto:${email}`} className={LINK_CLASS} onClick={() => onLinkClick?.(`mailto:${email}`)}>
          {email}
        </a>,
      );
    } else if (path !== undefined) {
      nodes.push(
        <a key={key++} href={path} className={LINK_CLASS} onClick={() => onLinkClick?.(path)}>
          {path}
        </a>,
      );
    }

    cursor = index + full.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <>{nodes.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}

type Block =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'table'; header: string[]; rows: string[][] };

const BULLET_RE = /^\s*[-*+]\s+(.*)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const TABLE_ROW_RE = /^\s*\|.*\|\s*$/;
const TABLE_SEP_RE = /^\s*\|[\s:|-]+\|\s*$/;
// Headers are banned in the prompt, but strip the marks if one slips through
// rather than showing "### " to a visitor.
const HEADING_RE = /^\s*#{1,6}\s+(.*)$/;

function splitTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

/** Parse the supported Markdown subset into blocks. Exported for tests. */
export function parseBlocks(input: string): Block[] {
  const lines = (input || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Table: a row, then a separator row. Without the separator it is just text.
    if (TABLE_ROW_RE.test(line) && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1])) {
      const header = splitTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && TABLE_ROW_RE.test(lines[i])) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ kind: 'table', header, rows });
      continue;
    }

    if (BULLET_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && BULLET_RE.test(lines[i])) {
        items.push(lines[i].match(BULLET_RE)![1]);
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    if (ORDERED_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && ORDERED_RE.test(lines[i])) {
        items.push(lines[i].match(ORDERED_RE)![1]);
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    // Paragraph: consecutive plain lines up to a blank line or another block start.
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !BULLET_RE.test(lines[i]) &&
      !ORDERED_RE.test(lines[i]) &&
      !TABLE_ROW_RE.test(lines[i])
    ) {
      const heading = lines[i].match(HEADING_RE);
      paraLines.push(heading ? `**${heading[1]}**` : lines[i].trim());
      i++;
    }
    if (paraLines.length) blocks.push({ kind: 'p', lines: paraLines });
  }

  return blocks;
}

interface ChatMessageBodyProps {
  content: string;
  /** Fired when the visitor clicks any link inside a message (conversion signal). */
  onLinkClick?: (href: string) => void;
}

export default function ChatMessageBody({ content, onLinkClick }: ChatMessageBodyProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2 text-sm leading-relaxed break-words">
      {blocks.map((block, bi) => {
        if (block.kind === 'ul') {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-4">
              {block.items.map((item, ii) => (
                <li key={ii}><InlineText text={item} onLinkClick={onLinkClick} /></li>
              ))}
            </ul>
          );
        }

        if (block.kind === 'ol') {
          return (
            <ol key={bi} className="list-decimal space-y-1 pl-4">
              {block.items.map((item, ii) => (
                <li key={ii}><InlineText text={item} onLinkClick={onLinkClick} /></li>
              ))}
            </ol>
          );
        }

        if (block.kind === 'table') {
          // The bubble is ~320px on a phone; the table scrolls inside itself so the
          // page never scrolls sideways.
          return (
            <div key={bi} className="-mx-1 overflow-x-auto">
              <table className="w-max min-w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {block.header.map((cell, ci) => (
                      <th key={ci} className="border border-slate-300 bg-slate-200 px-2 py-1 text-left font-semibold">
                        <InlineText text={cell} onLinkClick={onLinkClick} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="border border-slate-300 px-2 py-1 align-top">
                          <InlineText text={cell} onLinkClick={onLinkClick} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={bi}>
            {block.lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                <InlineText text={line} onLinkClick={onLinkClick} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
