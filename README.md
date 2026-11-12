# Inspiracje do paznokci: instrukcja uruchomienia

Aplikacja: użytkowniczka wrzuca zdjęcie paznokci, dostaje dobrane wzory z biblioteki stylistki, a po kliknięciu
widzi wybrany wzór nałożony na swoją dłoń (model AI do edycji obrazów).

Uwaga: ten kod nie był uruchamiany w trakcie pisania (brak dostępu do sieci), więc pierwsze testy mogą
wymagać drobnych poprawek. Nazwy modeli zmieniają się, sprawdź aktualne w Google AI Studio.

## Struktura
- `public/index.html`: strona (wybór zdjęcia, wzory, podgląd)
- `public/designs.json` i `public/designs/*.jpg`: biblioteka wzorów (zdjęcia od stylistki + tagi)
- `api/recommend.js`: analiza zdjęcia i wybór wzorów
- `api/tryon.js`: nakładanie wzoru na dłoń
- `api/_gemini.js`: wspólne funkcje (wywołanie modelu, walidacja, limit zapytań)

## Uruchomienie krok po kroku
1. **Klucz API.** Wejdź na aistudio.google.com, zaloguj się kontem Google i utwórz klucz API (Get API key).
   Sprawdź tam, które modele graficzne są dostępne w darmowym limicie. Edycja obrazów bywa dostępna
   tylko po włączeniu płatności.
2. **Kod na GitHub.** Załóż konto na github.com, utwórz nowe repozytorium i wgraj cały ten folder.
3. **Hosting.** Załóż darmowe konto na vercel.com, wybierz *Add New > Project* i zaimportuj repozytorium.
4. **Zmienne środowiskowe** (Settings > Environment Variables):
   - `GEMINI_API_KEY`: Twój klucz (obowiązkowo)
   - `IMAGE_MODEL`: model do edycji obrazów (domyślnie `gemini-2.5-flash-image`)
   - `TEXT_MODEL`: model do analizy zdjęcia (domyślnie `gemini-2.5-flash`)
5. Kliknij **Deploy**. Po chwili dostajesz adres strony.

Test lokalny (opcjonalnie): zainstaluj Node.js 18+, w folderze uruchom `npx vercel dev` i ustaw
`GEMINI_API_KEY` w pliku `.env`.

## Dodawanie nowych wzorów
1. Wrzuć zdjęcie do `public/designs/` (np. `4.jpg`, najlepiej do 1024 px).
2. Dopisz wpis w `public/designs.json` (id, nazwa `n`, ścieżka `img`, tagi `t`, kształt `k`, okazja `o`, sezon `s`).

## Koszty i bezpieczeństwo
- Każda wizualizacja to jedno wywołanie płatnego modelu (orientacyjnie od kilku groszy do kilkudziesięciu).
  W `api/_gemini.js` jest prosty limit zapytań na adres IP, ale to tylko podstawowa ochrona. Ustaw limit
  wydatków w panelu Google Cloud, zanim udostępnisz aplikację publicznie.
- Zdjęcia dłoni użytkowniczek to dane osobowe. Aplikacja ich nie zapisuje, ale trafiają do zewnętrznego modelu.
  Przed publicznym startem dodaj politykę prywatności.
- Zdjęcia wzorów od stylistki: ustal na piśmie prawa do ich użycia i zgodę osób widocznych na zdjęciach.
