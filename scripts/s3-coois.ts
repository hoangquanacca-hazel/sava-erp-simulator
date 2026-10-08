/** S3 COOIS — 5 danh sách (Header, Components, Operations, Confirmations, Documented Goods Movements). */
import {
  buildCooisComponents, buildCooisConfirmations, buildCooisGoodsMovements, buildCooisHeader, buildCooisOperations,
} from '../src/reports/coois.ts';
import { eq, fiCr, fiDr, idx, on, runSuites, total } from './s3-lib.ts';

const CO11N = /^CO11N$/;
const CO01 = /^CO01$/;

runSuites('S3', [
  {
    id: 'COOIS_HEADER',
    build: (c) => buildCooisHeader(c.ev, c.computed.plannedCost),
    sourceCount: () => 1,
    tamperField: 'ACT_COST',
    reconcile: (r, c) => {
      const is: string[] = [];
      eq(is, 'ACT_COST vs Nợ 154 (CO01)', total(r, 'ACT_COST'), fiDr(c.table, on('154', CO01)));
      eq(is, 'ACT_COST vs oracle actual', total(r, 'ACT_COST'), c.e.actual);
      eq(is, 'PLAN_COST vs oracle P', total(r, 'PLAN_COST'), c.e.P);
      eq(is, 'WEMNG vs SL giao', total(r, 'WEMNG'), Math.round(c.params.orderQuantity * c.e.ratio));
      eq(is, 'GAMNG vs SL lệnh', total(r, 'GAMNG'), c.params.orderQuantity);
      const st = r.rows[0][idx(r, 'STTXT')];
      const want = c.e.ratio === 1 ? 'REL CNF DLV' : c.e.ratio > 0 ? 'REL PCNF PDLV' : 'REL PCNF';
      if (st !== want) is.push(`STTXT ${st} ≠ ${want}`);
      return is;
    },
  },
  {
    id: 'COOIS_COMPONENTS',
    build: (c) => buildCooisComponents(c.ev),
    sourceCount: (c) => c.computed.bomItemBreakdowns!.length,
    tamperField: 'ACT_VAL',
    reconcile: (r, c) => {
      const is: string[] = [];
      eq(is, 'Σ ACT_VAL vs Có 152 (261E)', total(r, 'ACT_VAL'), fiCr(c.table, on('152', /261E/)));
      eq(is, 'Σ ACT_VAL vs oracle cr152', total(r, 'ACT_VAL'), c.e.cr152);
      eq(is, 'Σ ACT_VAL − PLAN_VAL vs oracle dM', total(r, 'ACT_VAL') - total(r, 'PLAN_VAL'), c.e.dM);
      return is;
    },
  },
  {
    id: 'COOIS_OPERATIONS',
    build: (c) => buildCooisOperations(c.ev),
    sourceCount: (c) => c.ev.operations.length,
    tamperField: 'ACT_COST',
    reconcile: (r, c) => {
      const is: string[] = [];
      eq(is, 'Σ ACT_COST vs Nợ 622+627 (CO11N)', total(r, 'ACT_COST'), fiDr(c.table, on('622', CO11N)) + fiDr(c.table, on('627', CO11N)));
      eq(is, 'Σ ACT_COST vs oracle cr334+cr214', total(r, 'ACT_COST'), c.e.cr334 + c.e.cr214);
      return is;
    },
  },
  {
    id: 'COOIS_CONFIRMATIONS',
    build: (c) => buildCooisConfirmations(c.ev),
    sourceCount: (c) => c.ev.confirmations.length,
    tamperField: 'LAB_VAL',
    reconcile: (r, c) => {
      const is: string[] = [];
      eq(is, 'Σ LAB_VAL vs Nợ 622 (CO11N)', total(r, 'LAB_VAL'), fiDr(c.table, on('622', CO11N)));
      eq(is, 'Σ LAB_VAL vs oracle cr334', total(r, 'LAB_VAL'), c.e.cr334);
      eq(is, 'Σ MOH_VAL vs Nợ 627 (CO11N)', total(r, 'MOH_VAL'), fiDr(c.table, on('627', CO11N)));
      eq(is, 'Σ MOH_VAL vs oracle cr214', total(r, 'MOH_VAL'), c.e.cr214);
      eq(is, 'Σ LMNGA vs SL giao', total(r, 'LMNGA'), Math.round(c.params.orderQuantity * c.e.ratio));
      return is;
    },
  },
  {
    id: 'COOIS_GOODSMVT',
    build: (c) => buildCooisGoodsMovements(c.ev),
    sourceCount: (c) => c.ev.movements.filter((m) => m.bwart !== '601').length,
    tamperField: 'DMBTR',
    reconcile: (r, c) => {
      const is: string[] = [];
      const bw = (b: string) => (row: string[]) => row[idx(r, 'BWART')] === b;
      eq(is, 'Σ261 vs Có 152 (261E)', total(r, 'DMBTR', bw('261')), fiCr(c.table, on('152', /261E/)));
      eq(is, 'Σ101 vs Nợ 155 (101E)', total(r, 'DMBTR', bw('101')), fiDr(c.table, on('155', /101E/)));
      eq(is, 'SL 101 vs SL giao', total(r, 'MENGE', bw('101')), Math.round(c.params.orderQuantity * c.e.ratio));
      if (r.rows.some(bw('601'))) is.push('có 601 trong chuyển động của lệnh');
      return is;
    },
  },
]).catch((e) => { console.error(e); process.exit(1); });
