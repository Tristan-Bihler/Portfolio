---
layout: project
title: "DHBW Data Dashboard"
category: Data Analytics
description: "Interactive dashboard for visualising sensor data streams collected during lab experiments at university."
tags: [Python, Pandas, Plotly]
date: 2025-11-01
---

## Overview

For a university lab module, our group built an interactive web dashboard that ingests CSV exports from lab measurement equipment and produces publication-ready visualisations in seconds.

## The Problem

Lab measurement software exports data in inconsistent formats. Post-processing in Excel was error-prone and non-reproducible. We needed a pipeline that could handle real data reliably.

## Solution

A Python command-line tool parses incoming CSVs (handling multiple sensor types and sampling rates), normalises the data, and feeds a Plotly Dash application. The interface allows students to select channels, set time windows, and export figures.

## Key Features

- Auto-detection of sensor type from file headers
- Resampling and interpolation for mixed-rate data
- One-click PNG / SVG export for lab reports
- Dark-mode UI matching the oscilloscope aesthetic

## Impact

Used by two lab groups for semester projects. Reduced post-processing time from ~2 hours to under 10 minutes per experiment.
