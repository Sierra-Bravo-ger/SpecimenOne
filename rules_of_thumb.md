# 📘 SpecimenOne – Rules of Thumb 👍 oder deutsch Faustregeln ✊

## 📋 1. Jede Erkenntnis verdient eine Regel – auch wenn sie sich später ändern darf

> Lieber eine unvollkommene Regel als gar keine. Was heute als "Faustregel" dient,  
> kann morgen präzisiert oder ersetzt werden. Wichtig ist, dass es dokumentiert ist.

**Gelernt bei:** Podcast über Software Architektur 'Software Architektur TV'
**Status:** ✅ Leitsatz – Basis für dieses Dokument

---

## 🧠 2. Klinische Daten altern nicht wie Müll – sie altern wie Dokumente

> Sie dürfen verblassen, aber nicht verschwinden.

**Erkenntnis:** Löschung ist in der Medizin nie neutral. Daten erzählen immer einen klinischen oder prozessualen Kontext. Selbst veraltete Tests haben ihre Bedeutung.  
**Status:** ✅ Leitsatz – gilt als ethische und technische Richtlinie für alle nachfolgenden Regeln und Entscheidungen

---

## 📌 3. Legacy Magic Numbers – implizite Regeln in Legacy Systemen

> Legacy Systeme enthalten oft implizite Business-Rules. Dafür werden unter anderem Verwendet: Prozeduren oder anderweitig ausgelagerte Berechnungen  
> Meistens historischer Hintergrund: „Dieses Testergebnis braucht eine spezielle Behandlung“
  
  Jede Testnummer kann ein Einhorn sein. 🦄

Wenn in einer Prozedur steht: `if Test_Nr = 4711 then ...`, dann bedeutet das: dieser Test hat eine Sonderrolle.

**Folge:** Solche Einhörner müssen identifiziert, dokumentiert und in einer idealen Welt standardisiert werden.  
**Status:** 🚧 offene Baustelle – systematisch in Bearbeitung
