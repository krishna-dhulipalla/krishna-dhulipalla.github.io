---
layout: post
title: "PostgreSQL Might Be the Most Underrated Tool in Your Stack"
date: 2026-04-21 10:30:00 -0500
categories: [Engineering, Databases, Systems]
featured: false
excerpt: "PostgreSQL is still treated like 'just the database,' even though it can absorb surprising amounts of search, scheduling, vector, auth-adjacent, and API work. OpenAI's own PostgreSQL scaling story is a good reminder: this tool has far more headroom than most teams assume."
---

Modern software teams often assemble a stack by default:

- a database
- a cache
- a cron product
- a search tool
- a vector database
- an auth service
- an analytics pipeline
- an API layer sitting in front of all of it

Sometimes that is the right call.

But the more I look at PostgreSQL, the more it feels like we often underestimate how much it can already do before we start adding extra tools.

This is not a "replace everything with Postgres" manifesto. It is more me being surprised that there is already a free diamond sitting in the stack, and a lot of us barely use it.

---

## Why Postgres gets underestimated

A lot of people still mentally file PostgreSQL under "boring relational database."

I used to think about it that way too.

PostgreSQL is a general-purpose data platform with:

- relational data
- JSONB for semi-structured application data
- full-text search
- extensions for vectors, scheduling, crypto, GraphQL, and more
- row-level security and mature indexing options
- a huge operational knowledge base because it has been battle-tested for years

What keeps standing out to me is that this is already a lot of capability in one place.

For many projects, that can mean a simpler setup earlier on.

---

## The part that made me pause

We sometimes pay for separate services for problems that Postgres might already cover well enough.

Not perfectly. Not always at hyperscale. But often well enough.

### 1) Scheduled jobs

Need recurring cleanup, backfills, rollups, or TTL-style maintenance jobs?

`pg_cron` can schedule SQL directly inside the database. That is not the same as a full workflow engine, but it did make me wonder how often people reach for a separate scheduler before they need one.

### 2) Search

For a lot of apps, the first search problem is not "we need Elasticsearch."

It is more like "we need users to find records quickly, handle a bit of fuzziness, and get decent results."

Postgres already gives you solid primitives with full-text search, `tsvector`, and GIN indexes. If the use case is product search, notes, documents, or internal lookup at a modest scale, that might be enough for much longer than expected.

### 3) Vector retrieval

If you are building retrieval-augmented generation or semantic search, `pgvector` changes the conversation quite a bit. Suddenly the default architecture does not always have to be app DB plus separate vector DB from day one.

Having embeddings live next to product data can be simpler and easier to reason about, especially early on.

### 4) Cache-like behavior

The video also points out that Postgres can imitate some cache use cases with unlogged tables and expiration logic.

That does not mean Postgres is Redis.

It mostly made me think that some teams probably reach for Redis before they have a real Redis problem.

### 5) API surface

With tools like PostgREST or GraphQL layers tied closely to Postgres, a big chunk of CRUD API work can become much thinner. That does not eliminate application logic, but it can remove a lot of repetitive plumbing.

### 6) Auth-adjacent primitives

Postgres is not a complete auth product in a box, but row-level security, crypto utilities, and token-related patterns can cover more of the access-control side than I used to assume.

That matters because a lot of "auth" problems are really policy and data-access problems.

---

## What OpenAI's architecture made me rethink

The OpenAI engineering post was the biggest reason I wanted to write this at all, because it pushes back on the easy assumption that Postgres is only for smaller workloads.

OpenAI says PostgreSQL has been one of the critical under-the-hood data systems for ChatGPT and the API platform. Over the last year, their PostgreSQL load grew by more than 10x, and they describe scaling it to support read-heavy workloads for roughly 800 million ChatGPT users.

What stood out to me was not just the number. It was how much careful engineering went into making that work.

OpenAI describes a setup centered on:

- a single primary Azure PostgreSQL flexible server
- nearly 50 read replicas across regions
- aggressive read offloading
- PgBouncer for connection pooling
- cache-locking to avoid miss storms
- rate limiting across multiple layers
- workload isolation for noisy neighbors
- careful query tuning to avoid expensive joins and ORM-generated badness

That is what I found most interesting. It is not "Postgres magically scales." It is more like "Postgres can go very far when the workload shape is understood and the surrounding engineering is careful."

There is also an important limit in the same article.

OpenAI is explicit that PostgreSQL is not the answer to everything in their stack. They moved shardable, write-heavy workloads to systems like Azure Cosmos DB and now default new workloads there instead of piling every new table onto the existing PostgreSQL deployment.

That nuance felt important to me:

- Postgres can do more than I think many of us assume.
- Postgres still is not a free pass to ignore workload shape.

For read-heavy systems with good query discipline, replica strategy, caching, and connection management, it seems like it can go much further than a lot of people expect.

---

## The real takeaway

The interesting lesson to me is not "replace your whole tech stack with Postgres."

It is more "maybe we should slow down before adding new infrastructure."

Before buying another SaaS, I think it is worth asking:

- Can Postgres already do enough of this?
- Is the simpler architecture better for this stage of the product?
- Are we solving a real problem, or just copying a stack we saw somewhere?

I keep coming back to that because modern stacks can make it feel like every feature needs its own tool:

- search needs a search company
- AI needs a separate vector platform immediately
- every recurring job needs an external scheduler
- the database should only store rows and nothing more

Sometimes that is true. A lot of times, it might just be extra complexity.



---

## Credits

- Fireship, ["I replaced my entire tech stack with Postgres..."](https://www.youtube.com/watch?v=3JW732GrMdg)
- OpenAI, ["Scaling PostgreSQL to power 800 million ChatGPT users"](https://openai.com/index/scaling-postgresql/)
