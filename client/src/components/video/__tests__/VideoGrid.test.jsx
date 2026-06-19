import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { getGridLayout } from '../VideoGrid.jsx';

describe('getGridLayout PBT', () => {
  test('for all n in [1, 8], cols * rows >= n and layout is one of the 5 defined configurations', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 8 }), (n) => {
        const layout = getGridLayout(n);
        
        // Grid capacity should be greater or equal to participant count
        expect(layout.cols * layout.rows).toBeGreaterThanOrEqual(n);
        
        // Assert it is one of the 5 defined configurations
        const validConfigs = [
          { cols: 1, rows: 1 },
          { cols: 2, rows: 1 },
          { cols: 2, rows: 2 },
          { cols: 3, rows: 2 },
          { cols: 4, rows: 2 },
        ];
        
        const isConfigValid = validConfigs.some(
          (c) => c.cols === layout.cols && c.rows === layout.rows
        );
        expect(isConfigValid).toBe(true);
      })
    );
  });
});
