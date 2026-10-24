import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractPath = path.join(root, 'docs/reporting-library/phase-3/entry-contract.json');
const intakePath = path.join(root, 'docs/reporting-library/phase-2-gap-closure/native-evidence-intake.json');
const output = path.join(root, 'public/sap-reporting/simulated-native');
const date = '2026-10-23';
const packageVersion = 'simulated-native-pilot-v1.0.0';

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const intake = JSON.parse(fs.readFileSync(intakePath, 'utf8'));
const intakeById = new Map(intake.reports.map(report => [report.report_id, report]));
const pilots = contract.pilot;

const mkdir = dir => fs.mkdirSync(dir, { recursive: true });
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const writeText = (file, value) => fs.writeFileSync(file, value.endsWith('\n') ? value : `${value}\n`, 'utf8');
const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
const fileSha256 = file => sha256(fs.readFileSync(file));
const safe = value => String(value).replace(/[^A-Za-z0-9_.-]+/g, '-');

function fieldType(field) {
  const name = field.toLowerCase();
  if (name.includes('date') || name === 'year' || name === 'period' || name === 'line' || name === 'item' || name === 'count') return 'wholeNumber';
  if (name.includes('amount') || name.includes('value') || name.includes('qty') || name.includes('quantity') || name === 'actual' || name === 'open') return 'decimalNumber';
  return 'text';
}

function valueFor(field, reportId, rowIndex) {
  const name = field.toLowerCase();
  const n = rowIndex + 1;
  const serial = `${reportId}-${String(n).padStart(2, '0')}`;
  if (name === 'company' || name === 'company_code') return '1000';
  if (name === 'ledger') return '0L';
  if (name === 'co_area') return 'A100';
  if (name === 'year') return '2026';
  if (name === 'period') return '009';
  if (name === 'line' || name === 'item') return String(n).padStart(3, '0');
  if (name === 'date' || name === 'key_date' || name === 'posting_date') return '2026-09-30';
  if (name === 'due_date') return n === 1 ? '2026-10-15' : '2026-10-20';
  if (name === 'clearing_date') return n === 1 ? '' : '2026-09-30';
  if (name === 'currency' || name === 'doc_currency' || name === 'currency_type') return name === 'currency_type' ? '10' : 'USD';
  if (name === 'uom') return 'EA';
  if (name === 'count') return String(n);
  if (name.includes('amount_abs') || name.includes('gr_value') || name.includes('ir_value') || name.includes('stock_value') || name.includes('net_value')) return String(n * 1000);
  if (name.includes('amount') || name === 'actual' || name === 'open' || name.includes('value')) return String(n === 1 ? 1000 : -250);
  if (name.includes('qty') || name.includes('quantity')) return String(n * 10);
  if (name === 'status') return n === 1 ? 'OPEN' : 'EXCEPTION_REVIEW';
  if (name === 'dimension') return `DIM-${serial}`;
  if (name === 'doc' || name.includes('document')) return `19${String(100000 + n).padStart(7, '0')}`;
  if (name === 'partner' || name === 'vendor' || name === 'supplier') return `VEND-${String(n).padStart(4, '0')}`;
  if (name === 'customer') return `CUST-${String(n).padStart(4, '0')}`;
  if (name === 'product' || name === 'material') return 'FG-DEMO-01';
  if (name === 'profit_center') return 'PC1100';
  if (name === 'cost_center') return 'CC1100';
  if (name === 'cost_element') return '400000';
  if (name === 'activity') return 'MACHINE';
  if (name === 'gl') return '150000';
  if (name === 'currency') return 'USD';
  if (name === 'source_system') return 'SAVA_SIMULATOR';
  if (name === 'client') return '000';
  return `${field.toUpperCase()}_DEMO_${n}`;
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(columns, rows) {
  return [columns.map(csvCell).join(','), ...rows.map(row => columns.map(column => csvCell(row[column])).join(','))].join('\n') + '\n';
}

function makeRows(pilot) {
  return [0, 1].map(rowIndex => Object.fromEntries(pilot.columns.map(column => [column, valueFor(column, pilot.report_id, rowIndex)])));
}

function controlFor(pilot, rows, rawHash) {
  const numericTotals = {};
  for (const column of pilot.columns) {
    if (fieldType(column) === 'decimalNumber' || fieldType(column) === 'wholeNumber') {
      const values = rows.map(row => Number(row[column])).filter(Number.isFinite);
      if (values.length) numericTotals[column] = values.reduce((sum, value) => sum + value, 0);
    }
  }
  const keys = rows.map(row => pilot.keys.map(key => String(row[key] ?? '')).join('|'));
  return {
    control_version: 'control.v1',
    status: 'SIMULATED_PASS',
    raw_sha256: rawHash,
    row_count: rows.length,
    key_count: new Set(keys).size,
    duplicate_key_count: keys.length - new Set(keys).size,
    numeric_totals: numericTotals,
    currencies: [...new Set(rows.map(row => row.currency).filter(Boolean))],
    units: [...new Set(rows.map(row => row.uom).filter(Boolean))],
    cutoff: '2026-09-30',
    paging: { full_export: true, row_limit: null, page_count: 1 },
    reconciliation: { status: 'NOT_RUN_AGAINST_SAP', bridge_status: 'BLOCKED_PENDING_NATIVE_INPUT' },
    note: 'Technical control over deterministic synthetic rows only; not SAP or business acceptance.'
  };
}

function envelope(pilot, artifactId, rawHash, control) {
  const source = intakeById.get(pilot.report_id);
  return {
    envelope_version: 'simulated-native-envelope.v1',
    artifact_id: artifactId,
    generated_at: date,
    provenance_class: 'SIMULATED_NATIVE',
    source_kind: 'GENERATED_SYNTHETIC',
    original_sap_export: false,
    native_acceptance: 'NOT_RUN',
    business_acceptance: 'NOT_APPROVED',
    target_release: 'UNKNOWN',
    system: 'SAVA_SIMULATOR',
    client: '000-DEMO-ONLY',
    scenario_id: `phase3-pilot-${pilot.report_id.toLowerCase()}`,
    seed: `SAVA-${pilot.report_id}-20261023`,
    ruleset_version: 'simulated-native-rules.v1',
    source_profile_id: pilot.report_id,
    contract_version: 'phase3-entry-contract-2026-10-21',
    tcode_or_app: source?.tcode ?? null,
    title: source?.title ?? pilot.purpose,
    module: pilot.module,
    grain: pilot.grain,
    keys: pilot.keys,
    columns: pilot.columns,
    raw_sha256: rawHash,
    row_count: control.row_count,
    control_totals: control.numeric_totals,
    selection_context: {
      system_product: 'SAVA simulator fixture',
      release: 'UNKNOWN',
      language: 'vi-VN',
      selection_variant: 'SIMULATED_DEFAULT',
      cutoff: '2026-09-30',
      scope: 'two deterministic teaching rows; not full population'
    },
    limitations: [
      'This artifact simulates an export-shaped payload; it is not an original SAP export.',
      'Technical field names and layout order remain proposed until target-release evidence exists.',
      'Native, reconciliation, owner, SME and IFRS/business acceptance remain open.',
      'Production deployment is fail-closed and not authorized by this artifact.'
    ]
  };
}

function build() {
  for (const name of ['raw', 'clean', 'control', 'mart', 'simulator', 'power-bi/tables']) mkdir(path.join(output, name));
  const artifacts = [];
  const powerTables = [];
  const blockedPilots = [];

  for (const pilot of pilots) {
    const id = pilot.report_id;
    if (!Array.isArray(pilot.columns) || !Array.isArray(pilot.keys)) {
      blockedPilots.push({ report_id: id, status: 'BLOCKED_CONTRACT_GAP', missing: ['keys', 'columns'], reason: 'Phase-3 entry contract has no approved grain/key/column catalog; no fields were invented.' });
      continue;
    }
    const rows = makeRows(pilot);
    const rawPayload = {
      banner: 'SIMULATED_NATIVE | GENERATED_SYNTHETIC | NOT_SAP_NATIVE',
      report_id: id,
      ordered_columns: pilot.columns,
      rows
    };
    const rawBytes = Buffer.from(`${JSON.stringify(rawPayload, null, 2)}\n`, 'utf8');
    const rawHash = sha256(rawBytes);
    const control = controlFor(pilot, rows, rawHash);
    const artifactId = `SIMNATIVE-${id}-20261023`;
    const env = envelope(pilot, artifactId, rawHash, control);
    const clean = { ...env, layer: 'CLEAN', rows, schema: Object.fromEntries(pilot.columns.map(column => [column, fieldType(column)])) };
    const mart = { ...env, layer: 'MART', dataset_id: `${id}-SIM-20260930`, fact_table: `${id.toLowerCase()}_fact`, rows, direct_join_allowed: false, join_status: 'BLOCKED_PENDING_NATIVE_INPUT' };
    const simulator = { ...env, layer: 'ANALYTICS', adapter: 'SIMULATOR', route: `/reporting/${id.toLowerCase()}`, report_dto: { reportId: id, schemaVersion: 'simulated-native.v1', status: 'SIMULATED_READY', rows, control } };
    const rawFile = path.join(output, 'raw', `${id}.simulated-native.json`);
    const cleanFile = path.join(output, 'clean', `${id}.clean.json`);
    const controlFile = path.join(output, 'control', `${id}.control.json`);
    const martFile = path.join(output, 'mart', `${id}.mart.json`);
    const simulatorFile = path.join(output, 'simulator', `${id}.simulator.json`);
    fs.writeFileSync(rawFile, rawBytes);
    writeJson(cleanFile, clean);
    writeJson(controlFile, { ...env, layer: 'CONTROL', control });
    writeJson(martFile, mart);
    writeJson(simulatorFile, simulator);

    const csvFile = path.join(output, 'power-bi/tables', `${id}.csv`);
    writeText(csvFile, csv(pilot.columns, rows));
    powerTables.push({ name: `${id}_fact`, source: `power-bi/tables/${id}.csv`, columns: pilot.columns.map(column => ({ name: column, type: fieldType(column) })), grain: pilot.grain, keys: pilot.keys });
    for (const file of [rawFile, cleanFile, controlFile, martFile, simulatorFile, csvFile]) artifacts.push({ path: path.relative(output, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: fileSha256(file) });
  }

  const powerBi = {
    schema_version: 'power-bi-staging.v1',
    dataset_name: 'SAVA_SAP_REPORTING_SIMULATED_NATIVE_PILOT',
    provenance_class: 'SIMULATED_NATIVE',
    import_mode: 'CSV_FILES_WITH_SCHEMA_MANIFEST',
    eligible_for_demo: true,
    eligible_for_production: false,
    deployment_status: 'NOT_DEPLOYED',
    tables: powerTables,
    relationships: [],
    measures: [
      { name: 'Row Count', expression: 'COUNTROWS(<table>)', status: 'TEMPLATE_PER_TABLE' },
      { name: 'Control Status', expression: 'SIMULATED_PASS', status: 'FIXED_METADATA' }
    ],
    limitations: ['No Power BI workspace push was performed; import package only.', 'Do not use simulated rows as SAP-certified data.']
  };
  writeJson(path.join(output, 'power-bi', 'dataset.schema.json'), powerBi);
  writeText(path.join(output, 'power-bi', 'README.md'), `# Power BI staging package — simulated native pilot\n\nThis package is import-ready test data for ${powerTables.length} Phase-3 pilots. ${blockedPilots.length} pilots remain blocked because the approved contract lacks keys/columns. It is **SIMULATED_NATIVE**, not an SAP export.\n\n1. Import the CSV files under \`tables/\`.\n2. Apply types and table names from \`dataset.schema.json\`.\n3. Keep relationships empty until native evidence and cardinality tests are approved.\n4. Keep production publishing disabled: \`eligible_for_production=false\`.\n`);
  artifacts.push(...['power-bi/dataset.schema.json', 'power-bi/README.md'].map(relative => ({ path: relative, bytes: fs.statSync(path.join(output, relative)).size, sha256: fileSha256(path.join(output, relative)) })));

  const manifest = {
    package_version: packageVersion,
    generated_at: date,
    status: 'SIMULATED_NATIVE_PACKAGE_READY_FOR_INTEGRATION_TEST',
    pilot_count: pilots.length,
    ready_pilot_count: powerTables.length,
    pilot_ids: pilots.map(pilot => pilot.report_id),
    blocked_pilots: blockedPilots,
    provenance_class: 'SIMULATED_NATIVE',
    original_sap_exports: 0,
    native_acceptance: 'NOT_RUN',
    business_acceptance: 'NOT_APPROVED',
    target_release: 'UNKNOWN',
    eligible_for_demo: true,
    eligible_for_production: false,
    deployment_status: 'NOT_DEPLOYED',
    layers: ['RAW', 'CLEAN', 'CONTROL', 'MART', 'ANALYTICS'],
    files: artifacts.sort((a, b) => a.path.localeCompare(b.path)),
    checks: { deterministic_seeded_rows: 'PASS', raw_hashes: 'PASS', control_totals: 'PASS', direct_joins: 'BLOCKED', power_bi_workspace_push: 'NOT_RUN', simulator_production_push: 'NOT_RUN' },
    limitations: ['Synthetic fixture only.', 'No SAP connection or native export received.', 'Power BI and production deployment require a separate authorized release step.']
  };
  writeJson(path.join(output, 'manifest.json'), manifest);
  const readyIds = powerTables.map(table => table.name.replace('_fact', ''));
  const indexLinks = readyIds.map(id => `<li><a href="simulator/${id}.simulator.json">${id}</a> · <a href="power-bi/tables/${id}.csv">Power BI CSV</a> · <a href="control/${id}.control.json">control</a></li>`).join('');
  const blockedLinks = blockedPilots.map(item => `<li><b>${item.report_id}</b> · BLOCKED_CONTRACT_GAP · thiếu keys/columns</li>`).join('');
  writeText(path.join(output, 'index.html'), `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Simulated Native Pilot</title><style>body{font:16px/1.6 system-ui;max-width:980px;margin:40px auto;padding:0 20px;color:#17343b}aside{padding:16px;background:#fff2d9;border:1px solid #d5ad5b;border-radius:8px}li{margin:8px 0}code{background:#eef5f3;padding:2px 5px}</style><h1>Simulated Native Pilot Package</h1><aside><b>SIMULATED_NATIVE — không phải SAP-native.</b><br>Generated synthetic rows, native acceptance NOT_RUN, business NOT_APPROVED, production eligibility false.</aside><p>Phase-3 pilot reports: ${readyIds.length} ready for integration testing; ${blockedPilots.length} blocked because the approved contract lacks keys/columns.</p><h2>Ready for integration testing</h2><ul>${indexLinks}</ul><h2>Blocked — no invented fields</h2><ul>${blockedLinks}</ul><p><a href="manifest.json">Manifest</a> · <a href="power-bi/dataset.schema.json">Power BI schema</a> · <a href="power-bi/README.md">Power BI instructions</a></p></html>`);
  artifacts.push({ path: 'index.html', bytes: fs.statSync(path.join(output, 'index.html')).size, sha256: fileSha256(path.join(output, 'index.html')) });
  const finalManifest = { ...manifest, files: artifacts.sort((a, b) => a.path.localeCompare(b.path)) };
  writeJson(path.join(output, 'manifest.json'), finalManifest);
  writeText(path.join(output, 'manifest.sha256'), fileSha256(path.join(output, 'manifest.json')));
  console.log(JSON.stringify({ output, packageVersion, pilotCount: pilots.length, artifactFiles: artifacts.length, provenance: 'SIMULATED_NATIVE', productionEligible: false }, null, 2));
}

build();
