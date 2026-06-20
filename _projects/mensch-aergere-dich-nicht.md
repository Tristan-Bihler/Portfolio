---
layout: project
title: "Mensch Ärgere Dich Nicht"
category: Embedded Systems
description: "Elektronische Hardware-Umsetzung des Klassikers — ein beleuchtetes Spielbrett mit LED-Tasten, Joysticks und eingebetteter Spiellogik."
tags: [Embedded, Hardware, LEDs, C++]
date: 2026-04-01
splash_image: /assets/images/projects/mensch-aergere-dich-nicht.jpg
github: https://github.com/Tristan-Bihler/Mensch_Aergere_Dich_Nicht
---

![Mensch Ärgere Dich Nicht Spielbrett]({{ '/assets/images/projects/mensch-aergere-dich-nicht.jpg' | relative_url }})

## Überblick

Dieses Projekt ist eine elektronische Hardware-Umsetzung des Brettspiels „Mensch Ärgere Dich Nicht". Statt Spielfiguren auf Papier werden die Spielfelder durch beleuchtete Taster dargestellt. Vier Joysticks übernehmen die Würffunktion, die gesamte Spiellogik läuft auf einem eingebetteten Mikrocontroller.

## Aufbau

Das Spielfeld ist auf einer goldfarbenen Aluminiumplatte aufgebaut, die dem Spielbrett entspricht. Jedes Spielfeld ist ein durchsichtiger Taster mit RGB-LED, der per Mikrocontroller einzeln angesteuert wird.

- Über 60 RGB-LED-Taster für alle Spielfelder und Heimfelder
- 4 Joysticks — je einer pro Spieler, zum Würfeln und Bestätigen
- Farbkodierung der Spieler: Rot, Blau, Gelb, Grün
- Zentraler Drucktaster in der Mitte des Feldes
- Anschluss über USB für Stromversorgung und Kommunikation
- Robustes Alugehäuse mit 3D-gedruckten Tasterabdeckungen

## Elektronik & Firmware

Die Steuerung erfolgt über einen Mikrocontroller, der die LED-Matrix treibt, Taster-Eingaben entprellt und die vollständige Spiellogik implementiert — von der Würfelsimulation bis zur Regelprüfung beim Herauswerfen.

## Spiellogik

Alle klassischen Regeln sind implementiert: Pflichtauszug bei einer Sechs, Herauswerfen gegnerischer Figuren, Einzug ins Haus und Sperren durch eigene Figuren. Die aktuelle Spielphase wird durch Blinksequenzen der LEDs kommuniziert.

## Was ich gelernt habe

- Ansteuerung großer LED-Matrizen über Multiplexing
- Entprellung von Eingaben in Hardware und Firmware
- Implementierung einer vollständigen Spiellogik auf Mikrocontroller-Ebene
- Mechanische Konstruktion eines stabilen Spielgehäuses
