/** S3 KOB1 — Σ dòng CO thực tế trên lệnh = số dư 154 (ACDOCA và oracle) + âm tính. */
import { buildKob1 } from '../src/reports/kob1.ts';
import { bal154, eq, fiCr, fiDr, idx, on, runSuites, total } from './s3-lib.ts';

runSuites('S3', [{
  id: 'KOB1',
  build: (c) => buildKob1(c.table),
  // nguồn: mọi dòng ACDOCA của 621/622/627/154 trừ kết chuyển CO01
  sourceCount: (c) => c.table.filter((l) => ['154', '621', '622', '627'].includes(l.glAccount) && l.tCode !== 'CO01').length,
  tamperField: 'WKGBTR',
  reconcile: (r, c) => {
    const is: string[] = [];
    const ke = (pred: (k: string) => boolean) => (row: string[]) => pred(row[idx(r, 'KSTAR')]);
    eq(is, 'Σ WKGBTR vs số dư 154', total(r, 'WKGBTR'), bal154(c.table));
    eq(is, 'Σ WKGBTR vs oracle wip154', total(r, 'WKGBTR'), c.e.wip154_dr_minus_cr);
    const primary = ['621', '622', '627'].reduce((s, a) => s + fiDr(c.table, (l) => on(a)(l) && l.tCode !== 'CO01'), 0);
    eq(is, 'Σ chi phí ban đầu vs Nợ 621+622+627', total(r, 'WKGBTR', ke((k) => k !== '154')), primary);
    eq(is, 'Σ chi phí ban đầu vs oracle actual', total(r, 'WKGBTR', ke((k) => k !== '154')), c.e.actual);
    eq(is, 'Σ ghi Có nhập kho vs Có 154 (101E)', -total(r, 'WKGBTR', (row) => row[idx(r, 'VRGNG')] === 'RMWE'), fiCr(c.table, on('154', /101E/)));
    for (const row of r.rows) {
      const v = Number(row[idx(r, 'WKGBTR')]);
      if ((v >= 0 ? 'S' : 'H') !== row[idx(r, 'BEKNZ')]) is.push(`BEKNZ sai dấu ở ${row[idx(r, 'BELNR')]}`);
    }
    return is;
  },
}]).catch((e) => { console.error(e); process.exit(1); });
