---
layout: post
title: What building real LLM systems taught me (that demos don’t)
date: 2025-12-28
category: System Design
featured: true
excerpt: The gap between a Twitter demo and production is usually latency, hallucination loops, and cost. Here is a breakdown of the unsexy middleware needed to make agents reliable.
---

I've spent the last year building agentic workflows for heavy data ingestion. The Twitter demos show the "happy path"—the agent perfectly calling the weather API. But in production, the API times out, the JSON is malformed, or the LLM decides to hallucinate a new parameter.

Here is what actually matters when shipping these systems.

## 1. The Middleware is the Product

The prompt is just specific configuration. The real intellectual property is the **state machine** wrapping that prompt. If you rely on the model to "figure out" control flow, you will fail.

> **Key Insight:** Treat LLM calls like flaky network requests. Wrap them in retry logic, validators, and circuit breakers. Never assume a 200 OK means the behavior was correct.

### Structured Outputs are Non-Negotiable

Never ask for text. Always ask for JSON, and validate it with Pydantic (or Zod) before it touches your business logic.

```python
# Do not do this
response = llm.invoke("Give me the user's age")

# Do this
class User(BaseModel):
    age: int = Field(..., gt=0)

chain = prompt | llm.with_structured_output(User)
try:
    user = chain.invoke(...)
except ValidationError:
    # Use a fallback or retry
    pass
```

## 2. Obsessing over Latency

Users will not wait 15 seconds for a "thinking..." spinner. If you are chaining 5 LLM calls, you are already too slow.

- **Parallelize:** If two steps don't depend on each other, run them async.
- **Speculative Decoding:** For simpler tasks, use smaller models (Llama-3-8B) to draft, and bigger ones to verify.
- **Optimistic UI:** Show the user the input is accepted instantly, process in background.

## Conclusion

The future isn't just "smarter models." It's robust engineering wrapper around stochastic components. That’s the job.
