import { describe, it, expect } from 'vitest';

import { TableCell } from './table-cell.js';

describe('TableCell verticalAlign renderDOM', () => {
  const attributes = TableCell.config.addAttributes.call(TableCell);

  it('omits style when verticalAlign is not provided', () => {
    expect(attributes.verticalAlign.renderDOM({})).toEqual({});
    expect(attributes.verticalAlign.renderDOM({ verticalAlign: null })).toEqual({});
  });

  it('adds vertical-align style when attribute is set', () => {
    expect(attributes.verticalAlign.renderDOM({ verticalAlign: 'bottom' })).toEqual({
      style: 'vertical-align: bottom',
    });
  });

  it('parses background color from inline td style', () => {
    const td = document.createElement('td');
    td.style.backgroundColor = 'rgb(255, 255, 0)';

    expect(attributes.background.parseDOM(td)).toEqual({ color: 'ffff00' });
  });

  it('parses padding into cellMargins from inline td style', () => {
    const td = document.createElement('td');
    td.style.padding = '5pt';

    expect(attributes.cellMargins.parseDOM(td)).toEqual({
      top: expect.closeTo(6.67, 3),
      right: expect.closeTo(6.67, 3),
      bottom: expect.closeTo(6.67, 3),
      left: expect.closeTo(6.67, 3),
    });
  });
});
