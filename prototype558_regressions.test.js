const fs=require('fs'),assert=require('assert');
const css=fs.readFileSync('styles.css','utf8'),js=fs.readFileSync('app.js','utf8');
assert(css.includes('Prototipo 5.5.8'));
assert(css.includes('position:absolute!important'));
assert(css.includes('body.nav-minimized .liquid-tabbar{width:min(calc(100% - 28px),520px);height:70px}'));
assert(js.includes("document.body.classList.remove('nav-minimized')"));
assert(!js.includes("if(now>90&&down)document.body.classList.add('nav-minimized')"));
console.log('prototype558_regressions ok');
