const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('las tres vistas usan el mismo ancla superior y desactivan scroll anchoring', () => {
  const app = fs.readFileSync('./app.js','utf8');
  const css = fs.readFileSync('./styles.css','utf8');
  assert.match(app, /function scrollWorkspaceToContent\(\)/);
  assert.match(app, /tabs\.offsetTop/);
  assert.match(app, /springNumber\(start,target/);
  assert.match(app, /mountWorkspaceView\(t\.dataset\.view,\{scroll:true\}\)/);
  assert.match(css, /workspace-scroll,.workspace-main\{overflow-anchor:none!important\}/);
});
