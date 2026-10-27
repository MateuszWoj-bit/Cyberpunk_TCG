CYBERPUNK TCG — NIGHT CITY CARD INDEX

URUCHOMIENIE
Otwórz gallery.html w aktualnym Chrome, Edge lub Firefox. Zachowaj obok
pliki gallery.css, gallery.js, catalog-core.js, catalog-data.js i folder images.
Przeglądanie i osobista lista działają bez serwera oraz bez połączenia z siecią.
Linki do źródeł i grafik innych wydań wymagają internetu.

WIDOKI
- Wszystkie: 151 tożsamości kart z bazy zapisanej 24.10.2026.
- Limited: 31 rekomendowanych kart do sealed, według analizy użytkownika.
  Łącznie zapisano 37 ocen/opisów, w tym ostrzeżenia i wybory sytuacyjne.
  Te ostatnie znajdziesz filtrem w widoku Wszystkie. Brak oceny nie oznacza
  słabej karty. Oceny nie są statystykami turniejów ani rankingiem draftu.
- Kolekcjonerskie: 8 konkretnych wydań wyróżnionych w zewnętrznych
  zestawieniach wartości. Źródła sprawdzono 27.10.2026. Snapshot HoloHoard
  podawał datę 24.10.2026, Luma 17.10.2026. Linki i daty są w interfejsie.
  To sygnał kolekcjonerski, nie pomiar popytu. Brak aktualizacji cen na żywo.
  Grafiki w siatce są lokalnymi wersjami podstawowymi; szczegóły zawierają
  link do dokładnego wydania. Beta Iconic nie jest zwykłą wersją Retail.
- Moje poszukiwane: dodawanie/usuwanie gwiazdką, eksport i import JSON.
  Gwiazdka dotyczy tożsamości karty, bez rozróżnienia jej wydań.
  Import łączy listy, usuwa duplikaty i zgłasza nieznane identyfikatory.

Filtry można łączyć. Zmiana widoku zeruje filtry; fragment adresu zapisuje
bieżące ustawienia i otwartą kartę. Wyszukiwanie obejmuje pełne nazwy,
klasyfikacje i tekst zasad, pomijając wielkość liter i znaki diakrytyczne.
Szczegóły pokazują zdolności, oceny, synergie, klasyfikacje i wydania.

ZAPIS OSOBISTEJ LISTY
Lista jest przechowywana w localStorage przeglądarki. W trybie file://
zachowanie zależy od przeglądarki i ścieżki pliku. Przed przenoszeniem
katalogu lub czyszczeniem danych przeglądarki wyeksportuj listę JSON.
Przy niedostępnym zapisie aplikacja wyświetli komunikat; nadal można
korzystać z listy w sesji oraz eksportować ją do pliku.

DANE I AKTUALIZACJA
cards.json jest źródłem danych kart. Nie wszystkie karty są w boosterach.
Standard legal/illegal nie jest informacją o dostępności w sealed.
Puste rulingi i keywords są brakami zapisanej bazy; wyszukiwarka korzysta
także z tekstu zasad. Nie uzupełniaj braków domysłami.
limited.json zawiera oceny, uzasadnienia, synergie i porady z załącznika.
market.json zawiera wybór wydań kolekcjonerskich, źródła i daty odczytu.
gallery.template.html, gallery.css i gallery.js odpowiadają za interfejs.

Po zmianie źródeł uruchom (Node.js 20+, bez instalowania zależności):
  node scripts/build.mjs
  node scripts/build.mjs --check
  node --test tests/catalog.test.cjs
Równoważne polecenia: npm run build, npm run check, npm test.

Generator tworzy gallery.html, catalog-data.js oraz cards.csv (UTF-8 BOM).
CSV zawiera ID, slug, pełną nazwę, legalność i oceny limited.
Nie edytuj wygenerowanych plików bezpośrednio. Generator sprawdza liczbę
kart, unikalność identyfikatorów, grafiki i odwołania ocen do kart/wydań.
Nie pobiera automatycznie nowych danych ze źródła. Aktualizacja źródła
cards.json oraz ocen jest osobnym, świadomym krokiem.

Testy przeglądarkowe: tests/browser.html, uruchamiane w izolowanym profilu
Chromium z --allow-file-access-from-files (dostęp ramki do lokalnej galerii).
Zwykłe korzystanie z gallery.html nie wymaga tej flagi.

Grafiki i znaki należą do ich właścicieli. Jest to nieoficjalny katalog.
Bieżące zasady i erraty mają pierwszeństwo przed zapisanym tekstem.
