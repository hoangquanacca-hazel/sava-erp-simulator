/** Isolated localhost QA fallback when the app Browser bootstrap is unavailable.
 * Uses a fresh headless browser/profile. No user browser sessions or SAP access.
 */
/* global process, console, Buffer, fetch, setTimeout, document, innerWidth, structuredClone */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import net from 'node:net';

const root = path.resolve(import.meta.dirname, '..');
const runId = process.argv.find(x => x.startsWith('--run-id='))?.split('=')[1] ?? 'final';
assert.match(runId, /^[a-z0-9-]+$/);
const candidate = process.argv.find(x => x.startsWith('--candidate='))?.split('=')[1] ?? 'v1-rc1';
assert.match(candidate, /^v1-rc[1-9][0-9]*$/);
const out = path.join(root, 'docs/implementation/evidence/manufacturing-finance', candidate, `browser-${runId}`);
assert.ok(!existsSync(path.join(out, 'results.json')), 'Use a new run-id to preserve earlier evidence');
await fs.mkdir(out, { recursive: true });
const modulePath = process.env.SAVA_QA_PLAYWRIGHT_MODULE ?? path.join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs');
const executablePath = process.env.SAVA_QA_BROWSER_EXE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const { chromium } = await import(pathToFileURL(modulePath).href);
const sha = b => createHash('sha256').update(b).digest('hex');
const reserve = net.createServer();
await new Promise((resolve, reject) => { reserve.once('error', reject); reserve.listen(0, '127.0.0.1', resolve); });
const port = reserve.address().port;
await new Promise(resolve => reserve.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['dist/server.mjs'], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port), GEMINI_API_KEY: '' } });
let serverLog = '', exited = false, browser;
child.stdout.on('data', b => { serverLog += b; }); child.stderr.on('data', b => { serverLog += b; }); child.once('exit', () => { exited = true; });
const result = { date: '2026-10-22', scope: 'SIMULATOR_V1_MANUFACTURING_FINANCE', method: 'ISOLATED_HEADLESS_LOCALHOST',
  appBrowserPlugin: 'BLOCKED_BOOTSTRAP_VERSION_PATH', headlessExecutable: executablePath, scenarios: [],
  sapNative: 'NOT_RUN', independentSme: 'PENDING', learningAcceptance: 'NOT_APPROVED' };

async function journey(theme, viewport) {
  const id = `${theme}-${viewport.width}`;
  const record = { id, theme, viewport, status: 'RUNNING', checks: [], downloads: [], pageErrors: [], externalRequestsBlocked: [] };
  result.scenarios.push(record);
  const context = await browser.newContext({ viewport, acceptDownloads: true, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' });
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(origin + '/') || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    record.externalRequestsBlocked.push(url); return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000); page.on('pageerror', e => record.pageErrors.push(e.message));
  const pass = name => { record.checks.push(name); console.log(`PASS ${id}: ${name}`); };
  const button = name => page.getByRole('button', { name, exact: true });
  const click = name => button(name).click();
  const status = () => page.locator('main > div > [aria-live="polite"]').innerText();
  const section = id => page.locator(`section[aria-labelledby="${id}"]`);
  const saved = async (name, suffix) => {
    const pending = page.waitForEvent('download'); await click(name); const download = await pending;
    const file = `${id}-${suffix}-${download.suggestedFilename()}`;
    await download.saveAs(path.join(out, file)); assert.equal(await download.failure(), null);
    const bytes = await fs.readFile(path.join(out, file));
    record.downloads.push({ file, bytes: bytes.length, sha256: sha(bytes) }); return bytes;
  };
  const layout = async label => {
    const measure = await page.evaluate(() => ({ viewport: innerWidth, pageWidth: document.documentElement.scrollWidth,
      mainWidth: document.querySelector('main').getBoundingClientRect().width }));
    if (measure.pageWidth > measure.viewport + 1) {
      record.overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 2 && !el.closest('.overflow-x-auto')).slice(0, 25).map(el => ({ tag: el.tagName, class: el.className, x: el.getBoundingClientRect().x, width: el.getBoundingClientRect().width, text: el.textContent.slice(0, 100) })));
    }
    assert.ok(measure.pageWidth <= measure.viewport + 1, `${label}: page overflow ${JSON.stringify(measure)}`);
  };
  try {
    await page.goto(`${origin}/#/manufacturing-finance`, { waitUntil: 'networkidle' });
    // Exercise the real first-visit modal; do not inject registration or storage.
    await page.getByTitle('Đóng', { exact: true }).click();
    await page.getByRole('heading', { name: 'Manufacturing Finance · 5 quy trình FICO', exact: true }).waitFor();
    if (theme === 'classic') { await click('SAP Classic GUI'); await page.getByTitle('Đóng menu SAP Easy Access', { exact: true }).click(); }
    await layout('initial');
    await page.screenshot({ path: path.join(out, `${id}-initial.png`) });
    pass('fresh route, first-visit guide, selected theme and responsive viewport');

    await button('Nhận cọc 36 triệu').focus(); await page.keyboard.press('Enter'); assert.match(await status(), /^BLOCKED:/);
    await click('Cấn cọc vào hóa đơn'); assert.match(await status(), /^BLOCKED:/);
    pass('keyboard activation and invalid deposit transitions blocked');
    await click('Tạo yêu cầu cọc'); await click('Nhận cọc 36 triệu'); await click('Lập hóa đơn 120 triệu');
    assert.equal(await button('Nhận cọc 36 triệu').isDisabled(), true);
    await click('Chạy đề xuất F150'); await click('Cấn cọc vào hóa đơn');
    await click('Phát hành thông báo mô phỏng'); assert.match(await status(), /BLOCKED:.*chạy lại/);
    await click('Chạy đề xuất F150'); await click('Phát hành thông báo mô phỏng');
    assert.match(await status(), /^SIMULATED:/); assert.equal(await button('Phát hành thông báo mô phỏng').isDisabled(), true);
    const invoice = section('mf-dunning').locator('tbody tr').filter({ hasText: '1000/2026/9100000001/001' });
    assert.match(await invoice.innerText(), /84[.,]000[.,]000/); assert.match(await invoice.innerText(), /1 \/ 2026-10-21/);
    pass('deposit 36m, invoice 120m, AR 84m, stale proposal blocked, notice history updated');

    await click('Chạy đối chiếu sao kê tự động');
    const bankRows = section('mf-bank').locator('tbody tr');
    assert.match(await bankRows.nth(0).innerText(), /CLEARED/); assert.match(await bankRows.nth(1).innerText(), /CLEARED/);
    assert.match(await bankRows.nth(2).innerText(), /UNMATCHED/); assert.match(await bankRows.nth(3).innerText(), /AMBIGUOUS/);
    assert.match(await bankRows.nth(1).innerText(), /9100000002.*9100000003/);
    await page.getByLabel('Hóa đơn xác nhận').selectOption('1000/2026/9100000002/001');
    await click('Xác nhận xử lý thủ công FEBAN'); assert.match(await status(), /^BLOCKED:/);
    await page.getByLabel('Hóa đơn xác nhận').selectOption('1000/2026/9100000004/001');
    await click('Xác nhận xử lý thủ công FEBAN'); assert.match(await bankRows.nth(2).innerText(), /MISSING-REF.*CLEARED/);
    pass('bank 1:1 and 1:N, unmatched/ambiguous retained, manual mismatch blocked then cleared');

    await click('Thử vượt ngân sách 90 triệu'); assert.match(await status(), /^BLOCKED:/);
    const amount = page.getByLabel('PO sửa khuôn mới (VND)'); await amount.fill('');
    await click('Giữ ngân sách PO'); assert.match(await status(), /^BLOCKED:/);
    await amount.fill('60000000'); await click('Giữ ngân sách PO'); assert.match(await status(), /WARNING/);
    await click('Ghi hóa đơn PO sửa khuôn');
    assert.match(await section('mf-budget').innerText(), /Actual: 80[.,]000[.,]000.*Commitment: 10[.,]000[.,]000/);
    pass('AVC excess/blank blocked, warning accepted, commitment relieved into actual');
    await click('Ghi thanh toán hộ và clearing AP'); assert.equal(await button('Ghi thanh toán hộ và clearing AP').isDisabled(), true);
    assert.match(await section('mf-ic').innerText(), /AP nhà cung cấp được chọn còn: 0.*Công nợ nội bộ: 60[.,]000[.,]000/);
    pass('supplier clearing retains 60m reciprocal IC balance and disables duplicate action');

    const bytes = await saved('Tải bằng chứng mô phỏng JSON', 'evidence'); const data = JSON.parse(bytes.toString('utf8'));
    assert.equal(data.state.deposit.applied, 36_000_000); assert.equal(data.state.bank[1].clearedInvoices.length, 2);
    assert.equal(data.state.budget.actual, 80_000_000); assert.equal(data.state.budget.commitment, 10_000_000);
    assert.equal(data.state.intercompany.supplierOpen, 0); assert.equal(data.acceptance.sapNative, 'NOT_RUN');
    assert.equal(data.acceptance.business, 'NOT_APPROVED'); assert.ok(data.controls.every(c => c.pass));
    assert.match(await section('mf-evidence').innerText(), new RegExp(sha(bytes)));
    for (const report of data.reports) {
      assert.equal(sha(Buffer.from(report.text)), report.sha256);
      await section('mf-evidence').locator('summary').filter({ hasText: report.title }).click();
      const worklist = await saved(`Tải worklist ${report.reportId}`, report.reportId);
      assert.equal(worklist.toString('utf8'), report.text); assert.equal(worklist.toString('utf8').split('\n')[2].split('\t').length, 18);
    }
    await layout('expanded reports');
    await section('mf-bank').screenshot({ path: path.join(out, `${id}-bank.png`) });
    await section('mf-budget').screenshot({ path: path.join(out, `${id}-budget.png`) });
    pass('real JSON and FI21/FI22 downloads saved; byte hashes, report content and 18 headers verified');

    const fileInput = page.getByLabel('File bằng chứng JSON');
    const fileStatus = section('mf-saved').getByRole('status');
    await page.getByLabel('SHA-256 đối chiếu (tùy chọn)').fill(sha(bytes));
    await fileInput.setInputFiles({ name: 'saved-evidence.json', mimeType: 'application/json', buffer: bytes });
    await fileStatus.filter({ hasText: 'VERIFIED_SIMULATION_ONLY' }).waitFor();
    assert.match(await section('mf-saved').innerText(), /Hash đối chiếu KHỚP/);
    await page.getByLabel('SHA-256 đối chiếu (tùy chọn)').fill('0'.repeat(64));
    await fileInput.setInputFiles({ name: 'saved-evidence.json', mimeType: 'application/json', buffer: bytes });
    await fileStatus.filter({ hasText: 'BLOCKED' }).waitFor();
    assert.match(await fileStatus.innerText(), /không khớp/);
    await page.getByLabel('SHA-256 đối chiếu (tùy chọn)').fill('');
    const forged = structuredClone(data); forged.acceptance.business = 'APPROVED';
    await fileInput.setInputFiles({ name: 'forged.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(forged, null, 2) + '\n') });
    await fileStatus.filter({ hasText: 'BLOCKED' }).waitFor();
    assert.match(await fileStatus.innerText(), /khác bản xuất gốc/);
    await layout('file verification');
    await section('mf-saved').screenshot({ path: path.join(out, `${id}-file-check.png`) });
    pass('saved-file replay, independent hash mismatch and forged approval rejected without importing state');

    await click('Chạy đề xuất F150'); assert.match(await section('mf-evidence').innerText(), /CŨ — xuất lại/);
    const beforeNav = await saved('Tải bằng chứng mô phỏng JSON', 'before-nav');
    await click('Variance 5-type'); await click('Manufacturing Finance · 5 FICO');
    await page.getByRole('heading', { name: 'Manufacturing Finance · 5 quy trình FICO', exact: true }).waitFor();
    const afterNav = await saved('Tải bằng chứng mô phỏng JSON', 'after-nav'); assert.equal(sha(beforeNav), sha(afterNav));
    pass('stale evidence warning and state preservation through route navigation');

    await amount.fill('123');
    await page.getByLabel('Dòng sao kê').selectOption({ label: '004 · AMBIG' });
    await page.getByLabel('Hóa đơn xác nhận').selectOption('1000/2026/9100000008/001');
    await click('Đặt lại riêng bài tài chính');
    assert.equal(await amount.inputValue(), '60000000', 'reset must also reset lesson form inputs');
    assert.equal(await page.getByLabel('Dòng sao kê').inputValue(), '1000/HB01/OPERATING/2026-10-21/003');
    assert.equal(await page.getByLabel('Hóa đơn xác nhận').inputValue(), '1000/2026/9100000004/001');
    const reset = JSON.parse((await saved('Tải bằng chứng mô phỏng JSON', 'reset')).toString('utf8'));
    assert.equal(reset.state.revision, 0); assert.equal(reset.state.history.length, 0); assert.equal(reset.state.documents.length, 9);
    await page.reload({ waitUntil: 'networkidle' });
    const reloaded = JSON.parse((await saved('Tải bằng chứng mô phỏng JSON', 'reload')).toString('utf8'));
    assert.equal(reloaded.state.revision, 0); assert.equal(reloaded.state.intercompany.paid, false);
    await fileInput.setInputFiles({ name: 'saved-evidence.json', mimeType: 'application/json', buffer: bytes });
    await fileStatus.filter({ hasText: 'VERIFIED_SIMULATION_ONLY' }).waitFor();
    assert.match(await section('mf-saved').innerText(), /Chưa có hash lưu riêng/);
    assert.match(await section('mf-budget').innerText(), /Actual: 20[.,]000[.,]000/);
    pass('lesson reset restores state and form selections; full reload starts a clean RAM-only lesson');
    assert.deepEqual(record.pageErrors, []); pass('no uncaught browser JavaScript errors'); record.status = 'PASS';
  } catch (e) {
    record.status = 'FAIL'; record.error = String(e.stack ?? e);
    await page.screenshot({ path: path.join(out, `${id}-failure.png`), fullPage: true }).catch(() => {});
    console.error(`FAIL ${id}: ${e.message}`);
  } finally { await context.close(); }
}

try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (exited) throw new Error('Owned production server exited');
    try { ready = (await fetch(`${origin}/api/health`)).ok; } catch { /* startup */ }
    if (ready) break; await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Local server readiness timeout');
  browser = await chromium.launch({ executablePath, headless: true }); result.browserVersion = browser.version();
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }])
    for (const theme of ['fiori', 'classic']) await journey(theme, viewport);
  result.status = result.scenarios.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL';
  if (result.status === 'PASS') {
    assert.equal(new Set(result.scenarios.map(s => s.downloads[0].sha256)).size, 1, 'Theme/viewport must not change accounting evidence');
    result.crossThemeViewportEvidence = 'BYTE_IDENTICAL';
    result.verifiedDownloads = result.scenarios.reduce((n, s) => n + s.downloads.length, 0);
  }
} catch (e) { result.status = 'BLOCKED'; result.error = String(e.stack ?? e); }
finally {
  await browser?.close(); if (!exited) { const done = new Promise(resolve => child.once('exit', resolve)); child.kill(); await done; }
  await fs.writeFile(path.join(out, 'server.log'), serverLog);
  await fs.writeFile(path.join(out, 'results.json'), JSON.stringify(result, null, 2) + '\n');
}
console.log(`${result.status} ${result.scenarios.filter(s => s.status === 'PASS').length}/${result.scenarios.length} journeys; results ${path.relative(root, out)}`);
process.exitCode = result.status === 'PASS' ? 0 : 1;
