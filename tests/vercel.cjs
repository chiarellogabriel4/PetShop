// Read-only integration check of the production entry, using DATABASE_URL.
const http = require('node:http');
const assert = require('node:assert/strict');
const handler = require('../api/index');

async function run() {
  const server = http.createServer((req, res) => {
    req.headers['x-forwarded-proto'] = 'https';
    return handler(req, res);
  });
  server.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const me = await fetch(base + '/api/auth/me');
    assert.equal(me.status, 200);
    assert.deepEqual(await me.json(), { user: null });
    for (const route of ['/', '/login.html', '/api.js', '/visual.css', '/assets/racao.svg']) {
      const result = await fetch(base + route);
      assert.equal(result.status, 200, route);
      assert.ok((await result.text()).length > 0, route);
    }
    const admin = await fetch(base + '/admin.html', { redirect: 'manual' });
    assert.equal(admin.status, 302);
    for (const route of ['/.env', '/server/db.js', '/.server.log', '/package.json']) {
      assert.equal((await fetch(base + route)).status, 404, route);
    }
    const setup = await fetch(base + '/api/setup', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base.replace('http:', 'https:') },
      body: JSON.stringify({ token: '0'.repeat(64) })
    });
    assert.equal(setup.status, 403);
    console.log('Production entry passed: JSON API, pages, assets, admin protection, private files, bootstrap disabled.');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}
run().then(() => process.exit(0)).catch(error => {
  console.error('Production entry check failed:', error.name, error.code || '', error.message);
  process.exit(1);
});
