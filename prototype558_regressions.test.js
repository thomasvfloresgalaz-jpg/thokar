const test=require('node:test'); const assert=require('node:assert/strict'); const fs=require('node:fs');
const css=fs.readFileSync('styles.css','utf8'), js=fs.readFileSync('app.js','utf8'), sw=fs.readFileSync('sw.js','utf8');
test('5.5.8 keeps chat composer inside talk window',()=>{assert.match(css,/view-talk \.composer-wrap\{position:absolute!important/);assert.doesNotMatch(css.slice(css.lastIndexOf('Prototipo 5.5.8')),/composer-wrap\{position:fixed/)});
test('5.5.8 forces talk height to measured gap above bottom nav',()=>{assert.match(js,/setProperty\('height',available\+'px','important'\)/);assert.match(js,/freshNav\.getBoundingClientRect\(\)\.top-8/)});
test('5.5.8 disables horizontal gesture and keeps vertical chat scroll',()=>{assert.match(css,/touch-action:pan-y/);assert.match(css,/talk-thread\{height:auto;min-height:0;overflow-y:auto!important;overflow-x:hidden!important/)});
test('5.5.8 cache is unique',()=>assert.match(sw,/thokar-prototipo-5\.5\.8-chat-contained-layout/));
