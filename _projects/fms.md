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

The recommendation engine combines two approaches: a **content-based** method that scores films against a user's genre history, and a **collaborative filtering** method that finds the most similar other user and borrows their picks.

### 1 — Content-Based Scoring

For every candidate film, the engine sums up how often each of its genres appears in the films the user has already liked:

```
score(film) = Σ genre_count(g)  for each genre g in film
```

`genre_count` is built with a `Counter` over all genres from the user's liked films. Films whose genres appear more frequently in the user's history receive a higher score. Candidates are then ranked by descending score.

### 2 — Collaborative Filtering (Jaccard Similarity)

To find a similar user, the engine compares genre sets using the Jaccard index:

```
J(A, B) = |A ∩ B| / |A ∪ B|
```

where **A** is the set of genres liked by the current user and **B** is the set liked by another user. A value of 1 means identical taste; 0 means no overlap. The user with the highest Jaccard score is selected, and their highly-rated films (not yet seen by the current user) are surfaced as recommendations.

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
