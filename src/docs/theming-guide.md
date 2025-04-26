# SpecimenOne Theming-System

Diese Dokumentation beschreibt das konsolidierte Theming-System für SpecimenOne, das nun in `material-theme.css` zusammengefasst ist.

## Übersicht

Das Styling-System basiert auf drei Hauptkomponenten:

1. **Material Design 3 Farbvariablen** (`--md-sys-color-*`) für konsistente Farben
2. **Tailwind CSS** für utility-basiertes Styling
3. **tailwindBtn.js** für wiederverwendbare Komponenten-Stile

## Struktur

- `material-theme.css`: Zentrale CSS-Datei mit Material Design Theming und Dark Mode
- `tailwindBtn.js`: JavaScript-Objektstruktur mit vorgefertigten Tailwind-Klassen
- `kategorie-badges.css` und `material-badges.css`: CSS-Definitionen für visuelle Badges (rein CSS-basiert)

## Verwendung in JSX-Komponenten

### 1. Container-Elemente mit Light/Dark Mode Support

```jsx
// Beispiel für einen Container mit Dark Mode Support
<div className={`p-3 ${tailwindBtn.containerBgElevated} rounded-lg shadow-sm border 
  ${tailwindBtn.colors.border.light} ${tailwindBtn.colors.border.dark} w-full`}>
  {/* Inhalt */}
</div>
```

### 1.1 Material- und Kategorie-Badges

```jsx
// Material-Badge - reine CSS-basierte Lösung mit vordefinierter Farbpalette
<MaterialBadge materialId="SER-00" mini={true} /> // Zeigt Material-ID mit Farbkodierung an

// Kategorie-Badge - ebenfalls reine CSS-basierte Lösung
<span className="kategorie-badge kategorie-hämatologie">Hämatologie</span>
```

### 2. Material Web Components (z.B. Textfeld)

```jsx
<md-outlined-text-field
  label="Suchen..."
  id="search-input-field"
  className="w-full bg-transparent"
>
  <SomeIcon slot="leading-icon" />
</md-outlined-text-field>
```

Das `id="search-input-field"` ist wichtig für spezielle Dark Mode-Anpassungen.

### 3. Dropdown-Menüs mit Animationen

```jsx
<div className={tailwindBtn.classes.search.dropdownMenu}>
  {/* Inhalt */}
</div>
```

Die Klasse enthält bereits die Animation `animate-dropdown-fade-in`.

### 4. Verfügbare Tailwind-Klassen in tailwindBtn

- **Hintergründe**: `tailwindBtn.classes.containerBg`, `tailwindBtn.classes.cardBg`, `tailwindBtn.containerBgElevated`
- **Text**: `tailwindBtn.classes.text`, `tailwindBtn.classes.textMuted` 
- **Rahmen**: `tailwindBtn.colors.border.light`, `tailwindBtn.colors.border.dark`
- **Komponenten**: `tailwindBtn.classes.search.*`, `tailwindBtn.classes.sortMenu.*`, etc.

## Dark Mode

Dark Mode wird automatisch durch den ThemeContext gesteuert, der die nötigen CSS-Klassen (`dark`, `dark-theme`) hinzufügt. Alle Tailwind-Klassen mit `dark:` Präfix sowie die Material CSS-Variablen werden entsprechend angepasst.

## Best Practices

1. Verwende `tailwindBtn.classes.*` für wiederkehrende UI-Elemente
2. Setze auf Material Design CSS-Variablen für konsistente Farben
3. Verwende bei Textfeldern immer eine ID, wenn spezielle Anpassungen nötig sind
