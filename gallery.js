/* Local catalog: no network requests are needed for browsing or saving a wishlist. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const data = window.CATALOG_DATA;
  const core = window.Catalog;
  if (!data || !core) {
    $('result-count').textContent = 'Nie udało się wczytać katalogu. Rozpakuj wszystkie pliki obok gallery.html.';
    return;
  }
  const cards = core.prepare(data);
  const byId = new Map(cards.map(card => [card.id, card]));
  const bySlug = new Map(cards.map(card => [card.slug, card]));
  const storageKey = 'cyberpunk-tcg-wanted-v1';
  const controls = ['query','color','type','cost','grade','rarity','classification','legal','sort','eddiable'];
  const views = {
    all: ['EKSPLORUJ BAZĘ', 'Wszystkie karty', 'Pełne nazwy, zdolności i wydania w jednym miejscu. Otwórz szczegóły karty lub oznacz ją gwiazdką, aby dodać do swoich poszukiwanych.'],
    limited: ['OCENY STRATEGICZNE / SEALED', 'Mocne wybory do limited', 'Polecane karty z dostarczonej analizy sealed, z ocenami i uzasadnieniami. Brak oceny nie oznacza słabej karty.'],
    market: ['KOLEKCJA / WYBRANE WYDANIA', 'Poszukiwane kolekcjonerskie', data.market.description],
    wanted: ['TWOJA LISTA / ZAKUPY I WYMIANY', 'Moje poszukiwane', 'Twoja osobista lista, niezależna od ocen limited i wyróżnień kolekcjonerskich. Gwiazdka zapisuje tożsamość karty, bez wyboru konkretnego wydania. Eksport pozwala przenieść listę do innej przeglądarki; import łączy ją z obecną listą.']
  };
  let view = 'all';
  let wanted = new Set();
  let dialogCard = null;
  let returnFocus = null;
  let storageWritable = true;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function external(url, label) {
    try { if (new URL(url).protocol !== 'https:') return escape(label); } catch { return escape(label); }
    return `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
  }
  function storageWarning(message) { $('storage-warning').hidden = false; $('storage-warning').textContent = message; }
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = core.importWanted(saved, cards);
      wanted = new Set(parsed.ids);
      if (parsed.unknown) storageWarning(`Zapisana lista zawiera ${parsed.unknown} nieznanych ID. Wyświetlam karty dostępne w tej bazie.`);
    }
  } catch {
    storageWritable = false;
    storageWarning('Nie można odczytać zapisanej listy. Zmiany będą działać w tej sesji; zachowaj je przez eksport JSON. Dotychczasowy zapis nie zostanie nadpisany.');
  }
  function saveWanted() {
    if (!storageWritable) return;
    try { localStorage.setItem(storageKey, core.exportWanted(wanted)); }
    catch { storageWarning('Przeglądarka nie pozwoliła zapisać listy. Zmiany działają w tej sesji — użyj eksportu JSON.'); }
  }
  function wishButton(card) {
    const active = wanted.has(card.id);
    return `<button type="button" class="wish" data-wish="${escape(card.id)}" aria-pressed="${active}" aria-label="${active ? 'Usuń z poszukiwanych' : 'Dodaj do poszukiwanych'}: ${escape(card.display_name)}">${active ? '★ Na liście' : '☆ Szukam'}</button>`;
  }
  const stats = card => `<dl class="stats">${[['KOSZT',card.cost],['SIŁA',card.power],['RAM',card.ram]].map(([label,value]) => `<div><dt>${label}</dt><dd>${value == null ? '—' : escape(value)}</dd></div>`).join('')}</dl>`;
  function badges(card) {
    return `<div class="badges">${card.assessment ? `<span class="badge ${core.isRecommended(card.assessment) ? 'limited' : 'warning'}">Limited · ${escape(core.gradeLabel(card.assessment))}</span>` : '<span class="badge">Limited · bez oceny</span>'}${card.market ? '<span class="badge market">Wydanie kolekcjonerskie</span>' : ''}${card.legalities?.standard === 'not-legal' ? '<span class="badge warning">Standard: niedozwolona</span>' : ''}${!card.rules_text ? '<span class="badge warning">Brak tekstu zasad w bazie</span>' : ''}</div>`;
  }
  function marketPrinting(card) { return card.printings.find(p => p.id === card.market?.printing_id); }
  function marketSources(entry) {
    return entry.sources.map(id => data.market.sources.find(source => source.id === id)).filter(Boolean).map(source => external(source.url, `${source.title} · dane ${source.snapshot}`)).join('<br>');
  }
  function cardHTML(card, index) {
    const printing = view === 'market' ? marketPrinting(card) : null;
    const collectorImage = card.market?.local_image;
    const imageSource = collectorImage || printing?.source_image_url || card.local_image;
    const imageIsRemote = Boolean(printing?.source_image_url && !collectorImage);
    return `<article class="card" data-color="${escape(card.color)}" data-card="${escape(card.slug)}">
      <div class="card-art"><button type="button" class="art-button" data-detail="${escape(card.id)}" aria-label="Szczegóły: ${escape(card.display_name)}"><img loading="${index < 8 ? 'eager' : 'lazy'}" decoding="${index < 8 ? 'sync' : 'async'}" width="500" height="700" src="${escape(imageSource)}" onerror="this.onerror=null;this.src='${escape(card.local_image)}'" alt="${escape(card.display_name)}${printing ? ` — ${escape(printing.rarity)} ${escape(printing.collector_number)}` : ''}"></button><span class="art-caption">${printing ? `Wariant ${escape(printing.rarity)} · ${escape(printing.collector_number)}${collectorImage ? ' · lokalnie' : ' · fallback lokalny w razie blokady'}` : ' '}</span></div>
      <div class="card-content"><div class="card-meta">${escape(card.color)} / ${escape(card.card_type)} / ${escape(printing?.rarity || card.rarity)}</div><h3>${escape(card.name)}</h3><p class="subtitle">${escape(card.subname || ' ')}</p>${stats(card)}${badges(card)}
      ${card.assessment && view !== 'market' ? `<p class="card-note">${escape(card.assessment.note)}</p>` : ''}
      ${printing ? '<p class="card-note">Wyróżnione wydanie w zestawieniu wartości. Źródła i dokładny wariant w szczegółach.</p>' : ''}
      <p class="edition">${escape(printing?.set.name || card.set?.name)} · ${escape(printing?.collector_number || card.print_number)}<br>${card.printings.length} wpisów wydań</p>
      <div class="card-actions"><button type="button" data-detail="${escape(card.id)}">Szczegóły ↗</button>${wishButton(card)}</div></div></article>`;
  }
  function getFilters() {
    const filters = { view };
    for (const id of controls) filters[id] = id === 'eddiable' ? $(id).checked : $(id).value;
    return filters;
  }
  function syncHash() {
    const params = new URLSearchParams();
    const filters = getFilters();
    for (const [key,value] of Object.entries(filters)) if (value && !(key === 'view' && value === 'all') && !(key === 'sort' && value === 'name')) params.set(key, value);
    if (dialogCard) params.set('card', dialogCard.slug);
    const hash = params.toString();
    try { history.replaceState(null, '', location.pathname + location.search + (hash ? '#' + hash : '')); } catch { /* Some file:// browsers restrict History. */ }
  }
  function render() {
    const matches = core.select(cards, getFilters(), wanted);
    const total = core.select(cards, { view }, wanted).length;
    $('results').innerHTML = matches.map(cardHTML).join('');
    $('result-count').textContent = `${matches.length} / ${total} kart w tym widoku`;
    $('wanted-badge').textContent = wanted.size;
    $('empty').hidden = matches.length > 0;
    $('empty-text').textContent = view === 'wanted' && !wanted.size ? 'Twoja lista jest pusta. Przejdź do Wszystkie, Limited lub Kolekcjonerskie i użyj przycisku ☆ Szukam.' : 'Zmień zapytanie lub wyczyść filtry. Każdy aktywny filtr zawęża wyniki.';
    $('empty-reset').hidden = view === 'wanted' && !wanted.size;
    syncHash();
  }
  function renderView() {
    const [kicker,title,description] = views[view];
    $('view-kicker').textContent = kicker;
    $('view-title').textContent = title;
    $('view-description').textContent = description;
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    let extra = '';
    if (view === 'limited') extra = `<details><summary>Jak czytać oceny i planować sealed</summary><p>${escape(data.limited.description)}</p><p>Oceny S–B+ pochodzą z załącznika; Legendom i wypełnieniom krzywej bez oceny literowej pozostawiono opis. Karty sytuacyjne i ostrzeżenia znajdziesz przez filtr w widoku Wszystkie.</p><p>S: bomby · A+/A/A−: mocne wybory · B+: wydajne wsparcie. „Warunkowe” wymaga spełnienia warunku karty. Dobór zależy od całej puli i krzywej kosztów.</p><ul>${data.limited.tips.map(tip => `<li>${escape(tip)}</li>`).join('')}</ul><p>Źródło: ${escape(data.limited.source)}.</p></details>`;
    if (view === 'market') extra = `<p>Sprawdzenie źródeł: ${escape(data.market.checked)}. Zdjęcia w siatce pokazują lokalne wersje podstawowe. Dokładny wariant i odnośnik do jego grafiki są w szczegółach. Nie podajemy ceny bieżącej.</p><div class="source-links">${data.market.sources.map(source => external(source.url, `${source.title} (${source.snapshot})`)).join('')}</div>`;
    if (view === 'wanted') extra = '<p>Lista jest zapisywana w tej przeglądarce. Przy otwieraniu z dysku zapis zależy również od ścieżki pliku; wykonaj eksport przed przeniesieniem katalogu.</p><div class="tools"><button type="button" data-export>Eksportuj listę JSON ↓</button><button type="button" data-import>Importuj / połącz listę ↑</button></div>';
    $('view-extra').innerHTML = extra;
  }
  function resetFilters() {
    for (const id of controls) { if (id === 'eddiable') $(id).checked = false; else $(id).value = id === 'sort' ? (view === 'limited' ? 'limited' : 'name') : ''; }
    render();
  }
  function showDetails(card, opener) {
    if (!card) return;
    if (!$('details').open) returnFocus = opener || document.activeElement;
    dialogCard = card;
    const rating = card.assessment;
    const featured = marketPrinting(card);
    const synergies = data.limited.synergies.filter(pair => pair.cards.includes(card.slug));
    const legal = card.legalities?.standard === 'legal' ? 'Legalna' : card.legalities?.standard === 'not-legal' ? 'Niedozwolona' : 'Brak informacji';
    const detailImage = card.market?.local_image || featured?.source_image_url || card.local_image;
    $('detail-body').innerHTML = `<div class="detail-layout"><div class="detail-art"><img width="500" height="700" src="${escape(detailImage)}" onerror="this.onerror=null;this.src='${escape(card.local_image)}'" alt="${escape(card.display_name)}${featured ? ` — ${escape(featured.rarity)} ${escape(featured.collector_number)}` : ''}"><small>${featured ? `Grafika wybranego wariantu: ${escape(featured.set.name)} · ${escape(featured.collector_number)} (z lokalnym fallbackiem)` : `Grafika: ${escape(card.set?.name)} · ${escape(card.print_number)}`}</small>${wishButton(card)}</div><div class="detail-copy">
      <p class="eyebrow">${escape(card.color)} / ${escape(card.card_type)}</p><h2 id="detail-title">${escape(card.display_name)}</h2><p class="muted">${escape((card.classifications || []).join(' · ') || 'Brak klasyfikacji')} · ${card.is_eddiable ? 'Sprzedawalna (Eddies)' : 'Niesprzedawalna (Eddies)'}</p>${stats(card)}${badges(card)}
      <h3>Zdolności</h3><p class="rules" lang="en">${escape(card.official_rules_text_en || card.rules_text || 'Brak tekstu zasad w zapisanej bazie.')}</p>
      <p class="source-note">Standard: ${legal} · stan danych ${escape(data.retrieved)}. To nie jest potwierdzenie dostępności w sealed.</p>
      <h3>Ocena limited / sealed</h3><div class="assessment"><strong>${escape(core.gradeLabel(rating))}</strong><p>${escape(rating?.note || 'Ta karta nie została oceniona w dostarczonej analizie. Brak oceny nie oznacza niskiej siły.')}</p></div>
      <p class="source-note">${escape(data.limited.source)}. Ocena strategiczna, bez statystyk turniejowych.</p>
      ${synergies.length ? `<h3>Połączenia z analizy</h3>${synergies.map(pair => `<p>${pair.cards.map(slug => `<button type="button" class="synergy-link" data-detail="${escape(bySlug.get(slug).id)}">${escape(bySlug.get(slug).display_name)}</button>`).join(' + ')}<br>${escape(pair.note)}</p>`).join('')}` : ''}
      ${featured ? `<h3>Wydanie kolekcjonerskie</h3><div class="printing"><strong>${escape(featured.set.name)} · ${escape(featured.collector_number)}</strong>${escape(featured.rarity)} · ${escape(featured.language?.toUpperCase())}<br>${external(featured.source_image_url,'Zobacz grafikę tego wariantu (internet)')}</div><p>Wyróżnione w zewnętrznym zestawieniu wartości; sygnał kolekcjonerski dotyczy wyłącznie tego wydania.</p><p class="source-note">Sprawdzono ${escape(data.market.checked)}.<br>${marketSources(card.market)}</p>` : ''}
      <h3>Wydania (${card.printings.length})</h3><details><summary>Pokaż wszystkie wydania i warianty</summary><div class="printing-list">${card.printings.map(p => `<div class="printing"><strong>${escape(p.set?.name)} · ${escape(p.collector_number)}</strong>${escape(p.rarity)} · ${escape(p.language?.toUpperCase() || 'Brak języka')} · ${escape(p.artist || 'Brak autora')}<br>${external(p.source_image_url,'Grafika wydania (internet)')}</div>`).join('')}</div></details>
      <h3>Rulingi</h3><p>${card.rulings.length ? escape(JSON.stringify(card.rulings)) : 'Brak rulingów w zapisanej bazie. Nie oznacza to, że karta nie ma dodatkowych wyjaśnień.'}</p><p>${external(card.source_page,'Karta w bazie źródłowej')}</p><p class="source-note">ID: ${escape(card.id)}</p></div></div>`;
    if (!$('details').open) $('details').showModal();
    $('details').scrollTop = 0;
    $('close-dialog').focus();
    syncHash();
  }
  function toggleWanted(id) {
    const card = byId.get(id);
    if (!card) return;
    wanted.has(id) ? wanted.delete(id) : wanted.add(id);
    saveWanted();
    const active = document.activeElement;
    const wasGrid = $('results').contains(active);
    render();
    if (dialogCard?.id === id) {
      const button = $('detail-body').querySelector('[data-wish]');
      button.outerHTML = wishButton(card);
      $('detail-body').querySelector('[data-wish]').focus();
    } else if (wasGrid) {
      const button = [...$('results').querySelectorAll('[data-wish]')].find(button => button.dataset.wish === id);
      (button || $('results').querySelector('button') || $('reset')).focus();
    }
    $('action-status').textContent = `${wanted.has(id) ? 'Dodano do listy' : 'Usunięto z listy'}: ${card.display_name}.`;
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.view) {
      view = button.dataset.view;
      $('action-status').textContent = '';
      renderView();
      resetFilters();
    } else if (button.dataset.detail) showDetails(byId.get(button.dataset.detail), button);
    else if (button.dataset.wish) toggleWanted(button.dataset.wish);
    else if (button.hasAttribute('data-export')) {
      const url = URL.createObjectURL(new Blob([core.exportWanted(wanted)], { type:'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'cyberpunk-poszukiwane.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('action-status').textContent = `Wyeksportowano listę: ${wanted.size} kart.`;
    } else if (button.hasAttribute('data-import')) $('import-file').click();
  });
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Plik jest za duży. Maksymalny rozmiar listy to 1 MB.');
      const imported = core.importWanted(await file.text(), cards);
      const before = wanted.size;
      imported.ids.forEach(id => wanted.add(id));
      saveWanted(); render();
      $('action-status').textContent = `Dodano ${wanted.size - before} nowych kart. Pominięto ${imported.unknown} nieznanych ID. Lista zawiera ${wanted.size} kart.`;
    } catch (error) { $('action-status').textContent = `Nie udało się zaimportować listy. ${error instanceof SyntaxError ? 'Plik nie jest poprawnym JSON.' : error.message}`; }
    finally { event.target.value = ''; }
  });
  for (const id of controls) $(id).addEventListener(id === 'query' ? 'input' : 'change', render);
  $('reset').addEventListener('click', resetFilters);
  $('empty-reset').addEventListener('click', resetFilters);
  $('close-dialog').addEventListener('click', () => $('details').close());
  $('details').addEventListener('click', event => { if (event.target === $('details')) { const r = $('details').getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) $('details').close(); } });
  $('details').addEventListener('close', () => { dialogCard = null; syncHash(); (returnFocus?.isConnected ? returnFocus : $('reset')).focus(); });
  function options(id, values) {
    for (const value of [...new Set(values)].sort((a,b) => a.localeCompare(b,'pl'))) $(id).add(new Option(value,value));
  }
  options('rarity', cards.flatMap(card => [card.rarity, ...(card.printings || []).map(printing => printing.rarity), ...(card.market ? [card.market.rarity] : [])]));
  options('classification', cards.flatMap(card => card.classifications || []));
  $('snapshot').textContent = `BAZA ${data.retrieved}`;
  $('total-count').textContent = $('all-badge').textContent = cards.length;
  $('limited-count').textContent = $('limited-badge').textContent = cards.filter(card => core.isRecommended(card.assessment)).length;
  $('printing-count').textContent = cards.reduce((count,card) => count + card.printings.length,0);
  $('market-badge').textContent = cards.filter(card => card.market).length;
  const params = new URLSearchParams(location.hash.slice(1));
  if (Object.hasOwn(views, params.get('view'))) view = params.get('view');
  for (const id of controls) if (params.has(id)) { if (id === 'eddiable') $(id).checked = params.get(id) === 'true'; else if (id === 'query' || [...$(id).options].some(option => option.value === params.get(id))) $(id).value = params.get(id); }
  if (view === 'limited' && !params.has('sort')) $('sort').value = 'limited';
  renderView(); render();
  if (params.has('card')) showDetails(bySlug.get(params.get('card')));
})();
