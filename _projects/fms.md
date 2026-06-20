---
layout: project
title: "Film Management System"
category: Software Development
description: "A Python-based movie recommendation system using a category-weighted matrix and TMDB data — with and without Firebase backend."
tags: [Python, Firebase, Recommendation Engine, TMDB]
date: 2024-06-01
github: https://github.com/Tristan-Bihler/2_Semester_Projekt
---

## Overview

The Film Management System (FMS) is a recommendation engine built in Python as part of a group project at DHBW Lörrach. It suggests movies to users based on their prior selections, using a category-weighted matrix to compute similarity scores between user preferences and the available film catalogue sourced from the TMDB database.

## How It Works

At the core of the system is a **category matrix**: each film is assigned weighted scores across multiple genre and content dimensions. When a user rates or selects a film, those weights are accumulated into a preference profile. The engine then ranks unrated films by similarity to that profile and surfaces the best matches.

## Features

- Movie catalogue sourced from the TMDB dataset (`tmdb_movies.json`)
- Matrix-based recommendation engine with category weighting
- Interactive user interface for browsing and rating films
- Persistent data storage for user history and preferences
- **Two variants:** one with Firebase backend for cloud sync, one fully local

## Tech Stack

| Component | Technology |
|---|---|
| Language | Python |
| Data | TMDB movie database |
| Backend (cloud variant) | Firebase |
| UI | Python (interactive CLI / GUI) |

## Context

Developed as a second-semester group project at DHBW Lörrach. The dual implementation — with and without Firebase — demonstrates how the same application logic can be adapted for both offline and cloud-connected environments.
