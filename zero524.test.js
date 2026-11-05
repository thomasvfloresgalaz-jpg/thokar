const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('styles.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const server=fs.readFileSync('server.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
test('dock and archived peek share visible/system safe-area clearance',()=>{
 assert.match(css,/--zero-navigation-clearance:max\(env\(safe-area-inset-bottom,0px\),var\(--zero-visible-gap\)\)/);
 assert.match(css,/\.dock\{bottom:calc\(10px \+ var\(--zero-navigation-clearance\)\)!important\}/);
 assert.match(css,/\.archive-peek\{bottom:calc\(102px \+ var\(--zero-navigation-clearance\)\)!important\}/);
 assert.match(css,/\.content\{padding-bottom:calc\(118px \+ var\(--zero-navigation-clearance\)\)!important\}/);
});
test('Android PWA fallback is only active in standalone/fullscreen display mode',()=>{
 assert.match(html,/\/Android\/i\.test\(navigator\.userAgent\)/);
 assert.match(html,/display-mode: standalone\), \(display-mode: fullscreen/);
 assert.match(html,/classList\.add\("zero-android-pwa"\)/);
 assert.doesNotMatch(css,/--zero-android-standalone-gap:48px/);
});
test('visual viewport observer avoids keyboard overlap and restores dock',()=>{
 assert.match(app,/function syncAndroidVisibleBottom\(/);
 assert.match(app,/window\.visualViewport\.addEventListener\('resize'/);
 assert.match(app,/window\.visualViewport\.addEventListener\('scroll'/);
 assert.match(app,/window\.innerHeight-vv\.height-vv\.offsetTop/);
 assert.match(app,/document\.body\.classList\.toggle\('zero-keyboard-open',keyboard\)/);
 assert.match(css,/body\.zero-keyboard-open \.dock/);
});
test('new build cache and assets retained',()=>{
 assert.match(html,/THOKAR ZERO 5\.3\.1/);
 assert.match(html,/styles\.css\?v=zero531/);
 assert.match(html,/app\.js\?v=zero531/);
 assert.match(sw,/thokar-zero-5-3-1-20261104/);
 assert.match(server,/build: 'zero-5\.3\.1'/);
 assert.equal(pkg.version,'5.3.1');
 for (const asset of ['icon-192.png','icon-512.png','favicon-48.png','thokar-logo.png'])assert.ok(fs.statSync(asset).size>100);
});
