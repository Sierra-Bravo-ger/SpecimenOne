# SpecimenOne API-Integration

Diese README beschreibt die Umstellung der SpecimenOne-Anwendung von lokalen JSON-Dateien auf die PostgreSQL-API.

## 📋 Überblick

Die SpecimenOne-Anwendung wurde modernisiert, um mit einer REST-API zu kommunizieren, die auf einer PostgreSQL-Datenbank basiert. Diese Umstellung bietet mehrere Vorteile:

- **Verbesserte Performance**: Optimierte Datenabfragen
- **Paginierung**: Effiziente Handhabung großer Datenmengen
- **Suchfunktionalität**: Serverseitige Suche und Filterung
- **Datensicherheit**: Bessere Trennung von Frontend und Backend

## 🚀 Schnellstart

Folgen Sie diesen Schritten, um die API-Integration zu aktivieren:

1. **API-Server starten**:

```powershell
cd c:\Projekte\SpecimenOne\server
npm run dev
```

2. **API-Verbindung testen**:

```powershell
cd c:\Projekte\SpecimenOne
./test-api-connection.ps1
```

3. **API-Integration einrichten**:

```powershell
cd c:\Projekte\SpecimenOne
./setup-api-integration.ps1
```

4. **Anwendung starten**:

```powershell
cd c:\Projekte\SpecimenOne
npm run dev
```

## 🔄 Was wurde geändert?

- **Services**: Neue API-basierte Services für Material, Einheiten, Tests und Profile
- **zentraler Hook**: `useLeistungsverzeichnis` als einheitliche Schnittstelle
- **API-Client**: Zentrale Verwaltung der API-Kommunikation
- **Fehlerbehandlung**: Verbesserte Fehlerbehandlung für API-Probleme

## 📚 Dokumentation

Ausführliche Dokumentation zu den Änderungen:

- [API-Integration Guide](./API-INTEGRATION-GUIDE.md): Detaillierte Anleitung zur Integration
- [Server README](./server/README.md): Informationen zum API-Server

## 🛠️ Entwicklungswerkzeuge

Nützliche Tools für die Entwicklung:

1. **API-Tester**: `test-api-connection.ps1` - Prüft alle API-Endpunkte
2. **Setup-Skript**: `setup-api-integration.ps1` - Richtet die API-Integration ein
3. **Browser-Entwicklertools**: Netzwerktab für API-Anfragen überwachen

## ⚠️ Bekannte Probleme

- Die Funktionalität zum Erstellen eigener Profile ist noch nicht vollständig implementiert
- Nach längerer Inaktivität kann es zu Verbindungsproblemen kommen

## 📝 Änderungsprotokoll

- **Mai 4, 2025**: Initiale API-Integration
- **Mai 3, 2025**: API-Server mit PostgreSQL-Anbindung erstellt
- **Mai 2, 2025**: Datenimport in PostgreSQL abgeschlossen
