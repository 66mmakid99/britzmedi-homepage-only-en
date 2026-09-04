import { describe, it, expect } from 'vitest';
import { parseBlocks } from './ChatMessageBody';

// These cases are taken from real stored chatbot answers (chat_messages in the
// britzmedi-leads D1 database) that reached visitors as raw Markdown.

describe('parseBlocks', () => {
  it('returns no blocks for empty input', () => {
    expect(parseBlocks('')).toEqual([]);
    expect(parseBlocks('   \n\n  ')).toEqual([]);
  });

  it('keeps a plain answer as a single paragraph', () => {
    const blocks = parseBlocks('Pricing depends on your region and order volume.');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ kind: 'p', lines: ['Pricing depends on your region and order volume.'] });
  });

  it('splits paragraphs on blank lines', () => {
    const blocks = parseBlocks('First para.\n\nSecond para.');
    expect(blocks.map(b => b.kind)).toEqual(['p', 'p']);
  });

  it('parses the bullet list from message mid=6 (TORR RF specs)', () => {
    const blocks = parseBlocks(
      '**Technical Specs:**\n' +
      '- Frequency: 1 MHz ± 10%\n' +
      '- Max Power: 55W (Medium/Large handpieces), 7.5W (Small)\n' +
      '- Weight: 36 kg',
    );
    expect(blocks[0]).toEqual({ kind: 'p', lines: ['**Technical Specs:**'] });
    expect(blocks[1]).toEqual({
      kind: 'ul',
      items: [
        'Frequency: 1 MHz ± 10%',
        'Max Power: 55W (Medium/Large handpieces), 7.5W (Small)',
        'Weight: 36 kg',
      ],
    });
  });

  it('parses numbered lists', () => {
    const blocks = parseBlocks('1. First step\n2. Second step');
    expect(blocks[0]).toEqual({ kind: 'ol', items: ['First step', 'Second step'] });
  });

  it('parses the handpiece table from message mid=86', () => {
    const blocks = parseBlocks(
      '| Handpiece | Tip Size | Depth | Use |\n' +
      '|-----------|----------|-------|-----|\n' +
      '| Large | Ø 50mm | 3.5-10mm | Body contouring |\n' +
      '| Small | Ø 40mm | 2.5-6mm | Facial tightening |',
    );
    expect(blocks).toHaveLength(1);
    const table = blocks[0];
    expect(table.kind).toBe('table');
    if (table.kind !== 'table') throw new Error('expected a table block');
    expect(table.header).toEqual(['Handpiece', 'Tip Size', 'Depth', 'Use']);
    expect(table.rows).toHaveLength(2);
    expect(table.rows[0]).toEqual(['Large', 'Ø 50mm', '3.5-10mm', 'Body contouring']);
  });

  it('does not treat a pipe-containing sentence as a table', () => {
    const blocks = parseBlocks('Use the Single | Pulse | Repeat modes.');
    expect(blocks[0].kind).toBe('p');
  });

  it('demotes a stray heading to bold instead of showing the hashes', () => {
    const blocks = parseBlocks('### Handpieces');
    expect(blocks[0]).toEqual({ kind: 'p', lines: ['**Handpieces**'] });
  });

  it('keeps consecutive plain lines together as one paragraph with line breaks', () => {
    const blocks = parseBlocks('Line one\nLine two');
    expect(blocks[0]).toEqual({ kind: 'p', lines: ['Line one', 'Line two'] });
  });

  it('handles CRLF input', () => {
    const blocks = parseBlocks('- a\r\n- b');
    expect(blocks[0]).toEqual({ kind: 'ul', items: ['a', 'b'] });
  });
});
