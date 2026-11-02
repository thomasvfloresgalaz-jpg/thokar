const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('las tres vistas usan un ancla geométrica uniforme con rango de scroll garantizado', () => {
  const app = fs.readFileSync('./app.js','utf8');
  const css = fs.readFileSync('./styles.css','utf8');
  assert.match(app, /function ensureWorkspaceAnchorRoom\(\)/);
  assert.match(app, /function workspaceTabsTarget\(\)/);
  assert.match(app, /function stabilizeWorkspaceTabs\(ms\)/);
  assert.match(app, /function alignWorkspaceTabs\(animated\)/);
  assert.match(app, /sc\.scrollTop=target/);
  assert.match(app, /alignWorkspaceTabs\(false\)/);
  assert.match(css, /workspace-scroll,.workspace-main\{overflow-anchor:none!important\}/);
  assert.match(app, /main\.style\.setProperty\('min-height',[^;]+,'important'\)/);
  assert.match(app, /target-maxScroll\+12/);
});

test('cambiar Hablar Registro o Datos no modifica la navegación inferior', () => {
  const app = fs.readFileSync('./app.js','utf8');
  const start = app.indexOf('function mountWorkspaceView');
  const end = app.indexOf('function afterRender', start);
  const body = app.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.doesNotMatch(body, /mainNavState\s*=/);
  assert.doesNotMatch(body, /setMainNav\(/);
  assert.match(body, /workspaceView=view/);
});
