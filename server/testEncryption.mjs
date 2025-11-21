import { encrypt, decrypt, encryptFields, decryptFields, hash, maskData } from './dist/lib/encryption.js';

console.log('🔐 Testing Encryption Module\n');

// Test 1: Basic encryption/decryption
console.log('Test 1: Basic Encryption/Decryption');
try {
  const testData = 'Sensitive user data 12345';
  console.log('Original:', testData);

  const encrypted = encrypt(testData);
  console.log('Encrypted:', encrypted.substring(0, 50) + '...');

  const decrypted = decrypt(encrypted);
  console.log('Decrypted:', decrypted);

  if (testData === decrypted) {
    console.log('✅ Basic encryption/decryption PASSED\n');
  } else {
    console.log('❌ Basic encryption/decryption FAILED\n');
  }
} catch (error) {
  console.error('❌ Error:', error.message, '\n');
}

// Test 2: Field encryption
console.log('Test 2: Field Encryption');
try {
  const user = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    ssn: '123-45-6789',
    creditCard: '4111-1111-1111-1111'
  };

  console.log('Original user:', user);

  const encryptedUser = encryptFields(user, ['ssn', 'creditCard']);
  console.log('Encrypted user:', {
    ...encryptedUser,
    ssn: encryptedUser.ssn.substring(0, 30) + '...',
    creditCard: encryptedUser.creditCard.substring(0, 30) + '...'
  });

  const decryptedUser = decryptFields(encryptedUser, ['ssn', 'creditCard']);
  console.log('Decrypted user:', decryptedUser);

  if (user.ssn === decryptedUser.ssn && user.creditCard === decryptedUser.creditCard) {
    console.log('✅ Field encryption/decryption PASSED\n');
  } else {
    console.log('❌ Field encryption/decryption FAILED\n');
  }
} catch (error) {
  console.error('❌ Error:', error.message, '\n');
}

// Test 3: Hashing
console.log('Test 3: Hashing');
try {
  const data = 'test@example.com';
  const hash1 = hash(data);
  const hash2 = hash(data);

  console.log('Data:', data);
  console.log('Hash 1:', hash1);
  console.log('Hash 2:', hash2);

  if (hash1 === hash2) {
    console.log('✅ Hashing consistency PASSED\n');
  } else {
    console.log('❌ Hashing consistency FAILED\n');
  }
} catch (error) {
  console.error('❌ Error:', error.message, '\n');
}

// Test 4: Data masking
console.log('Test 4: Data Masking');
try {
  const creditCard = '4111-1111-1111-1111';
  const masked = maskData(creditCard, 4);

  console.log('Original:', creditCard);
  console.log('Masked:', masked);

  if (masked.endsWith('1111') && masked.includes('*')) {
    console.log('✅ Data masking PASSED\n');
  } else {
    console.log('❌ Data masking FAILED\n');
  }
} catch (error) {
  console.error('❌ Error:', error.message, '\n');
}

console.log('🎉 Encryption tests complete!');
