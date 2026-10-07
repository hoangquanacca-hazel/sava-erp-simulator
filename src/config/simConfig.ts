/**
 * S1 — Cấu hình SAP mô phỏng cố định (quyết định B, Mr Quân duyệt 07/10/2026)
 * và bảng ánh xạ tài khoản theo TT99 (quyết định C).
 *
 * Mọi báo cáo sinh ra từ simulator phải mang nhãn SIMULATED.
 * Chưa tuân thủ pháp lý được khẳng định: trạng thái `ppdf` bên dưới cho biết
 * tài khoản đã được đối chiếu với PDF Công báo hay chưa.
 */

export const SIM_CONFIG = {
  label: 'SIMULATED',
  companyCode: '1000',
  plant: '1100',
  controllingArea: '1000',
  fiscalYearVariant: 'K4', // năm tài chính = năm dương lịch
  costingVersion: '0',
  currency: 'VND',
  ledger: '0L',
  accountingStandard: 'TT99',
  /** Lệnh sản xuất kết chuyển chênh lệch vào 632 / CO-PA khi chạy VA88. */
  productionVarianceTarget: '632',
} as const;

export type PdfCheck = 'chua_doi_chieu' | 'da_doi_chieu';
export type AccountKind = 'tt99' | 'quan_tri_noi_bo' | 'mo_phong';

export interface AccountMapEntry {
  /** Mã tài khoản dùng trong ACDOCA mô phỏng. */
  code: string;
  role: string;
  kind: AccountKind;
  /** Đối chiếu với PDF Công báo TT99 (Mr Quân thực hiện). */
  pdf: PdfCheck;
}

export const ACCOUNT_MAP: readonly AccountMapEntry[] = [
  { code: '131', role: 'Phải thu khách hàng', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '152', role: 'Nguyên liệu, vật liệu', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '154', role: 'Chi phí SXKD dở dang (WIP)', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '155', role: 'Thành phẩm', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '214', role: 'Hao mòn TSCĐ', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '331', role: 'Phải trả người bán', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '334', role: 'Phải trả người lao động', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '3331', role: 'Thuế GTGT đầu ra', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '511', role: 'Doanh thu bán hàng', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '621', role: 'CP NVL trực tiếp', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '622', role: 'CP nhân công trực tiếp', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '627', role: 'CP sản xuất chung', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '632', role: 'Giá vốn hàng bán', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '911', role: 'Xác định kết quả kinh doanh', kind: 'tt99', pdf: 'chua_doi_chieu' },
  { code: '632110', role: 'COGS Vật liệu (chi tiết quản trị)', kind: 'quan_tri_noi_bo', pdf: 'chua_doi_chieu' },
  { code: '632120', role: 'COGS Nhân công (chi tiết quản trị)', kind: 'quan_tri_noi_bo', pdf: 'chua_doi_chieu' },
  { code: '632130', role: 'COGS Máy & KH (chi tiết quản trị)', kind: 'quan_tri_noi_bo', pdf: 'chua_doi_chieu' },
  { code: '632140', role: 'COGS SXC (chi tiết quản trị)', kind: 'quan_tri_noi_bo', pdf: 'chua_doi_chieu' },
  { code: '3388', role: 'GR/IR clearing (mô phỏng)', kind: 'mo_phong', pdf: 'chua_doi_chieu' },
  { code: '131IC', role: 'Phải thu liên công ty (mô phỏng)', kind: 'mo_phong', pdf: 'chua_doi_chieu' },
  { code: '331IC', role: 'Phải trả liên công ty (mô phỏng)', kind: 'mo_phong', pdf: 'chua_doi_chieu' },
  { code: '511IC', role: 'Doanh thu nội bộ (mô phỏng)', kind: 'mo_phong', pdf: 'chua_doi_chieu' },
  { code: '632IC', role: 'Giá vốn nội bộ (mô phỏng)', kind: 'mo_phong', pdf: 'chua_doi_chieu' },
];

export function accountEntry(code: string): AccountMapEntry | undefined {
  return ACCOUNT_MAP.find((a) => a.code === code);
}
