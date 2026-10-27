const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../catalog-core.js');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, '..', name), 'utf8'));
const data = { ...read('cards.json'), limited: read('limited.json'), market: read('market.json') };
const cards = core.prepare(data);
const card = slug => cards.find(c => c.slug === slug);

test('limited separates recommended cards from conditional warnings and missing assessments', () => {
  const results = core.select(cards, { view:'limited', sort:'limited' });
  assert.equal(results.length, 31);
  assert.equal(core.select(cards, { view:'all', grade:'unrated' }).length, 114);
  assert.equal(core.select(cards, { view:'all', grade:'caution' }).length, 5);
  assert.equal(core.select(cards, { view:'limited', grade:'S' }).length, 3);
  assert.equal(core.gradeLabel(card('towerfall').assessment), 'S warunkowe');
  assert.ok(!results.some(c => c.slug === 'panam-palmer-nomad-cavalry'));
  assert.ok(results.slice(0,3).every(c => c.assessment.grade === 'S'));
});
test('search finds full names, accents, classifications and rules using multiple terms', () => {
  assert.equal(core.select(cards, { query:'judy alvarez nothing' })[0].slug,'judy-a-lvarez-nothing-to-doubt');
  assert.equal(core.select(cards, { query:'steel dragon' })[0].slug,'yorinobu-arasaka-steel-dragon');
  assert.ok(core.select(cards, { query:'blocker', type:'Unit' }).length > 0);
  assert.equal(core.select(cards, { query:'<script>no-match</script>' }).length, 0);
});
test('combined filters handle null costs, legality and sale eligibility', () => {
  const filtered = core.select(cards, { color:'Blue', type:'Program', cost:'7+' });
  assert.ok(filtered.every(c => c.color === 'Blue' && c.card_type === 'Program' && c.cost >= 7));
  const expensive = core.select(cards, { cost:'7+' });
  assert.ok(expensive.length > 0 && expensive.every(c => c.cost != null && c.cost >= 7));
  assert.deepEqual(core.select(cards, { legal:'not-legal' }).map(c => c.slug), ['rebecca-having-a-moment']);
  assert.ok(core.select(cards, { eddiable:true }).every(c => c.is_eddiable));
  assert.ok(core.select(cards, { classification:'Arasaka' }).every(c => c.classifications.includes('Arasaka')));
});
test('market is separate from limited and wishlist; rarity describes the relevant edition', () => {
  assert.equal(core.select(cards, { view:'market' }).length, 8);
  assert.equal(core.select(cards, { view:'market', rarity:'Iconic Secret' }).length, 4);
  assert.equal(core.select(cards, { view:'all', rarity:'Iconic Secret' }).length, 0);
  assert.equal(core.select(cards, { view:'wanted' }).length, 0);
  const wanted = new Set([card('towerfall').id]);
  assert.deepEqual(core.select(cards, { view:'wanted' }, wanted).map(c => c.slug), ['towerfall']);
  assert.equal(core.select(cards, { view:'market' }, wanted).length, 8);
});
test('wishlist import round trips, deduplicates and reports unknown IDs', () => {
  const id = card('towerfall').id;
  assert.deepEqual(core.importWanted(core.exportWanted(new Set([id])), cards), { ids:[id], unknown:0 });
  const input = JSON.stringify({version:1,kind:'cyberpunk-tcg-wanted',cardIds:[id,id,'unknown']});
  assert.deepEqual(core.importWanted(input, cards), { ids:[id], unknown:1 });
});
test('malformed imports cannot silently replace a wishlist', () => {
  for (const input of ['no-json', '{}', 'null', '{"version":1,"kind":"cyberpunk-tcg-wanted","cardIds":[7]}', '{"version":2,"kind":"cyberpunk-tcg-wanted","cardIds":[]}']) assert.throws(() => core.importWanted(input,cards));
});
test('null stats are placed last, and sorting never mutates source order', () => {
  const before = cards.map(c => c.id);
  const cost = core.select(cards, {sort:'cost'});
  const power = core.select(cards, {sort:'power'});
  assert.equal(cost.at(-1).cost,null);
  assert.equal(power.at(-1).power,null);
  assert.deepEqual(cards.map(c => c.id),before);
});
