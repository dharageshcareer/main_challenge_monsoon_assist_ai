import test from 'node:test';
import assert from 'node:assert';
import { initDatabase } from './database.js';
import db from './database.js';

// Pre-test setup
initDatabase();

test('SQLite Database Seeding Integration', async (t) => {
  await t.test('users table should contain 5 default Indian profiles', () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const userCount = stmt.get().count;
    // Database seeding creates exactly 5 default profiles
    assert.ok(userCount >= 5, 'Should contain at least the 5 default profiles');
  });

  await t.test('pre-seeded profile Tsering Dorjee has correct native Malayalam language', () => {
    const stmt = db.prepare("SELECT language FROM users WHERE name = 'Tsering Dorjee'");
    const row = stmt.get();
    assert.strictEqual(row.language, 'ml', 'Tsering language should be Malayalam (ml)');
  });

  await t.test('pre-seeded profile Srinivasan has correct location coordinates in Chennai', () => {
    const stmt = db.prepare("SELECT location, latitude, longitude FROM users WHERE name = 'K. Srinivasan'");
    const row = stmt.get();
    assert.strictEqual(row.location, 'Velachery, Chennai');
    assert.ok(Math.abs(row.latitude - 12.9803) < 0.001);
    assert.ok(Math.abs(row.longitude - 80.2227) < 0.001);
  });
});

test('Incident Reporting SQL Integration', async (t) => {
  await t.test('creating a new incident writes successfully to DB', () => {
    // Clear previous test incidents to maintain test purity
    db.exec("DELETE FROM incidents WHERE reported_by = 'E2E Integration Test Runner'");

    const stmt = db.prepare(`
      INSERT INTO incidents (category, latitude, longitude, reported_by)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      'Severe Waterlogging',
      19.0680,
      72.8800,
      'E2E Integration Test Runner'
    );

    assert.ok(result.lastInsertRowid > 0, 'Should insert successfully and return a row ID');

    const checkStmt = db.prepare('SELECT * FROM incidents WHERE id = ?');
    const incident = checkStmt.get(result.lastInsertRowid);
    assert.strictEqual(incident.category, 'Severe Waterlogging');
    assert.strictEqual(incident.reported_by, 'E2E Integration Test Runner');
  });
});
