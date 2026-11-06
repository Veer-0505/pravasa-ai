const fs = require('fs');
const content = fs.readFileSync(__dirname + '/routes/chat.js', 'utf8');

// Extract generateCompanionReply
const places = require('./data/places.json');
eval(content.slice(content.indexOf('function cleanQuery'), content.indexOf('router.post')));

const testCases = ["hi'", "hi", "hello!", "hey there", "places in ballari", "tell me about hampi", "temple timings", "ಮೈಸೂರು"];

testCases.forEach(tc => {
  console.log('Query:', tc);
  console.log('Reply:', generateCompanionReply(tc, 'en'));
  console.log('--------------------------------------------------');
});

