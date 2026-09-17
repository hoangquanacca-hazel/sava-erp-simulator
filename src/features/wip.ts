import { MTOParameters } from '../types';
import { nz } from '../utils/acdoca';

export interface WipStatus {
  ordered: number;
  delivered: number;
  ratio: number;
  teco: boolean;
  /** Explicit missing deliveredQuantity → treat as full TECO so happy-path 7-step unchanged. */
  deliveredWasOmitted: boolean;
}

export function wipStatusOf(params: MTOParameters): WipStatus {
  const ordered = nz(params.orderQuantity);
  const deliveredWasOmitted =
    params.deliveredQuantity === undefined || params.deliveredQuantity === null;
  const delivered = deliveredWasOmitted ? ordered : nz(params.deliveredQuantity);
  const ratio = ordered > 0 ? Math.min(1, Math.max(0, delivered / ordered)) : 0;
  const teco = ordered > 0 && delivered >= ordered;
  return { ordered, delivered, ratio, teco, deliveredWasOmitted };
}

export function roundShare(amount: number, ratio: number): number {
  return Math.round(nz(amount) * nz(ratio));
}
