/** S3 KKS1 — chênh lệch/WIP theo yếu tố đối soát ACDOCA và oracle (dM/dL/dO, wip154) + âm tính. */
import { buildKks1 } from '../src/reports/kks1.ts';
import { bal154, eq, fiCr, fiDr, idx, on, runSuites, total } from './s3-lib.ts';

runSuites('S3', [{
  id: 'KKS1',
  build: (c) => buildKks1(c.ev, c.computed, c.table),
  sourceCount: () => 3,
  tamperField: 'WIP',
  reconcile: (r, c) => {
    const is: string[] = [];
    const row = (k: string) => r.rows.find((x) => x[idx(r, 'KSTAR')] === k);
    const at = (k: string, f: string) => Number(row(k)?.[idx(r, f)]);
    eq(is, 'Σ PLAN vs oracle P', total(r, 'PLAN'), c.e.P);
    eq(is, 'Σ ACTUAL vs oracle actual', total(r, 'ACTUAL'), c.e.actual);
    eq(is, 'Σ ACTUAL vs Nợ 154 (CO01)', total(r, 'ACTUAL'), fiDr(c.table, on('154', /^CO01$/)));
    eq(is, 'Σ ORDER_VAR vs oracle delta', total(r, 'ORDER_VAR'), c.e.delta);
    eq(is, '621 ORDER_VAR vs oracle dM', at('621', 'ORDER_VAR'), c.e.dM);
    eq(is, '622 ORDER_VAR vs oracle dL', at('622', 'ORDER_VAR'), c.e.dL);
    eq(is, '627 ORDER_VAR vs oracle dO', at('627', 'ORDER_VAR'), c.e.dO);
    eq(is, 'Σ WIP vs số dư 154', total(r, 'WIP'), bal154(c.table));
    eq(is, 'Σ WIP vs oracle wip154', total(r, 'WIP'), c.e.wip154_dr_minus_cr);
    // Quyết toán thực tế trên FI: dòng 154 ở bước 7 (VA88/KKA2), ròng Có − Nợ
    const settled = c.table.filter((l) => l.glAccount === '154' && l.stepId === 7).reduce((s, l) => s + l.crAmount - l.drAmount, 0);
    if (c.e.stock === 'Valuated') {
      eq(is, 'Σ TARGET vs Nợ 155 (101E)', total(r, 'TARGET'), fiDr(c.table, on('155', /101E/)));
      eq(is, 'Σ VARIANCE vs quyết toán 154→632 (VA88)', total(r, 'VARIANCE'), settled);
    } else {
      eq(is, 'NV: Σ VARIANCE vs quyết toán − TARGET', total(r, 'VARIANCE'), settled - total(r, 'TARGET'));
      eq(is, 'NV: không có Có 154 khi nhập kho', fiCr(c.table, on('154', /101E/)), 0);
    }
    for (const x of r.rows) {
      const a = Number(x[idx(r, 'ACTUAL')]), w = Number(x[idx(r, 'WIP')]), t = Number(x[idx(r, 'TARGET')]);
      if (Number(x[idx(r, 'VARIANCE')]) !== a - w - t) is.push(`${x[idx(r, 'KSTAR')]}: VARIANCE ≠ ACTUAL − WIP − TARGET`);
    }
    return is;
  },
}]).catch((e) => { console.error(e); process.exit(1); });
