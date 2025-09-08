// Encrypts a secret for GitHub Actions using a repo's public key
// Usage: node scripts/gh-encrypt.js <base64-public-key> <secret>
const sodium = require('tweetsodium');

const [, , key, secret] = process.argv;
if (!key || !secret) {
    console.error('Usage: node scripts/gh-encrypt.js <base64-public-key> <secret>');
    process.exit(1);
}
const publicKey = Buffer.from(key, 'base64');
const encrypted = sodium.seal(Buffer.from(secret), publicKey);
console.log(Buffer.from(encrypted).toString('base64'));
