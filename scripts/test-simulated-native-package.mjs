import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public/sap-reporting/simulated-native');
const readJson = file => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
const sha256 = file => createHash('sha256').update(fs.readFileSync(path.join(dir, file))).digest('hex');
const manifest = readJson('manifest.json');

assert.equal(manifest.provenance_class, 'SIMULATED_NATIVE');
assert.equal(manifest.original_sap_exports, 0);
assert.equal(manifest.native_acceptance, 'NOT_RUN');
assert.equal(manifest.business_acceptance, 'NOT_APPROVED');
assert.equal(manifest.eligible_for_production, false);
assert.equal(manifest.deployment_status, 'NOT_DEPLOYED');
assert.equal(manifest.pilot_count, 12);
assert.equal(manifest.ready_pilot_count, 8);
assert.deepEqual(manifest.blocked_pilots.map(item => item.report_id).sort(), ['PM01', 'PP01', 'QM01', 'SD01']);
assert.equal(fs.readFileSync(path.join(dir, 'manifest.sha256'), 'utf8').trim(), sha256('manifest.json'));

for (const entry of manifest.files) {
  assert.equal(fs.existsSync(path.join(dir, entry.path)), true, `missing ${entry.path}`);
  assert.equal(fs.statSync(path.join(dir, entry.path)).size, entry.bytes, `bytes ${entry.path}`);
  assert.equal(sha256(entry.path), entry.sha256, `hash ${entry.path}`);
}

const schema = readJson('power-bi/dataset.schema.json');
assert.equal(schema.tables.length, manifest.ready_pilot_count);
assert.equal(schema.eligible_for_production, false);
assert.deepEqual(schema.relationships, []);
for (const table of schema.tables) {
  const csvFile = path.join(dir, table.source);
  const [header] = fs.readFileSync(csvFile, 'utf8').trimEnd().split('\n');
  assert.deepEqual(header.split(','), table.columns.map(column => column.name), `header ${table.name}`);
  const mart = readJson(`mart/${table.name.replace('_fact', '')}.mart.json`);
  assert.equal(mart.direct_join_allowed, false, `join ${table.name}`);
  assert.equal(mart.join_status, 'BLOCKED_PENDING_NATIVE_INPUT', `join status ${table.name}`);
}

for (const entry of manifest.files.filter(file => file.path.startsWith('simulator/') || file.path.startsWith('clean/') || file.path.startsWith('control/') || file.path.startsWith('mart/'))) {
  const value = readJson(entry.path);
  assert.equal(value.provenance_class, 'SIMULATED_NATIVE', entry.path);
  assert.equal(value.original_sap_export, false, entry.path);
  assert.equal(value.native_acceptance, 'NOT_RUN', entry.path);
  assert.equal(value.business_acceptance, 'NOT_APPROVED', entry.path);
}

console.log(`PASS simulated-native package: ${manifest.ready_pilot_count}/${manifest.pilot_count} ready, ${manifest.blocked_pilots.length} blocked contract gaps, ${manifest.files.length} hashed files`);
