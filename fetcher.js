const fs = require('fs');
async function run() {
    const meta = await fetch('https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg').then(r => r.text());
    const phantom = await fetch('https://raw.githubusercontent.com/phantom/brand-assets/main/logo/svg/phantom-logo-icon.svg').then(r => r.text());
    console.log(JSON.stringify({ phantom: phantom.length, meta: meta.length }));
    fs.writeFileSync('phantom.svg', phantom);
    fs.writeFileSync('meta.svg', meta);
}
run();
