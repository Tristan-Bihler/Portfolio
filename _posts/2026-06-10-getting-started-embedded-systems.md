---
layout: post
title: "Getting Started with Embedded Systems"
date: 2026-06-10
category: Engineering
excerpt: "A practical introduction to microcontroller programming and the fundamentals of embedded systems development."
---

## What is an Embedded System?

An embedded system is a computer system with a dedicated function within a larger mechanical or electrical system. Unlike general-purpose computers, embedded systems are optimised for specific tasks — think microwave ovens, automotive ECUs, or the STM32 on your breadboard.

## My Entry Point: STM32

My first real embedded project was a sensor data logger using the STM32F4 Discovery board. The learning curve was steep — setting up the toolchain alone took an afternoon — but the payoff was immediate. There is something deeply satisfying about writing code that directly controls hardware in real time.

```c
// Blink the LED on PA5
HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
HAL_Delay(500);
```

## Key Lessons

1. **Read the datasheet** — everything you need is there, even if it takes time to find it.
2. **Start with HAL, then go bare-metal** — the Hardware Abstraction Layer is your friend for getting things working fast.
3. **Use a logic analyser** — debugging communication protocols (I2C, SPI, UART) by blinking LEDs is pain. Get the right tools.

## What's Next

I'm currently building a more complex project: a real-time energy monitor with MQTT connectivity. More on that in the Projects section.
