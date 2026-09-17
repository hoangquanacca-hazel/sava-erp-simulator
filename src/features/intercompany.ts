import { AcdocaLine, MTOComputed, MTOParameters } from '../types';
import { nz, postDocument, postingDims } from '../utils/acdoca';

function roundVnd(n: number): number {
  return Math.round(nz(n));
}

export function icAmounts(params: MTOParameters, computed: MTOComputed): {
  markup: number;
  internalNet: number;
  vat: number;
  gross: number;
  unrealized: number;
} {
  const markup = nz(params.icMarkupPercent);
  const internalNet = roundVnd(computed.plannedCost * (1 + markup / 100));
  const vat = roundVnd(internalNet * nz(params.vatRate));
  const gross = internalNet + vat;
  const unrealized = internalNet - roundVnd(computed.plannedCost);
  return { markup, internalNet, vat, gross, unrealized };
}

export function postIntercompany(
  ACDOCA_TABLE: AcdocaLine[],
  params: MTOParameters,
  computed: MTOComputed
): AcdocaLine[] {
  if (!params.intercompanyMto) return [];
  const { internalNet, vat, gross, unrealized } = icAmounts(params, computed);
  if (gross === 0 && internalNet === 0) return [];
  const dims = postingDims(params);
  const written: AcdocaLine[] = [];

  written.push(
    ...postDocument(ACDOCA_TABLE, 6, 'VF01-IC', undefined, [
      { glAccount: '131IC', accountName: 'Phải thu liên công ty (MÔ PHỎNG)', drAmount: gross, crAmount: 0, ...dims },
      { glAccount: '511IC', accountName: 'Doanh thu nội bộ (MÔ PHỎNG)', drAmount: 0, crAmount: internalNet, ...dims },
      { glAccount: '3331', drAmount: 0, crAmount: vat, ...dims },
    ])
  );

  written.push(
    ...postDocument(ACDOCA_TABLE, 6, 'MIRO-IC', undefined, [
      { glAccount: '632', drAmount: internalNet, crAmount: 0, ...dims },
      { glAccount: '331IC', accountName: 'Phải trả liên công ty (MÔ PHỎNG)', drAmount: 0, crAmount: internalNet, ...dims },
    ])
  );

  written.push(
    ...postDocument(ACDOCA_TABLE, 7, 'ELIM-IC', undefined, [
      { glAccount: '511IC', accountName: 'Doanh thu nội bộ (MÔ PHỎNG)', drAmount: internalNet, crAmount: 0, ...dims },
      { glAccount: '632IC', accountName: 'Giá vốn nội bộ (MÔ PHỎNG)', drAmount: 0, crAmount: internalNet, ...dims },
    ])
  );

  if (unrealized !== 0) {
    written.push(
      ...postDocument(ACDOCA_TABLE, 7, 'ELIM-UIP', undefined, [
        {
          glAccount: '632',
          drAmount: unrealized > 0 ? unrealized : 0,
          crAmount: unrealized < 0 ? Math.abs(unrealized) : 0,
          ...dims,
        },
        {
          glAccount: '155',
          drAmount: unrealized < 0 ? Math.abs(unrealized) : 0,
          crAmount: unrealized > 0 ? unrealized : 0,
          ...dims,
        },
      ])
    );
  }

  return written;
}
