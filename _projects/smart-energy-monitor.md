---
layout: project
title: "Smart Energy Monitor"
category: Embedded Systems
description: "A real-time energy monitoring system using STM32 microcontrollers with MQTT connectivity and a live Python dashboard."
tags: [C, STM32, MQTT, Python]
date: 2026-03-01
---

## Overview

The Smart Energy Monitor measures household power consumption in real time using a current transformer clamp around the main supply cable. An STM32 microcontroller samples the analogue signal, computes RMS values, and publishes readings via MQTT to a local broker.

## Hardware

- STM32F103C8T6 ("Blue Pill") microcontroller
- YHDC SCT-013 split-core current transformer
- ESP8266 Wi-Fi module for MQTT publishing
- 3D-printed enclosure

## Firmware

The firmware is written in C using the STM32 HAL. The ADC samples at 4 kHz; each 50 Hz cycle is accumulated and the RMS value computed. A software watchdog resets the MQTT connection if the broker becomes unreachable.

```c
// Sample ADC and compute RMS over one mains cycle
float compute_rms(uint16_t *samples, uint16_t count) {
    float sum = 0.0f;
    for (uint16_t i = 0; i < count; i++) {
        float v = (samples[i] - 2048) * SCALE_FACTOR;
        sum += v * v;
    }
    return sqrtf(sum / count);
}
```

## Dashboard

A lightweight Dash application subscribes to the MQTT topic and renders a rolling 24-hour chart. Peaks are annotated automatically when consumption exceeds a configurable threshold.

## What I Learned

- ADC calibration and noise reduction on an MCU
- MQTT QoS levels and reconnection strategies
- The value of decoupling data acquisition from data visualisation
