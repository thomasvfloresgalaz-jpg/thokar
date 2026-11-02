const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),server=fs.readFileSync('server.js','utf8');
test('clipboard refuses silent cross-plate replacement and motor parser is normalized',()=>{assert.match(app,/Los datos no coinciden/);assert.match(app,/pastedPlate!==currentPlate/);assert.match(app,/número motor/);});
test('plate field forces uppercase',()=>{assert.match(app,/autocapitalize="characters"/);assert.match(app,/toUpperCase\(\)/);assert.match(css,/text-transform:uppercase/);});
test('record has currency percent affixes and workflow tabs',()=>{assert.match(app,/discountAffix/);assert.match(app,/data-r-tab="diagnosis"/);assert.match(app,/data-r-tab="tasks"/);assert.match(css,/affix-input/);});
test('bitacora is animated and status-coded',()=>{assert.match(css,/logPageIn/);assert.match(css,/log-done/);assert.match(css,/log-open/);assert.match(app,/✓/);});
test('vehicle and log deletion via swipe exists',()=>{assert.match(app,/bindSwipe/);assert.match(app,/delete-vehicle/);assert.match(app,/delete-log/);assert.match(css,/swipe-delete/);});
test('sheet close and chat message transitions are visible',()=>{assert.match(css,/translateY\(104%\)/);assert.match(css,/bubbleIn4/);assert.match(app,/closing/);});
test('Gemini fallback is a current explicit model and timeout chain fits frontend',()=>{assert.match(server,/gemini-3\.6-flash/);assert.match(server,/27_000/);assert.match(app,/65000/);assert.match(server,/thinkingLevel: 'low'/);});
