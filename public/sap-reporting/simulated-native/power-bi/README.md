# Power BI staging package — simulated native pilot

This package is import-ready test data for 8 Phase-3 pilots. 4 pilots remain blocked because the approved contract lacks keys/columns. It is **SIMULATED_NATIVE**, not an SAP export.

1. Import the CSV files under `tables/`.
2. Apply types and table names from `dataset.schema.json`.
3. Keep relationships empty until native evidence and cardinality tests are approved.
4. Keep production publishing disabled: `eligible_for_production=false`.
