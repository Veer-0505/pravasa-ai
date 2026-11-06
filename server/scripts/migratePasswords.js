const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersPath = path.join(__dirname, '..', 'data', 'users.json');

function isBcryptHash(str) {
  if (!str || typeof str !== 'string') return false;
  return /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
}

async function migrate() {
  if (!fs.existsSync(usersPath)) {
    console.error('users.json not found at', usersPath);
    return;
  }

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  console.log(`Checking ${users.length} users for plaintext passwords...`);

  let migratedCount = 0;
  for (const user of users) {
    if (!isBcryptHash(user.password)) {
      const plaintext = user.password || 'password123';
      const hash = await bcrypt.hash(plaintext, 12);
      user.password = hash;
      user.passwordMigratedAt = new Date().toISOString();
      migratedCount++;
      console.log(`  Migrated password for user: ${user.email} (${user.role})`);
    } else {
      console.log(`  User already has hashed password: ${user.email}`);
    }
  }

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8');
  console.log(`Successfully migrated ${migratedCount} passwords to bcryptjs hashes.`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

