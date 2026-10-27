---
layout: post
title: "Building Rounds: Clinical Briefings That Keep Every Claim Tied to Evidence"
date: 2026-10-26 00:00:00 -0700
categories: [Engineering, Healthcare AI, LLM Systems]
featured: true
image: /assets/blog/rounds/workbench-v2.png
excerpt: "A fluent patient summary is not enough if you cannot inspect where its statements came from. I built Rounds around versioned FHIR evidence, deterministic claim verification, explicit retrieval gaps, and a review workflow that keeps the clinician in control."
---

A patient summary can sound complete even when the underlying evidence is incomplete.

That is the failure mode I wanted to address with **Rounds**, a clinical change intelligence workbench built on FHIR. The interesting question was whether a reviewer could inspect each statement, understand what changed within an encounter, and see what the system could not establish.

The project began with a clinical summarization pipeline. The current workbench adds a React/TypeScript workspace, a FastAPI service, durable background jobs, saved evidence snapshots, and versioned handoff reviews.

The core design choice is simple:

**Construct factual claims from supported evidence in code, then let an optional model prioritize those claims.**

That gives the model a useful role without asking it to invent measurements, calculate clinical changes, or rewrite the facts.

[![Rounds review workspace showing patient changes alongside supporting FHIR evidence]({{ '/assets/blog/rounds/workbench-v2.png' | relative_url }})]({{ '/assets/blog/rounds/workbench-v2.png' | relative_url }})
_Figure: The Rounds workbench from the project repository. Briefing statements connect to source evidence, with saved review history alongside the generated briefing._

---

## The 3 engineering lessons that shaped Rounds

### 1) A citation needs to identify the evidence you actually used.

Linking a generated paragraph to a patient chart does not explain a specific claim.

Rounds binds each run to a patient, an encounter, a UTC review window, and an as-of time. Retrieved FHIR resources become a versioned evidence snapshot. Evidence identifiers point to a resource version and value path; missing version IDs use content fingerprints.

That makes the question precise: which version of which record supported this value at the time of the briefing?

Quantities and components become typed facts. Supported changes require precise timestamps, terminology codes, compatible canonical units, and an unambiguous latest value on each side of the comparison boundary.

Ambiguous same-time measurements and comparator values do not become trends. Cancelled, draft, or entered-in-error records are excluded. Conflicting resource versions fail the run rather than being silently counted twice.

These rules intentionally limit what the system can claim. Unsupported observation structures remain visible for source inspection instead of being forced into a confident-looking sentence.

---

### 2) The model should rank verified claims, not become the source of truth.

Code constructs factual statements from supported observations and changes. The verifier checks saved source JSON, content hashes, quantities, deltas, rendered templates, and evidence references.

The optional LLM receives controlled measurement labels, opaque claim IDs, claim types, and relative timing. It returns an ordering of the **complete candidate claim set**. It does not supply clinical quantities or replace claim text.

That contract makes failure handling concrete:

- Unknown or duplicate claim IDs are rejected.
- Missing claims do not quietly disappear from the briefing.
- Malformed, incomplete, or refused output uses the complete deterministic fallback.
- Clinician-authored notes stay explicitly human-authored and unverified.

Model-facing input excludes raw FHIR JSON, patient identifiers, resource IDs, free-text source labels, and absolute dates. This reduces the data sent to the model, but does not establish complete de-identification or deployment compliance.

The useful property is that an invalid ranking cannot become a new factual claim.

---

### 3) Missing evidence needs a visible state.

A polished summary can hide a retrieval failure. An empty result can also be misread as proof that nothing happened.

Rounds records a coverage manifest for each queried resource type: retrieved counts, exclusions, stale facts, unknown dates, and whether retrieval was available, empty, unavailable, or access denied.

Conditions, allergies, and documents are explicitly marked as not queried in the current workbench. That boundary matters when someone is deciding how much context a briefing covers.

Required retrieval failures or unknown and imprecise event times withhold generated claims. Partial evidence remains inspectable. An empty search means no records were returned in scope; it does not establish that an event never occurred.

This turned abstention into a workflow state instead of a vague sentence at the end of a summary.

---

## The architecture mindset: evidence, execution, and review

The main execution path separates responsibilities:

1. The React workspace requests a run in an authorized patient and encounter context.
2. FastAPI creates an idempotent, durable job.
3. A database-backed worker retrieves scoped FHIR resources and records coverage.
4. The pipeline normalizes evidence, computes supported changes, and builds claims.
5. Optional model ranking is validated, with a deterministic fallback.
6. The evidence snapshot and completion event are committed transactionally.
7. The reviewer prepares a handoff and saves draft or accepted revisions.

The local synthetic demo uses SQLite and an embedded worker. The Docker deployment uses PostgreSQL with separate API/web and worker containers. Job recovery and stored review history are explicit responsibilities rather than assumptions about a browser session staying open.

The review flow needs its own correctness rules. Optimistic revision checks prevent one save from silently overwriting another review. Accepted reviews are tied to the saved evidence snapshot, exclusions require a clinician note, and acceptance requires a complete, nonempty briefing.

These are ordinary application engineering concerns, but they become central when a generated artifact can be inspected, edited, accepted, and reopened later.

---

## Why synthetic evaluation became a design tool

The repository includes versioned synthetic scenarios and an evaluation command:

```bash
uv run python scripts/run_workbench.py evaluate \
  --output output/evaluation.json
```

The evaluator checks exact changes, completion or abstention states, and evidence references against fixture expectations. Reports include metric numerators and denominators, pipeline and dataset versions, and known limitations. A baseline report can be supplied to compare artifacts across changes.

Tests cover retrieval boundaries, quantities, source integrity, missing data, model fallback, job recovery, cancellation, conflicting reviews, authorization, and SMART launch state and PKCE handling.

These checks describe whether the implementation follows its supported evidence contract. They do not measure clinician-adjudicated briefing quality or prove medical accuracy. Hosted-model prioritization is also outside the synthetic fixture score.

I want that distinction to remain visible when discussing results.

---

## Trying the workbench

The local demonstration runs on bundled synthetic FHIR records. An API key and Docker are optional for this path.

```bash
uv sync --frozen --extra dev
npm --prefix web ci
npm --prefix web run build
uv run python scripts/run_workbench.py serve
```

Open `localhost:8000` and choose **Open synthetic workspace**. A fixed replay clock makes example scenarios reproducible, including missing timestamps, retrieval outages, and access denial.

The older Streamlit interface remains available, but uses a separate summarization pipeline with prompt-based citations and basic regex redaction. The deterministic claim verification and versioned review snapshots described here belong to the React workbench.

---

## What this project establishes

Rounds is intended for **synthetic-data demonstrations and sandbox evaluation**.

Agreement with supported extracted evidence does not establish that a source record is medically correct, that every relevant record was available, or that a briefing is clinically adequate. Clinical validation, deployment-specific privacy controls, enterprise authorization, and named clinician identity federation need further work. The project does not claim HIPAA compliance or autonomous clinical decision-making.

The engineering direction still feels useful to me: make evidence inspectable, expose missing coverage, keep calculations deterministic, and make human review a stored part of the workflow.

A readable summary is a starting point. A reviewable briefing needs those other pieces around it.

---

## Project links

**GitHub:** [Rounds / Clinical Pre-Rounding AI](https://github.com/krishna-dhulipalla/Clinical-pre-rounding-ai)

**Repository README:** [Workbench overview and local demo](https://github.com/krishna-dhulipalla/Clinical-pre-rounding-ai#readme)

**Architecture:** [Evidence, verification, review, and persistence](https://github.com/krishna-dhulipalla/Clinical-pre-rounding-ai/blob/main/docs/architecture.md)

If you work on evidence-grounded applications or review workflows, I would be interested in how you separate source verification from the quality of the final decision.
