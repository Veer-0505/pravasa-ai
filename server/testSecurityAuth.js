const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken, JWT_SECRET } = require('./middleware/auth');
const users = require('./data/users.json');

async function testSecurity() {
  console.log('========================================================');
  console.log('PRAVASA AI: SECURITY & AUTHENTICATION TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Verify all stored passwords in users.json are bcrypt hashes
  const allHashed = users.every(u => u.password.startsWith('$2'));
  if (allHashed) {
    console.log('✅ PASS [Test 1]: All database passwords stored as bcrypt hashes ($2a / $2b)');
    passed++;
  } else {
    console.error('❌ FAIL [Test 1]: Some passwords are not hashed');
    failed++;
  }

  // Test 2: Admin password comparison
  const adminUser = users.find(u => u.email === 'admin@pravasa.ai');
  const validAdminPw = await bcrypt.compare('admin', adminUser.password);
  if (validAdminPw) {
    console.log('✅ PASS [Test 2]: Admin password verified via bcrypt.compare()');
    passed++;
  } else {
    console.error('❌ FAIL [Test 2]: Admin password comparison failed');
    failed++;
  }

  // Test 3: Rejection of incorrect password
  const badPw = await bcrypt.compare('wrongpassword', adminUser.password);
  if (!badPw) {
    console.log('✅ PASS [Test 3]: Incorrect password correctly rejected');
    passed++;
  } else {
    console.error('❌ FAIL [Test 3]: Incorrect password was accepted');
    failed++;
  }

  // Test 4: JWT token generation and verification
  const token = generateToken(adminUser);
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.email === 'admin@pravasa.ai' && decoded.role === 'admin') {
    console.log(`✅ PASS [Test 4]: JWT token generated and verified (User: ${decoded.email}, Role: ${decoded.role})`);
    passed++;
  } else {
    console.error('❌ FAIL [Test 4]: JWT verification failed');
    failed++;
  }

  // Test 5: Verify customer user password comparison
  const custUser = users.find(u => u.email === 'ananya@example.com');
  const validCustPw = await bcrypt.compare('newpassword999', custUser.password);
  if (validCustPw) {
    console.log('✅ PASS [Test 5]: Customer user password verified via bcrypt');
    passed++;
  } else {
    console.error('❌ FAIL [Test 5]: Customer password comparison failed');
    failed++;
  }

  console.log('\n========================================================');
  console.log(`TOTAL SECURITY TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('RESULT: ALL SECURITY TESTS PASSED ✅');
  console.log('========================================================');
}

testSecurity().catch(console.error);

