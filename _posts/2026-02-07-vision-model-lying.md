---
layout: post
title: "Building VIRK: A Flight Recorder for Vision Drift You Can Actually Replay"
date: 2026-02-07 12:00:00 -0500
last_modified_at: 2026-10-26 00:00:00 -0700
categories: [Engineering, MLOps, Computer Vision]
featured: true
image: /assets/blog/virk/drift-monitor.png
excerpt: "A drift alert is only useful if you can explain what triggered it and reproduce the decision. VIRK combines calibrated embedding monitoring, diagnostic fingerprints, and replayable incident evidence, with explicit boundaries around what each signal can prove."
---

A vision model can keep returning plausible predictions while the camera, lighting, or input quality changes underneath it.

The difficult part is deciding what to do before reviewed labels arrive. An accuracy dashboard may eventually show the damage, but it does not necessarily preserve the evidence needed to investigate it.

I built **VIRK (Vision Incident Response Kit)** around that gap: a flight recorder alongside a vision pipeline that detects embedding distribution changes, ranks suspected causes, and captures an incident for later inspection.

The project has moved beyond simply raising an alert. The questions I care about now are more specific:

- Was the threshold calibrated for the monitoring setup actually in use?
- What is the false-alert rate on independent clean data?
- Which parts of the incident can I reproduce exactly?
- How much monitoring work happens on the inference path?

Those questions shaped the current implementation.

---

## The 3 engineering lessons that shaped VIRK

### 1) A drift score needs calibration, not just a red line.

VIRK compares reference and current embeddings using subsampled **RBF maximum mean discrepancy (MMD)**. Subsampling bounds the comparison cost by the selected sample size rather than the total stream history.

The result is a distribution-change score. It does not directly measure accuracy, prove concept drift, or identify a physical cause.

The useful next step is to choose a threshold on clean calibration data, freeze it, and evaluate it on separate clean test data.

```bash
virk calibrate \
  --dataset data/clean_calibration \
  --test-dataset data/clean_test \
  --batch-size 64 \
  --num-batches 100 \
  --seed 42 \
  --output calibration.json
```

The command splits its first dataset into disjoint reference and threshold-fitting sets. The test dataset is not used to choose the threshold. Overlapping files and byte-identical copies are rejected, although that cannot establish independence between similar frames from the same camera or time period.

**Calibration FPR** describes the data used to fit the threshold. **Independent test FPR** checks how that frozen choice behaves on held-out clean batches. The test report includes a Wilson interval under its independence assumptions. Neither number guarantees future false-positive rates.

There is another easy trap: changing the window after calibration. A threshold fitted on batches of 32 is not automatically suitable for a sliding window of 1,000 embeddings. Feature extraction, preprocessing, reference data, kernel settings, subsampling, and window size all belong to the monitoring configuration.

**The threshold is part of an experiment, not a portable magic number.**

---

### 2) A suspected cause is a useful lead, not a diagnosis.

An alert that only says "the distribution changed" still leaves a lot of investigation to do.

VIRK's fingerprinter compares the shift with known corruption signatures, such as blur, brightness, or noise, and ranks suspected causes and affected slices. That gives an engineer a place to start inspecting the data.

It does not prove that a camera mount moved or a light failed. Similar embedding changes can have different causes, and known corruptions do not cover every new environment.

I want the output to support investigation: inspect the suggested corruption, look at captured samples and metadata, and check the application's context before deciding what happened.

That is a more useful role for diagnostic automation than presenting a ranked match as an established root cause.

---

### 3) Replay should say exactly what it reproduces.

The incident bundle is the part of VIRK I find most useful for debugging.

Middleware incidents record the sampled reference and current embeddings used for the drift decision, alongside kernel settings, thresholds, window configuration, model and preprocessing information, package versions, and artifact hashes. This evidence is captured before the incident is queued for background processing.

After extracting a bundle, there are two different operations:

```bash
python replay.py
python replay.py --verify-drift
```

The first inspects the manifest and checks sampled image hashes. The second verifies saved drift artifacts, recomputes the score from recorded embeddings, and checks the decision against the recorded threshold.

This is **drift-decision replay**. It does not reproduce every prediction or the complete traffic window. Bundles cap image samples at 20 by default; those images cannot reconstruct all the inputs behind a larger embedding window.

Exact model weights are optional because checkpoints can make bundles much larger. TIMM extractors can capture model state, while custom extractors can supply replay configuration and a checkpoint path. Re-running inference still requires original inputs and matching application preprocessing.

![Illustration of a VIRK incident bundle combining sampled images, metadata, and replay tooling]({{ '/assets/blog/virk/incident-bundle.png' | relative_url }})
_Figure: An illustration of the incident-bundle idea. Current middleware bundles also preserve the embedding operands and configuration used for drift-decision replay; sampled images are not a full traffic recording._

---

## The architecture mindset: protect inference, measure the hook

VIRK uses a middleware hook alongside inference. **Drift detection runs inline**, while fingerprinting, slicing, and bundle creation run in a background worker when asynchronous processing is enabled.

The default diagnostic queue holds 100 events. When it fills, new drift events are dropped and a warning is logged. This bounds queued work, but some incidents may not be captured under load.

That is a deliberate operational tradeoff. It does not mean monitoring has zero cost.

The evaluation tools separate two timing questions:

- **Monitoring latency:** window updates and drift checks on prerecorded embeddings, excluding inference and background incident handling.
- **Paired inference overhead:** model extraction alone compared with extraction plus the monitoring hook on the same test batches.

The paired benchmark alternates measurement order and excludes warmup. It still does not measure a complete service with image storage, remote uploads, contention, and background diagnostics.

I would rather report those boundaries than call an asynchronous system "free."

---

## Why streaming evaluation changes the picture

Independent clean batches help check a threshold. Real monitoring involves overlapping windows, repeated checks, and recovery after a shift.

VIRK supports CIFAR-10 and Flowers-102 evaluation, plus `benchmark-stream` for ordered embeddings and shift labels. The full harness uses seeded, disjoint reference, calibration, and test splits, with calibration and independent test windows of the same size.

```bash
virk eval \
  --dataset-name cifar10 \
  --batch-size 16 \
  --window-size 64 \
  --fpr 0.05 \
  --seed 42 \
  --benchmark-inference
```

Streaming reports expose false alerts, detection delays, missed shift episodes, and per-check decisions. Repeated alerts count as repeated events; the evaluator does not assume a cooldown or deduplication policy that the middleware does not implement.

Delay percentiles describe detected episodes, so they need to be read with the missed-episode count. Overlapping checks are dependent, which is why the streaming report does not attach a binomial confidence interval to them.

A supplied sample interval controls simulated timing. It is not a measured production arrival rate. For deployment work, traffic order, camera or time holdouts, and actual sampling cadence matter more than a clean benchmark headline.

---

## What I want the toolkit to make easier

The goal is a shorter path from an alert to an inspectable explanation:

1. Detect a change against a documented baseline.
2. Inspect the suspected corruption and affected samples.
3. Recompute the recorded drift decision.
4. Evaluate whether the threshold and alert behavior fit the application.

VIRK is still a beta toolkit, and deployment-specific validation remains necessary. Its strongest feature is that the evidence, assumptions, and replay boundaries are visible enough to challenge.

That is the reliability standard I want from a flight recorder.

---

## Project links

**GitHub:** [Vision Incident Response Kit (VIRK)](https://github.com/krishna-dhulipalla/Vision-Incident-Response-Kit--VIRK-)

**Repository README:** [Integration, calibration, and incident replay](https://github.com/krishna-dhulipalla/Vision-Incident-Response-Kit--VIRK-#readme)

**Evaluation notes:** [Research evaluation and reproducibility](https://github.com/krishna-dhulipalla/Vision-Incident-Response-Kit--VIRK-/blob/master/docs/research-evaluation.md)

If you work on vision monitoring or incident tooling, I would be interested in how you evaluate alert quality and reproducibility on your own traffic.
