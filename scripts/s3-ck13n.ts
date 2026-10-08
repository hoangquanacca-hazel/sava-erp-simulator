/** S3 CK13N — giá thành kế hoạch = oracle P; phần đã giao khớp 155/632110–140 trên FI (hàng định giá) + âm tính. */
import { buildCk13n } from '../src/reports/ck13n.ts';
import { eq, fiDr, idx, on, runSuites, total } from './s3-lib.ts';

const COGS = { MAT: '632110', LAB: '632120', MACH: '632130', OVH: '632140' } as const;

runSuites('S3', [{
  id: 'CK13N',
  build: (c) => buildCk13n(c.params, c.computed),
  sourceCount: (c) => c.computed.bomItemBreakdowns!.length + 3 + (c.computed.variantAddonTotal !== 0 ? 1 : 0),
  tamperField: 'WERT',
  reconcile: (r, c) => {
    const is: string[] = [];
    const el = (e: string) => total(r, 'WERT', (row) => row[idx(r, 'ELEMT')] === e);
    eq(is, 'Σ WERT vs oracle P', total(r, 'WERT'), c.e.P);
    eq(is, 'MAT vs oracle NVL kế hoạch (cr152 − dM)', el('MAT'), c.e.cr152 - c.e.dM);
    if (c.e.stock === 'Valuated' && c.e.ratio > 0) {
      const share = Math.round(total(r, 'WERT') * c.e.ratio);
      eq(is, 'Σ WERT × tỷ lệ giao vs Nợ 155 (101E)', share, fiDr(c.table, on('155', /101E/)));
      let cogs = 0;
      for (const [e, acc] of Object.entries(COGS)) {
        const fi = fiDr(c.table, on(acc, /601E/));
        cogs += fi;
        // tách theo số dư lớn nhất: từng thành phần lệch tối đa 1 VND so với tỷ lệ thuần
        if (Math.abs(el(e) * c.e.ratio - fi) > 1) is.push(`${e}: ${el(e)}×${c.e.ratio} lệch ${acc} ${fi} quá 1 VND`);
      }
      eq(is, 'Σ WERT × tỷ lệ giao vs Σ Nợ 632110–140 (601E)', share, cogs);
    }
    return is;
  },
}]).catch((e) => { console.error(e); process.exit(1); });
