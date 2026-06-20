---
layout: project
title: "AOI – Automatische Optische Inspektion"
category: Embedded Systems
description: "Eigenentwickelte AOI-Maschine zur automatischen Sichtkontrolle von Leiterplatten — mit Kamera, LED-Beleuchtung, Achsantrieb und Touchscreen-Steuerung."
tags: [Python, OpenCV, PyQt5, Firebase]
date: 2026-05-01
splash_image: /assets/images/projects/aoi.jpg
github: https://github.com/Tristan-Bihler/Feintechnikschule_Gesellenstueck_AOI
---

![AOI-Maschine]({{ '/assets/images/projects/aoi.jpg' | relative_url }})

## Überblick

Die AOI-Maschine (Automatische Optische Inspektion) ist eine vollständige Eigenentwicklung zur Qualitätskontrolle von bestückten Leiterplatten. Das System erfasst hochauflösende Bilder des Prüflings, vergleicht diese mit einem Referenzdatensatz und markiert Abweichungen automatisch.

## Aufbau

Das Gehäuse besteht aus Aluminiumprofilen und Acrylglasscheiben. Im Inneren befinden sich zwei Ebenen: die obere Einheit beherbergt die Steuerelektronik und einen Touchscreen-PC, die untere Einheit enthält den Inspektionsbereich mit Kamera und Beleuchtung.

- Kamera mit Telezentrikobjektiv für verzerrungsfreie Aufnahmen
- LED-Ringbeleuchtung in Rot für optimalen Kontrast
- X-Y-Linearachse zur reproduzierbaren Positionierung der Platine
- Touchscreen-Bedienoberfläche mit Start/Stop-Steuerung und Live-Anzeige
- Not-Aus-Taster nach Sicherheitsnorm

## Steuerung & Software

Die Steuerungssoftware läuft auf einem eingebetteten PC und kommuniziert über Schnittstellen mit den Achsmotoren und der Kamera. Die Bedienoberfläche zeigt den aktuellen Status, Prüfergebnisse und Statistiken in Echtzeit an.

## Ergebnisse

- Taktzeit unter 5 Sekunden pro Platine
- Erkennungsrate über 97 % bei definierten Fehlerklassen
- Reproduzierbare Positioniergenauigkeit durch Linearachse

## Was ich gelernt habe

- Mechanischer Aufbau eines Prüfautomaten von Grund auf
- Integration von Kamera, Beleuchtung und Antrieb in einem Gesamtsystem
- Entwicklung einer praxistauglichen Bedienoberfläche für industrielle Anwendungen
