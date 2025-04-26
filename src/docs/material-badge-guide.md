# MaterialBadge Implementierungsleitfaden

## Übersicht

Die MaterialBadge-Komponente wurde vollständig überarbeitet, um dem DRY-Prinzip zu folgen und eine ähnliche Implementierung wie die Kategorie-Badges zu verwenden.

## Implementierung

### CSS-Klassen-Ansatz

Die MaterialBadge verwendet einen rein CSS-basierten Ansatz:

```jsx
<span className={`material-badge ${sizeClass} ${materialClass}`}>
  {displayText}
</span>
```

Jede Material-ID (z.B. "SER-00") entspricht einer CSS-Klasse (z.B. `.material-ser-00`), die in `material-badges.css` definiert ist.

### Hinzufügen eines neuen Materials

Um ein neues Material hinzuzufügen, sind nur zwei Schritte erforderlich:

1. **material.json aktualisieren**:
   ```json
   {
     "material_id": "NEW-01",
     "material_bezeichnung": "Neues Material",
     "material_kurz": "NM",
     "material_farbe": "Blau"
   }
   ```

2. **CSS-Klasse in material-badges.css definieren**:
   ```css
   /* Neues Material - NEW-01 */
   .material-new-01 {
     background-color: #42a5f5;
     border-color: #1976d2;
     color: rgba(255, 255, 255, 0.95);
     text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
   }
   ```

### Materialbezeichnungen

Die komponente lädt automatisch Bezeichnungen aus der `material.json` und zeigt diese anstelle der IDs an. Optionale Parameter:

- `mini={true}`: Kleinere Version des Badges
- `showKurzbezeichnung={true}`: Zeigt zusätzlich die Kurzbezeichnung an (z.B. "Serum (SE)")

## MaterialService

Der MaterialService wurde vereinfacht und nutzt denselben Cache wie die MaterialBadge-Komponente. Er stellt folgende Funktionen bereit:

- `convertMaterialIdsToNames(ids)`: Wandelt Material-IDs in lesbare Namen um
- `formatMaterialForDisplay(id)`: Formatiert eine Material-ID für die Anzeige

## Vorteile der neuen Implementierung

1. **Einfachheit**: Drastisch reduzierte Komplexität
2. **Performance**: Optimierte Ladezeiten durch Caching-Mechanismus
3. **Wartbarkeit**: Leicht zu erweitern und zu aktualisieren
4. **Konsistenz**: Einheitlicher Ansatz mit Kategorie-Badges

## Verwendungsbeispiele

```jsx
// Standardverwendung
<MaterialBadge materialId="SER-00" />

// Miniaturversion
<MaterialBadge materialId="SER-00" mini={true} />

// Mit Kurzbezeichnung
<MaterialBadge materialId="SER-00" showKurzbezeichnung={true} />
```

Datum: 26.04.2025
