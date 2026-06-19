---
layout: project
title: "AOI – Automatische Optische Inspektion"
category: Bildverarbeitung
description: "Ein eingebettetes System zur automatischen optischen Inspektion von Leiterplatten mittels Kamera und Bildverarbeitungsalgorithmen."
tags: [C++, OpenCV, Python, Embedded]
date: 2026-05-01
---

## Überblick

Das AOI-System (Automatische Optische Inspektion) prüft Leiterplatten vollautomatisch auf Bestückungsfehler, fehlende Bauteile und Lötfehler. Eine hochauflösende Kamera nimmt Bilder der Platine auf, die anschließend mit OpenCV analysiert und mit einem Referenzbild verglichen werden.

## Hardware

- Raspberry Pi 4 als Steuereinheit
- 12-Megapixel USB-Kamera mit Telezentrikobjektiv
- LED-Ringlicht für gleichmäßige Ausleuchtung
- Linearachse zur reproduzierbaren Positionierung

## Bildverarbeitung

Die Verarbeitungspipeline basiert auf OpenCV und umfasst Vorverarbeitung, Merkmalextraktion und Anomalieerkennung durch Template-Matching sowie Konturanalyse.

```cpp
cv::Mat preprocess(const cv::Mat& input) {
    cv::Mat gray, blurred, thresh;
    cv::cvtColor(input, gray, cv::COLOR_BGR2GRAY);
    cv::GaussianBlur(gray, blurred, {5, 5}, 0);
    cv::adaptiveThreshold(blurred, thresh, 255,
        cv::ADAPTIVE_THRESH_GAUSSIAN_C, cv::THRESH_BINARY, 11, 2);
    return thresh;
}
```

## Auswertung

Erkannte Fehler werden automatisch markiert und in einem Prüfbericht mit Koordinaten und Fehlertyp gespeichert. Eine Python-Oberfläche zeigt Ergebnisse in Echtzeit an und erlaubt manuelle Nachkontrolle.

## Ergebnisse

- Erkennungsrate: &gt;97 % bei definierten Fehlerklassen
- Taktzeit: &lt;3 Sekunden pro Platine
- Falshalarmrate: &lt;1,5 %

## Was ich gelernt habe

- Aufbau robuster Bildverarbeitungspipelines
- Bedeutung kontrollierter Beleuchtung für reproduzierbare Ergebnisse
- Integration von Embedded-Hardware und PC-Software über serielle Schnittstellen
