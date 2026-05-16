/**
 * Global setup — runs once before all tests.
 * Registers the demo auditor and worker accounts so they exist in the DB.
 *
 * If an account already exists, it verifies the configured password still
 * works. If the password doesn't match, it exits early with clear instructions
 * rather than letting tests fail with a confusing "URL mismatch" error.
 */
async function globalSetup() {
  const BASE = 'http://localhost:8000/api/v1';

  const accounts = [
    { name: 'Demo Auditor', email: 'auditor1@example.com', password: 'mallikarjun' },
    { name: 'Demo Worker',  email: 'worker1@example.com',  password: 'mallikarjun' },
  ];

  for (const account of accounts) {
    try {
      // 1 — Try to register
      const regRes = await fetch(`${BASE}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(account),
      });

      if (regRes.ok) {
        console.log(`[setup] ✓ Registered ${account.email}`);
        continue;
      }

      if (regRes.status !== 400) {
        console.warn(`[setup] Unexpected ${regRes.status} registering ${account.email}`);
      }

      // 2 — Account already exists — verify the configured password works
      console.log(`[setup] ${account.email} already exists — verifying login…`);
      const loginRes = await fetch(`${BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: account.email, password: account.password }),
      });

      if (loginRes.ok) {
        console.log(`[setup] ✓ ${account.email} login verified`);
      } else {
        console.error('\n[setup] ──────────────────────────────────────────────');
        console.error(`[setup] ❌  SETUP FAILED — password mismatch`);
        console.error(`[setup]    Account : ${account.email}`);
        console.error(`[setup]    Expected password: "${account.password}"`);
        console.error('[setup]');
        console.error('[setup] This account exists in the database but was registered');
        console.error('[setup] with a different password (e.g. during manual testing).');
        console.error('[setup]');
        console.error('[setup] Fix — choose one:');
        console.error('[setup]   A) Delete the account from MongoDB Atlas and re-run tests');
        console.error('[setup]      (Atlas → Browse Collections → civictrack.users → delete the doc)');
        console.error('[setup]   B) Update the password field for this account in global-setup.js');
        console.error('[setup]      and in the AUDITOR / WORKER constants in lifecycle.spec.js');
        console.error('[setup] ──────────────────────────────────────────────\n');
        process.exit(1);
      }
    } catch (err) {
      console.error(`[setup] Could not reach backend: ${err.message}`);
      console.error('[setup] Make sure the backend is running on http://localhost:8000 before running tests.');
      process.exit(1);
    }
  }
}

module.exports = globalSetup;
