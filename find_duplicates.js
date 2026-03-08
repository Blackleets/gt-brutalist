import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'lib', 'translations.ts');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');

const keysByLocale = {
    en: {},
    es: {},
    zh: {}
};

let currentLocale = '';

lines.forEach((line, index) => {
    const localeMatch = line.match(/^\s+(en|es|zh):\s*\{/);
    if (localeMatch) {
        currentLocale = localeMatch[1];
    }

    if (currentLocale) {
        const keyMatch = line.match(/^\s*([a-zA-Z0-9_]+):/);
        if (keyMatch) {
            const key = keyMatch[1];
            if (['en', 'es', 'zh'].includes(key)) return;

            if (keysByLocale[currentLocale][key]) {
                console.log(`DUPLICATE: [${currentLocale}] "${key}" at L${index + 1} (Prev: L${keysByLocale[currentLocale][key]})`);
            } else {
                keysByLocale[currentLocale][key] = index + 1;
            }
        }
    }
});
