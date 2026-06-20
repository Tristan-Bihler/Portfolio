---
layout: project
title: "2D Adventure Game in C++"
category: Game Development
description: "A 2D top-down shooter in C++ with procedurally generated rooms, enemies, and escalating difficulty — built with raylib."
tags: [C++, raylib, Game Development, Procedural Generation]
date: 2024-06-01
github: https://github.com/Tristan-Bihler/2_Semester_Projekt
---

## Overview

A 2D top-down shooter developed in C++ as part of a group project at DHBW Lörrach. The player navigates procedurally generated rooms, fights enemies, and fires projectiles — with each new room increasing in difficulty.

## Gameplay

The player controls a character from a top-down perspective. Movement and shooting are the core mechanics. Rooms are generated procedurally, meaning no two playthroughs are identical. Enemies, obstacles, and layout all scale in complexity as the player progresses, keeping the difficulty curve consistent without hand-crafted levels.

## Architecture

The codebase is structured around distinct game entities, each with its own source and header files:

| Class | Role |
|---|---|
| `Player` | Movement, input handling, health |
| `Enemy` | AI behaviour, pathfinding |
| `Bullet` | Projectile physics and collision |
| `Hindernisse` | Obstacle placement and collision |
| `Rooms` | Procedural room generation and transitions |

## Tech Stack

- **Language:** C++
- **Graphics library:** [raylib](https://www.raylib.com/) — lightweight, no external dependencies
- **Compiler:** MSYS2 / ucrt64 toolchain

## Context

Developed as a second-semester group project at DHBW Lörrach, alongside the Film Management System. The project covers core object-oriented design, real-time game loops, collision detection, and procedural content generation.
