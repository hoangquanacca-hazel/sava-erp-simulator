/** S3 MB51 — đối soát giá trị/số lượng chuyển động kho với ACDOCA và oracle (54 ca) + âm tính. */
import { documentNumbers } from '../src/reports/core.ts';
import { buildMb51 } from '../src/reports/mb51.ts';
import { eq, fiCr, fiDr, idx, on, runSuites, total } from './s3-lib.ts';

runSuites('S3', [{
  id: 'MB51',
  build: (c) => buildMb51(c.ev),
  sourceCount: (c) => c.ev.movements.length,
  tamperField: 'DMBTR',
  reconcile: (r, c) => {
    const is: string[] = [];
    const bw = (b: string) => (row: string[]) => row[idx(r, 'BWART')] === b;
    const valuated = c.e.stock === 'Valuated';
    const delivered = Math.round(c.params.orderQuantity * c.e.ratio);
    eq(is, 'Σ261 vs Có 152 (261E)', total(r, 'DMBTR', bw('261')), fiCr(c.table, on('152', /261E/)));
    eq(is, 'Σ261 vs oracle cr152', total(r, 'DMBTR', bw('261')), c.e.cr152);
    eq(is, 'Σ101 vs Nợ 155 (101E)', total(r, 'DMBTR', bw('101')), fiDr(c.table, on('155', /101E/)));
    eq(is, 'Σ601 vs Có 155 (601E)', total(r, 'DMBTR', bw('601')), fiCr(c.table, on('155', /601E/)));
    eq(is, 'SL 101 vs SL giao', total(r, 'MENGE', bw('101')), delivered);
    eq(is, 'SL 601 vs SL giao', total(r, 'MENGE', bw('601')), delivered);
    if (!valuated) eq(is, 'NV: Σ101+601', total(r, 'DMBTR', bw('101')) + total(r, 'DMBTR', bw('601')), 0);
    // BELNR phải trỏ tới chứng từ FI có thật; hàng không định giá thì không có BELNR cho 101/601
    const fiDocs = new Set(documentNumbers(c.table).values());
    for (const row of r.rows) {
      const belnr = row[idx(r, 'BELNR')];
      const bwart = row[idx(r, 'BWART')];
      if (belnr && !fiDocs.has(belnr)) is.push(`BELNR ${belnr} không có trong ACDOCA`);
      if (!belnr && (bwart === '261' || valuated)) is.push(`${bwart}: thiếu BELNR`);
      if (belnr && !valuated && bwart !== '261') is.push(`NV ${bwart}: không được có BELNR`);
    }
    return is;
  },
}]).catch((e) => { console.error(e); process.exit(1); });
