---
layout: project
title: "Mensch Ärgere Dich Nicht"
category: Softwareentwicklung
description: "Digitale Umsetzung des klassischen Brettspiels mit KI-Gegnern, grafischer Oberfläche und Netzwerkmodus für mehrere Spieler."
tags: [Python, Pygame, KI, Netzwerk]
date: 2026-04-01
---

## Überblick

Dieses Projekt ist eine vollständige digitale Umsetzung des Klassikers „Mensch Ärgere Dich Nicht". Das Spiel unterstützt bis zu vier menschliche oder KI-gesteuerte Spieler, bietet eine grafische Oberfläche mit Pygame und einen optionalen Netzwerkmodus über Sockets.

## Features

- 2–4 Spieler (Mensch oder KI beliebig kombinierbar)
- Animiertes Spielbrett mit klassischem Farbschema
- Drei KI-Schwierigkeitsstufen: Zufällig, Greedy, Minimax
- Netzwerkmodus: Server/Client über TCP-Sockets
- Spielstand speichern und laden (JSON)

## Spiellogik

Die Regelimplementierung behandelt alle Sonderfälle: Herauswerfen, Einzug ins Haus, Zwangswurf bei sechs und Blockierregeln bei besetzten Feldern.

```python
def move_piece(self, piece: Piece, steps: int) -> MoveResult:
    new_pos = piece.position + steps
    if new_pos > TRACK_LENGTH + HOME_OFFSET:
        return MoveResult.INVALID
    target = self.board[new_pos % TRACK_LENGTH]
    if target and target.color == piece.color:
        return MoveResult.BLOCKED
    if target:
        self.send_home(target)
        return MoveResult.CAPTURE
    piece.position = new_pos
    return MoveResult.OK
```

## KI-Gegner

Der Minimax-Algorithmus mit Alpha-Beta-Pruning bewertet Spielzustände anhand der Figurenpositionen und der Bedrohungslage. Der Greedy-Spieler wählt stets den lokal besten Zug ohne Vorausplanung.

## Netzwerkmodus

Ein einfaches TCP-Protokoll synchronisiert Würfelergebnisse und Züge zwischen Server und Clients. Verbindungsabbrüche werden erkannt und der betroffene Spieler durch die KI ersetzt.

## Was ich gelernt habe

- Saubere Trennung von Spiellogik, Darstellung und Netzwerkschicht (MVC)
- Implementierung von Minimax mit Alpha-Beta-Pruning
- Grundlagen der Socket-Programmierung in Python
- Umgang mit asynchronen Ereignissen in einer Spielschleife
