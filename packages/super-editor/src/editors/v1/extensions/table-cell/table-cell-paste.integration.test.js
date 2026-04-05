/**
 * HTML paste → ProseMirror JSON for `tableCell`.
 *
 * ParseDOM fills `attrs.borders`; the table extension then migrates them to
 * `attrs.tableCellProperties.borders` (OOXML, eighths of a point) and sets `attrs.borders` to null.
 * Border assertions read that migrated shape.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { handleHtmlPaste } from '@core/InputRule.js';
import { initTestEditor, loadTestDataForEditorTests } from '../../tests/helpers/helpers.js';

let docData;
let editor;

/** Same as legacyBorderMigration: px → OOXML eighths of a point. */
const pxToEighthPt = (px) => Math.round((px / (96 / 72)) * 8);

beforeAll(async () => {
  docData = await loadTestDataForEditorTests('blank-doc.docx');
});

afterEach(() => {
  editor?.destroy();
  editor = null;
});

/**
 * Fresh editor from blank doc, paste HTML, return `tableCell` / `tableHeader` nodes (depth-first)
 * from the first `table` in the document.
 */
function pasteTableCells(html) {
  ({ editor } = initTestEditor({
    content: docData.docx,
    media: docData.media,
    mediaFiles: docData.mediaFiles,
    fonts: docData.fonts,
    mode: 'docx',
  }));

  expect(handleHtmlPaste(html, editor)).toBe(true);

  const table = editor.getJSON().content?.find((n) => n?.type === 'table');
  expect(table).toBeTruthy();

  const cells = [];
  const collectTableCellNodesInOrder = (node) => {
    if (node?.type === 'tableCell' || node?.type === 'tableHeader') {
      cells.push(node);
    }
    for (const child of node?.content ?? []) {
      collectTableCellNodesInOrder(child);
    }
  };
  collectTableCellNodesInOrder(table);

  return cells;
}

describe('table-cell HTML paste integration', () => {
  it('parses td border shorthand: solid, dashed, dotted, widths and colors', () => {
    const cells = pasteTableCells(`
      <table><tbody>
        <tr>
          <td style="border: 2px solid rgb(255, 0, 0)">A</td>
          <td style="border: 1px dashed rgb(0, 0, 255)">B</td>
        </tr>
        <tr>
          <td style="border: 3px dotted #00aa00">C</td>
          <td>D</td>
        </tr>
      </tbody></table>
    `);

    expect(cells).toHaveLength(4);

    const b0 = cells[0].attrs?.tableCellProperties?.borders;
    expect(b0?.top).toMatchObject({ val: 'single', color: '#ff0000' });
    expect(b0?.top?.size).toBe(pxToEighthPt(2));
    for (const side of ['top', 'right', 'bottom', 'left']) {
      expect(b0?.[side]).toMatchObject({ val: 'single', color: '#ff0000' });
    }

    const b1 = cells[1].attrs?.tableCellProperties?.borders;
    expect(b1?.top).toMatchObject({ val: 'dashed', color: '#0000ff' });
    expect(b1?.top?.size).toBe(pxToEighthPt(1));

    const b2 = cells[2].attrs?.tableCellProperties?.borders;
    expect(b2?.top).toMatchObject({ val: 'dotted', color: '#00aa00' });
    expect(b2?.top?.size).toBe(pxToEighthPt(3));

    expect(cells[3].attrs?.tableCellProperties?.borders).toBeUndefined();
    expect(cells[3].attrs?.borders).toBeNull();
  });

  it('parses per-side borders when sides differ', () => {
    const cells = pasteTableCells(`
      <table><tbody><tr>
        <td style="border: 1px solid rgb(0, 0, 0); border-top: 2px dashed rgb(255, 0, 0); border-right: 1px dotted rgb(0, 0, 255)">X</td>
      </tr></tbody></table>
    `);

    expect(cells).toHaveLength(1);
    const b = cells[0].attrs?.tableCellProperties?.borders;
    expect(b?.top).toMatchObject({ val: 'dashed', color: '#ff0000' });
    expect(b?.top?.size).toBe(pxToEighthPt(2));
    expect(b?.right).toMatchObject({ val: 'dotted', color: '#0000ff' });
    expect(b?.bottom).toMatchObject({ val: 'single', color: 'auto' });
    expect(b?.left).toMatchObject({ val: 'single', color: 'auto' });
  });

  it('parses different background colors per row and cell', () => {
    const cells = pasteTableCells(`
      <table><tbody>
        <tr>
          <td style="background-color: rgb(255, 255, 0)">R0C0</td>
          <td style="background-color: rgb(0, 255, 255)">R0C1</td>
        </tr>
        <tr>
          <td style="background-color: rgb(128, 0, 128)">R1C0</td>
          <td>R1C1 plain</td>
        </tr>
      </tbody></table>
    `);

    expect(cells).toHaveLength(4);
    expect(cells[0].attrs?.background).toEqual({ color: '#ffff00' });
    expect(cells[1].attrs?.background).toEqual({ color: '#00ffff' });
    expect(cells[2].attrs?.background).toEqual({ color: '#800080' });
    expect(cells[3].attrs?.background == null).toBe(true);
  });

  it('parses vertical-align from td style', () => {
    const cells = pasteTableCells(`
      <table><tbody><tr>
        <td style="vertical-align: middle">M</td>
        <td style="vertical-align: bottom">B</td>
        <td>T</td>
      </tr></tbody></table>
    `);

    expect(cells).toHaveLength(3);
    expect(cells[0].attrs?.verticalAlign).toBe('center');
    expect(cells[1].attrs?.verticalAlign).toBe('bottom');
    expect(cells[2].attrs?.verticalAlign == null).toBe(true);
  });

  it('parses padding into cellMargins on pasted cells', () => {
    const cells = pasteTableCells(`
      <table><tbody><tr>
        <td style="padding: 5pt">P</td>
      </tr></tbody></table>
    `);

    expect(cells[0].attrs?.cellMargins).toEqual({
      top: 7,
      right: 7,
      bottom: 7,
      left: 7,
    });
  });
});
