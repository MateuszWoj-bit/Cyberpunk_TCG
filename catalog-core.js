(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Catalog = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const categories = { bomb: 'Bomba', foundation: 'Fundament talii', legend: 'Polecana Legenda', curve: 'Wypełnienie krzywej', situational: 'Zależna od puli', caution: 'Uważaj na warunki' };
  const grades = ['S', 'A+', 'A', 'A−', 'B+'];
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase();
  const isRecommended = rating => !!rating && ['bomb', 'foundation', 'legend', 'curve'].includes(rating.category);
  const gradeLabel = rating => rating?.grade ? rating.grade + (rating.conditional ? ' warunkowe' : '') : categories[rating?.category] || 'Bez oceny';
  function prepare(data) {
    return data.cards.map(card => ({ ...card,
      assessment: data.limited.cards[card.slug] || null,
      market: data.market.cards[card.slug] || null,
      search: normalize([card.display_name, card.rules_text, card.color, card.card_type, ...(card.classifications || []), ...(card.keywords || [])].join(' '))
    }));
  }
  function select(cards, filters, wanted = new Set()) {
    const terms = normalize(filters.query).split(/\s+/).filter(Boolean);
    const result = cards.filter(card => {
      if (filters.view === 'limited' && !isRecommended(card.assessment)) return false;
      if (filters.view === 'wanted' && !wanted.has(card.id)) return false;
      if (filters.view === 'market' && !card.market) return false;
      if (terms.some(term => !card.search.includes(term))) return false;
      for (const [field, key] of [['color','color'], ['type','card_type']]) {
        if (filters[field] && filters[field] !== card[key]) return false;
      }
      if (filters.rarity) {
        // The main catalog represents a card identity, while Iconic/Nova variants
        // live on its printings. The collector view remains exact to its featured
        // printing; the main view intentionally finds any matching printing.
        if (filters.view === 'market') {
          if (filters.rarity !== card.market?.rarity) return false;
        } else {
          const rarities = new Set([card.rarity, ...(card.printings || []).map(printing => printing.rarity)]);
          if (!rarities.has(filters.rarity)) return false;
        }
      }
      if (filters.classification && !(card.classifications || []).includes(filters.classification)) return false;
      if (filters.cost && (card.cost == null || (filters.cost === '7+' ? card.cost < 7 : card.cost !== Number(filters.cost)))) return false;
      if (filters.legal && card.legalities?.standard !== filters.legal) return false;
      if (filters.eddiable && !card.is_eddiable) return false;
      if (filters.grade === 'unrated' && card.assessment) return false;
      if (filters.grade === 'recommended' && !isRecommended(card.assessment)) return false;
      if (filters.grade && !['unrated','recommended'].includes(filters.grade) && card.assessment?.grade !== filters.grade && card.assessment?.category !== filters.grade) return false;
      return true;
    });
    const nameOrder = (a,b) => a.display_name.localeCompare(b.display_name, 'pl');
    const gradeOrder = card => { const index = grades.indexOf(card.assessment?.grade); return index < 0 ? (isRecommended(card.assessment) ? 5 : 6) : index; };
    if (filters.sort === 'cost') result.sort((a,b) => (a.cost ?? Infinity) - (b.cost ?? Infinity) || nameOrder(a,b));
    else if (filters.sort === 'power') result.sort((a,b) => (b.power ?? -Infinity) - (a.power ?? -Infinity) || nameOrder(a,b));
    else if (filters.sort === 'limited') result.sort((a,b) => gradeOrder(a) - gradeOrder(b) || nameOrder(a,b));
    else result.sort(nameOrder);
    return result;
  }
  function importWanted(text, cards) {
    const value = JSON.parse(text);
    if (value?.version !== 1 || value?.kind !== 'cyberpunk-tcg-wanted' || !Array.isArray(value.cardIds) || value.cardIds.some(id => typeof id !== 'string')) throw new Error('Niepoprawny format listy. Wybierz eksport JSON z tego katalogu.');
    const known = new Set(cards.map(card => card.id));
    return { ids: [...new Set(value.cardIds.filter(id => known.has(id)))], unknown: new Set(value.cardIds.filter(id => !known.has(id))).size };
  }
  function exportWanted(ids) { return JSON.stringify({ version: 1, kind: 'cyberpunk-tcg-wanted', cardIds: [...ids] }, null, 2); }
  return { categories, grades, normalize, isRecommended, gradeLabel, prepare, select, importWanted, exportWanted };
});
