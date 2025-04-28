# UpdateMaterialCSS.ps1 - Anleitung

## Übersicht

Dieses PowerShell-Skript generiert automatisch CSS-Klassen für die MaterialBadge-Komponente basierend auf den Definitionen in der `material.json`-Datei.

## Funktionsweise

1. Das Skript liest alle Materialien aus der `public/material.json` Datei
2. Basierend auf den Material-IDs und Farben werden CSS-Klassen generiert
3. Die generierten CSS-Klassen werden in die `src/styles/material-badges.css` Datei geschrieben
4. Vorher wird ein Backup der bestehenden CSS-Datei erstellt (`.css.bak`)

## Vorteile der automatischen CSS-Generierung

- **Konsistenz:** Einheitliche Farbgebung und Stilregeln für alle Material-Badges
- **Zeitersparnis:** Kein manuelles Erstellen von CSS-Klassen erforderlich
- **Fehlerreduktion:** Keine Tippfehler oder vergessene Materialien
- **Einfache Wartung:** Zentrale Aktualisierung aller Material-Stile

## Verwendung

```powershell
# Im Stammverzeichnis des Projekts ausführen:
pwsh -ExecutionPolicy Bypass -File UpdateMaterialCSS.ps1
```

## Farbzuordnung

Das Skript verwendet eine Mapping-Tabelle, um konsistente Farben basierend auf dem `material_farbe`-Attribut zuzuweisen:

| Farbe     | Hintergrund | Rand      | Textfarbe |
|-----------|-------------|-----------|-----------|
| Rot       | #ef5350     | #c62828   | Hell      |
| Braun     | #8d6e63     | #5d4037   | Hell      |
| Gelb      | #ffee58     | #f9a825   | Dunkel    |
| Grün      | #66bb6a     | #388e3c   | Hell      |
| Blau      | #42a5f5     | #1976d2   | Hell      |
| Lila      | #ab47bc     | #7b1fa2   | Hell      |
| Orange    | #ffa726     | #ef6c00   | Dunkel    |
| Farblos   | #e0e0e0     | #9e9e9e   | Dunkel    |
| Weiß      | #f5f5f5     | #e0e0e0   | Dunkel    |
| Grau      | #9e9e9e     | #616161   | Hell      |

## Anpassung der Farbtabelle

Wenn Sie zusätzliche Farbdefinitionen hinzufügen möchten, können Sie die `$colorMapping`-Variable im Skript erweitern:

```powershell
$colorMapping = @{
    # Bestehende Farben...
    "NeuesFarbe" = @{bg="#hex"; border="#hex"; text="light/dark"}
}
```

## Integration mit MaterialBadge

Nach der Ausführung des Skripts werden die generierten CSS-Klassen automatisch von der MaterialBadge-Komponente verwendet, wenn ein `materialId`-Prop übergeben wird.

## Fehlerbehebung

- **Unbekannte Farben:** Werden mit der Standardfarbe "Grau" dargestellt
- **Fehler bei der Ausführung:** Das Originalbackup wird wiederhergestellt
- **Ausführungsrichtlinien:** Bei Berechtigungsproblemen `pwsh -ExecutionPolicy Bypass -File UpdateMaterialCSS.ps1` verwenden
