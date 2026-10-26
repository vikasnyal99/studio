// Prints a ready-to-paste ChatGPT prompt with STYLE LOCK + CHARACTER DNA filled in.
// Usage: npm run prompt -- <file> <promptId>     e.g. npm run prompt -- nakul K1
//        npm run prompt -- <file>                lists the prompts in that file
import fs from 'fs';
import path from 'path';

const [name, id] = process.argv.slice(2);
const find = (n) =>
  ['characters', 'scenes'].map((d) => path.join('prompts', d, `${n}.md`)).find((p) => fs.existsSync(p));

// First ``` block after a heading that starts with `heading`
const blockAfter = (md, heading) => {
  const i = md.split('\n').findIndex((l) => l.startsWith('## ') && l.slice(3).startsWith(heading));
  if (i < 0) return null;
  const rest = md.split('\n').slice(i + 1).join('\n');
  const m = rest.match(/```\n([\s\S]*?)```/);
  return m ? m[1].trim() : null;
};

const file = name && find(name);
if (!file) {
  console.error('Usage: npm run prompt -- <name> <id>   (names: files in prompts/characters, prompts/scenes)');
  process.exit(1);
}
const md = fs.readFileSync(file, 'utf8');
if (!id) {
  console.log(md.split('\n').filter((l) => l.startsWith('## Prompt')).join('\n'));
  process.exit(0);
}

const style = fs.readFileSync('prompts/style-lock.md', 'utf8');
const firstBlock = style.match(/```\n([\s\S]*?)```/)[1].trim();
const parts = {
  '[STYLE LOCK]': firstBlock,
  '[OUTPUT]': blockAfter(style, 'Add to CHARACTER'),
  '[LAYOUT]': blockAfter(style, 'Add to MULTI-POSE'),
  '[BACKGROUND PLATE]': blockAfter(style, 'Add to BACKGROUND'),
  '[CHARACTER DNA]': blockAfter(md, 'CHARACTER DNA') ?? '',
};

const promptHead = md.split('\n').find((l) => l.startsWith(`## Prompt ${id} `));
let body = blockAfter(md, `Prompt ${id} `);
if (!body) {
  console.error(`No "## Prompt ${id}" in ${file}`);
  process.exit(1);
}
// The placeholder line expands into separate paragraphs
body = body.replace(/^((?:\[[A-Z ]+\]\s*)+)$/m, (line) =>
  line
    .match(/\[[A-Z ]+\]/g)
    .map((k) => parts[k])
    .filter(Boolean)
    .join('\n\n') + '\n',
);

const attach = md.split(promptHead)[1].split('\n').find((l) => l.startsWith('Attach:'));
fs.mkdirSync('prompts/out', {recursive: true});
const out = `prompts/out/${name}_${id}.txt`;
fs.writeFileSync(out, body + '\n');
console.log(`${promptHead.slice(3)}\n${attach ?? 'Attach: assets/refs/neeraj_sheet.png (style)'}\n${'-'.repeat(60)}\n${body}\n${'-'.repeat(60)}\nSaved: ${out}`);
