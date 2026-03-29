// @ts-check
import { parseSizeUnit } from '@core/utilities/parseSizeUnit.js';
import { halfPointToPixels } from '@core/super-converter/helpers.js';

/**
 * Cell margins configuration in pixels.
 * @typedef {Object} CellMargins
 * @property {number} top - Top margin in pixels
 * @property {number} right - Right margin in pixels
 * @property {number} bottom - Bottom margin in pixels
 * @property {number} left - Left margin in pixels
 */

/**
 * Parse cell margins from inline TD padding styles.
 *
 * @param {HTMLElement} element
 * @returns {CellMargins}
 */
export const parseCellMargins = (element) => {
  const { style } = element;

  const [topValuePt] = parseSizeUnit(style?.paddingTop);
  const [rightValuePt] = parseSizeUnit(style?.paddingRight);
  const [bottomValuePt] = parseSizeUnit(style?.paddingBottom);
  const [leftValuePt] = parseSizeUnit(style?.paddingLeft);

  const top = halfPointToPixels(topValuePt);
  const right = halfPointToPixels(rightValuePt);
  const bottom = halfPointToPixels(bottomValuePt);
  const left = halfPointToPixels(leftValuePt);

  return {
    top: top ?? 0,
    right: right ?? 0,
    bottom: bottom ?? 0,
    left: left ?? 0,
  };
};
