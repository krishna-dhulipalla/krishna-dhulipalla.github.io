---
layout: post
title: What I learned reverse-engineering ATS systems while job hunting
date: 2025-12-26
category: Reverse Engineering
featured: false
excerpt: Parsing Workday, Lever, and Greenhouse taught me more about 'anti-scraping' than any CTF. Here is how I built a differential job tracker.
---

Job hunting is a data problem. But the data source (ATS platforms) is hostile.

## The Shadow DOM

Workday doesn't want you to scrape it. Their DOM is a mess of generated class names and shadow roots.

**Strategy:** Instead of selectors, I moved to computer vision based locators (using simplified DOM snapshots passed to a small VLM) to find the "Apply" button reliably.
