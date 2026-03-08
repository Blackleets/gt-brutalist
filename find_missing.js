import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'src', 'lib', 'translations.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const keysByLocale = { en: new Set(), es: new Set(), zh: new Set() };
let currentLocale = '';

lines.forEach((line) => {
    const localeMatch = line.match(/^\s+(en|es|zh):\s*\{/);
    if (localeMatch) currentLocale = localeMatch[1];
    if (currentLocale) {
        const keyMatch = line.match(/^\s*([a-zA-Z0-9_]+):/);
        if (keyMatch && !['en', 'es', 'zh'].includes(keyMatch[1])) {
            keysByLocale[currentLocale].add(keyMatch[1]);
        }
    }
});

const allKeys = new Set([...keysByLocale.en, ...keysByLocale.es, ...keysByLocale.zh]);
const results = [];

['en', 'es', 'zh'].forEach(locale => {
    const missing = [...allKeys].filter(k => !keysByLocale[locale].has(k));
    if (missing.length > 0) results.push(`[${locale}] MISSING: ${missing.join(', ')}`);
});

fs.writeFileSync('missing_results.txt', results.join('\n'));
console.log('Results written to missing_results.txt');
