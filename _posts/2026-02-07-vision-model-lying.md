---
layout: post
title: "Why Your Vision Model Is Lying to You (And How to Catch It)"
date: 2026-02-07 12:00:00 -0500
categories: [Engineering, MLOps, Computer Vision]
featured: true
image: /assets/blog/virk/drift-monitor.png
excerpt: "Production failures in computer vision are rarely simple 'wrong predictions.' They are complex conceptual drifts—blur, lighting, camera shifts. Here’s how I built a 'flight recorder' to catch them before they become incidents."
---

Most people treat computer vision monitoring as just "tracking accuracy."

I used to think the same—until I deployed models into the messy, unpredictable real world.

What I learned is simple:

**Models don't just fail. They drift conceptually.**
And because they drift in specific ways (lighting changes, camera bumps, weather), they create _signals_ that are easy to miss if you only look at top-line metrics.

This post is a recap of why I built **VIRK (Vision Incident Response Kit)**—a flight recorder for CV pipelines—and the patterns that matter most in production.

---

## The 3 biggest failure patterns I noticed

### 1) Accuracy is a lagging indicator (and often impossible to get)

In production, you rarely have immediate ground truth labels. Waiting for human review means you are reacting days or weeks late.

Instead of waiting for labels, I saw that monitoring **embedding drift** gave me a realtime pulse.

- **High drift magnitude** often preceded accuracy drops.
- **Sudden spikes** indicated environmental shocks (e.g., lights going out).

This is exactly why **Drift Detection > Accuracy Monitoring** for immediate operational health.

![Drift vs Accuracy](/assets/blog/virk/drift-monitor.png)
_Figure: Drift spikes (red) often predict performance degradation long before labels arrive._

---

### 2) "Something is wrong" isn't actionable

Telling an engineer "the model is drifting" is useless. They need to know _why_.

I found that generic drift scores were just noise without context. The real signal comes from **fingerprinting the cause**:

- Is it a **brightness shift**? (Camera exposure issue)
- Is it **motion blur**? (Camera mounting loose)
- Is it **new semantic classes**? (New product type)

So I built a **Fingerprinter** that diagnoses the root cause automatically.

---

### 3) Reproducibility is the nightmare

This is the most practical lesson from on-call rotations:

**If you can't reproduce it, you can't fix it.**

For at least some incidents, the "bad data" was transient. By the time we looked, the stream was back to normal.

That implies:

- You capture the **exact batch** of images that caused the drift.
- You capture the **metadata** and **model state**.
- You create an **executable replay script**.

I automated this with the **Incident Bundler**, which zips up everything needed to replay the failure locally with one command.

![Incident Bundle Structure](/assets/blog/virk/incident-bundle.png)
_Figure: An incident bundle contains everything needed for local reproduction: images, manifest, and replay script._

---

## The "Flight Recorder" Mindset

Once you accept that failures are inevitable, the goal shifts from "prevention" to "fastest possible diagnosis."

**High-assurance vision systems need a black box.**

So I designed VIRK to sit alongside the inference service:

- **Async & Non-blocking**: It never slows down the main prediction loop.
- **Load Shedding**: If the system is overwhelmed, it drops diagnostics, not predictions.
- **Privacy-aware**: It only saves data when an incident is detected.

---

## Why this matters

If you monitor blindly, production vision systems feel fragile and opaque.

If you monitor **drift + root cause + reproducibility**, incidents become manageable:

- You know **when** it's happening (Drift).
- You know **why** it's happening (Fingerprint).
- You have the data to **fix it** (Bundler).

That’s the reliability standard we need for modern MLOps.

---

## Project link (if you’re curious)

I built this toolkit for myself and open-sourced it:

**GitHub:** [Vision Incident Response Kit (VIRK)](https://github.com/krishna-dhulipalla/Vision-Incident-Response-Kit--VIRK-)
**Documentation:** [Read the docs](https://github.com/krishna-dhulipalla/Vision-Incident-Response-Kit--VIRK-#readme)

Setup is a single `pip install` away. Let me know what you think!
