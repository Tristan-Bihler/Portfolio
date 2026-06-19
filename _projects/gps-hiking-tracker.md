---
layout: project
title: "GPS Hiking Tracker"
category: IoT / Outdoor
description: "A lightweight GPS tracker built for multi-day hiking trips with LoRa radio and offline map support."
tags: [Arduino, GPS, LoRa, C++]
date: 2026-01-15
---

## Overview

Inspired by my Black Forest hike (see blog), I built a wearable GPS tracker that logs position every 30 seconds, broadcasts a short LoRa packet at each waypoint, and stores the full track on a microSD card for later analysis.

## Hardware

- Arduino Pro Mini 3.3 V (power efficiency)
- u-blox NEO-6M GPS module
- RFM95W LoRa transceiver (868 MHz)
- microSD breakout for track logging
- 2000 mAh LiPo battery (~48 h runtime)

## Firmware

Written in C++ with the Arduino framework. The GPS library parses NMEA sentences; valid fixes are serialised as a compact binary format before being written to SD and broadcast via LoRa.

## Post-Hike Analysis

After a hike, the SD card is read back by a Python script that converts the binary log to GPX, computes statistics (distance, ascent, speed profile), and generates an elevation chart.

## Planned Improvements

- Moving to a lower-power MCU (nRF52840) for extended battery life
- Adding a small e-ink display for live stats on the trail
- Integrating with the Smart Energy Monitor project for base-camp power tracking
