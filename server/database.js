import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root database path: monsoonmind.db in the server directory
const dbPath = path.resolve(__dirname, 'monsoonmind.db');
const db = new DatabaseSync(dbPath);

console.log(`[Database] Database initialized at: ${dbPath}`);

export function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      language TEXT NOT NULL,
      household_json TEXT NOT NULL,
      infrastructure_json TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      reported_by TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if users table is empty to seed profiles
  const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users');
  const userCount = checkUsers.get().count;

  if (userCount === 0) {
    console.log('[Database] Seeding initial profiles...');
    const insertUser = db.prepare(`
      INSERT INTO users (name, location, latitude, longitude, language, household_json, infrastructure_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Profile 1: Rajesh Kulkarni
    insertUser.run(
      'Rajesh Kulkarni',
      'Kurla, Mumbai',
      19.0680,
      72.8800,
      'mr',
      JSON.stringify({ adults: 2, children: 1, elderly: 0, mobility_needs: 0, pets: 0, details: '2 Adults, 1 Infant' }),
      JSON.stringify({ type: 'Ground floor chawl', vehicle: 'Motorbike', power_backup: false, water_source: 'Municipal Supply' })
    );

    // Profile 2: Tsering Dorjee
    insertUser.run(
      'Tsering Dorjee',
      'Munnar, Kerala',
      10.0889,
      77.0595,
      'ml',
      JSON.stringify({ adults: 2, children: 0, elderly: 2, mobility_needs: 2, pets: 0, details: '2 Adults, 2 Elderly (limited mobility)' }),
      JSON.stringify({ type: 'Mountain slope structure', commute: 'Public Bus', power_backup: false, water_source: 'Municipal Supply' })
    );

    // Profile 3: Ananya Chatterjee
    insertUser.run(
      'Ananya Chatterjee',
      'New Town, Kolkata',
      22.5806,
      88.4731,
      'bn',
      JSON.stringify({ adults: 3, children: 0, elderly: 0, mobility_needs: 0, pets: 1, details: '3 Adults, 1 Dog' }),
      JSON.stringify({ type: '14th Floor High-Rise Apartment', commute: 'Metro', power_backup: true, water_source: 'Both Sources' })
    );

    // Profile 4: K. Srinivasan
    insertUser.run(
      'K. Srinivasan',
      'Velachery, Chennai',
      12.9803,
      80.2227,
      'ta',
      JSON.stringify({ adults: 1, children: 0, elderly: 0, mobility_needs: 0, pets: 0, details: '1 Adult' }),
      JSON.stringify({ type: 'Low-lying ground floor unit', commute: 'Remote Worker', power_backup: false, water_source: 'Municipal Supply' })
    );

    // Profile 5: Preeti Sharma
    insertUser.run(
      'Preeti Sharma',
      'Sector 48, Gurugram',
      28.4142,
      77.0425,
      'hi',
      JSON.stringify({ adults: 4, children: 2, elderly: 0, mobility_needs: 0, pets: 0, details: '4 Adults, 2 Children' }),
      JSON.stringify({ type: 'Villa with a private basement', vehicle: 'SUV', power_backup: true, water_source: 'Both Sources' })
    );

    console.log('[Database] Seeding completed.');
  }
}

export default db;
