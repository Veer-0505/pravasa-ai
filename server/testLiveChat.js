const http = require('http');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  const r1 = await postJson('http://localhost:5000/api/chat', { message: "hi'", isCompanionChat: true });
  console.log('hi status:', r1.status);
  console.log('hi reply:', r1.data.reply);

  const r2 = await postJson('http://localhost:5000/api/chat', { message: 'places in ballari', isCompanionChat: true });
  console.log('ballari status:', r2.status);
  console.log('ballari reply:\n' + r2.data.reply);

  const r3 = await postJson('http://localhost:5000/api/chat', { message: 'hampi timings', isCompanionChat: true });
  console.log('hampi status:', r3.status);
  console.log('hampi reply:\n' + r3.data.reply);
})();

