---
layout: post
title: Why most agentic workflows break in production
date: 2025-12-27
category: Failures
featured: false
excerpt: Infinite loops, context overflow, and the 'lost in the middle' phenomenon. Why simple chains usually beat autonomous agents.
---

Agents are great at planning but terrible at knowing when they are stuck.

## The Loop Problem

When an agent fails a tool call, the default behavior in many frameworks (like initial versions of AutoGen) is to try again. And again. And again.

If the failure is deterministic (e.g., a file permissions error), the agent enters an infinite loop.

**Fix:** System-level interrupts. Hard limits on "steps" per goal.
