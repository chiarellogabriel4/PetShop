const { randomBytes, scrypt: scryptCallback, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(scryptCallback);
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derived.toString('hex')}`;
}
async function verifyPassword(password, encoded) {
  const [, salt, hash] = encoded.split(':');
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
const digest = value => createHash('sha256').update(value).digest('hex');
module.exports = { hashPassword, verifyPassword, digest };
