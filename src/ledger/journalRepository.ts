/**
 * Copilot PR-2 — JournalRepository: một cổng duy nhất để đọc/ghi dòng sổ ACDOCA.
 *
 * v1 chỉ có adapter in-memory (giữ DEC-019: không lưu server). v2 (doanh nghiệp) thay adapter
 * này bằng adapter DB mà không đổi phía gọi. Schema dòng sổ KHÔNG đổi ở PR này — việc đổi schema
 * gộp một lần với P2 của FullStack (xem ERP-Sim_v2-quyet-dinh-kien-truc_2026-10-21).
 *
 * Bất biến: append không sửa mảng đầu vào; lines() trả bản sao chỉ-đọc theo đúng thứ tự ghi.
 */
import { AcdocaLine } from '../types';

export interface JournalRepository {
  append(lines: readonly AcdocaLine[]): void;
  lines(): readonly AcdocaLine[];
}

export class InMemoryJournalRepository implements JournalRepository {
  private readonly store: AcdocaLine[] = [];

  append(lines: readonly AcdocaLine[]): void {
    for (const l of lines) this.store.push(l);
  }

  lines(): readonly AcdocaLine[] {
    return Object.freeze([...this.store]);
  }
}

/** Dạng tối thiểu của stepStates mà App dùng để dựng bảng ACDOCA. */
export interface StepLedgerState {
  isExecuted: boolean;
  acdocaLines?: AcdocaLine[];
}

/**
 * Dựng bảng ACDOCA từ các bước đã chạy (1→7) + dòng phát sinh thêm (đóng kỳ, WIP…),
 * đi qua repository. Thứ tự dòng giữ y như vòng lặp cũ trong App.
 */
export function buildAcdocaTable(
  stepStates: Record<number, StepLedgerState | undefined>,
  extra: readonly AcdocaLine[],
  repo: JournalRepository = new InMemoryJournalRepository()
): AcdocaLine[] {
  for (let i = 1; i <= 7; i++) {
    const st = stepStates[i];
    if (st?.isExecuted) repo.append(st.acdocaLines || []);
  }
  repo.append(extra);
  return [...repo.lines()];
}
