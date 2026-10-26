// Track the user's free ChatGPT accounts and how many image generations each has left.
// Data: assets/chatgpt-accounts.json (edit by hand or with these commands).
//
//   npm run -s quota                          table: every account, used in the last 24 h, left, blocked until
//   npm run -s quota -- add <name> [cap] [note]   new account (cap = images per 24 h, default 4)
//   npm run -s quota -- use <name> [n] [what]     log n generations (default 1), e.g. use acc2 1 "dawood grid 3"
//   npm run -s quota -- limit <name> <when>       ChatGPT said "limit reached": when = hours ("5"), clock time ("18:40") or ISO
//   npm run -s quota -- clear <name>               drop the block (limit lifted early)
//   npm run -s quota -- plan <images>              which accounts can cover the next <images> generations now
//   npm run -s quota -- log [name]                 last 20 generations
import fs from 'fs';

const FILE = 'assets/chatgpt-accounts.json';
const DAY = 24 * 3600e3;
const db = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {accounts: {}, log: []};
const save = () => fs.writeFileSync(FILE, JSON.stringify(db, null, 2) + '\n');
const now = Date.now();
const [cmd, ...a] = process.argv.slice(2);
const acc = (n) => db.accounts[n] ?? (console.error(`no account "${n}" (have: ${Object.keys(db.accounts).join(', ') || 'none'}) - add it first`), process.exit(1));
const used24 = (n) => db.log.filter((l) => l.acc === n && now - Date.parse(l.at) < DAY).reduce((s, l) => s + l.n, 0);
const blocked = (n) => { const b = db.accounts[n].blockedUntil; return b && Date.parse(b) > now ? b : null; };
const left = (n) => (blocked(n) ? 0 : Math.max(0, db.accounts[n].cap - used24(n)));
const t = (iso) => new Date(iso).toLocaleString('en-IN', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'});
// when the oldest generation inside the 24 h window falls out
const nextFree = (n) => { const l = db.log.filter((x) => x.acc === n && now - Date.parse(x.at) < DAY).sort((x, y) => x.at.localeCompare(y.at))[0]; return l ? new Date(Date.parse(l.at) + DAY).toISOString() : null; };

if (cmd === 'add') {
  const [name, cap, ...note] = a;
  if (!name) process.exit(console.error('add <name> [cap] [note]') ?? 1);
  db.accounts[name] = {cap: +(cap ?? 4), note: note.join(' '), blockedUntil: null, ...(db.accounts[name] ?? {}), ...(cap ? {cap: +cap} : {})};
  save();
} else if (cmd === 'use') {
  const [name, n = '1', ...what] = a;
  acc(name);
  db.log.push({at: new Date().toISOString(), acc: name, n: +n, what: what.join(' ')});
  save();
  console.log(`${name}: ${left(name)} left in this 24 h window`);
} else if (cmd === 'limit') {
  const [name, when] = a;
  acc(name);
  let until;
  if (/^\d+(\.\d+)?$/.test(when)) until = new Date(now + +when * 3600e3);
  else if (/^\d{1,2}:\d{2}$/.test(when)) { const [h, m] = when.split(':').map(Number); until = new Date(); until.setHours(h, m, 0, 0); if (+until < now) until = new Date(+until + DAY); }
  else until = new Date(when);
  db.accounts[name].blockedUntil = until.toISOString();
  save();
  console.log(`${name} blocked until ${t(until)}`);
} else if (cmd === 'clear') {
  acc(a[0]).blockedUntil = null;
  save();
} else if (cmd === 'log') {
  db.log.filter((l) => !a[0] || l.acc === a[0]).slice(-20).forEach((l) => console.log(`${t(l.at)}  ${l.acc.padEnd(10)} ${l.n}  ${l.what}`));
  process.exit(0);
} else if (cmd === 'plan') {
  let need = +(a[0] ?? 1);
  const order = Object.keys(db.accounts).filter((n) => left(n) > 0).sort((x, y) => left(y) - left(x));
  for (const n of order) { if (need <= 0) break; const k = Math.min(need, left(n)); console.log(`${n}: ${k}`); need -= k; }
  if (need > 0) {
    console.log(`short by ${need} now. Next free slots:`);
    Object.keys(db.accounts).forEach((n) => console.log(`  ${n}: ${blocked(n) ? 'blocked until ' + t(blocked(n)) : nextFree(n) ? '+1 at ' + t(nextFree(n)) : '-'}`));
  }
  process.exit(0);
} else if (cmd) {
  console.error('commands: add | use | limit | clear | plan | log (see top of scripts/quota.mjs)');
  process.exit(1);
}

const names = Object.keys(db.accounts);
if (!names.length) { console.log('no accounts yet: npm run -s quota -- add <name> [cap] [note]'); process.exit(0); }
console.log('account     cap  used24h  left  status');
let total = 0;
for (const n of names) {
  const L = left(n); total += L;
  const st = blocked(n) ? `blocked until ${t(blocked(n))}` : L === 0 && nextFree(n) ? `full, +1 at ${t(nextFree(n))}` : 'ready';
  console.log(`${n.padEnd(11)} ${String(db.accounts[n].cap).padStart(3)}  ${String(used24(n)).padStart(7)}  ${String(L).padStart(4)}  ${st}${db.accounts[n].note ? '  (' + db.accounts[n].note + ')' : ''}`);
}
console.log(`total left now: ${total} images (${total * 4} shots as 2x2 sheets)`);
