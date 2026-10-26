---
doc: scope
status: approved
---

# CausalTrace Lite

A visual debugging dashboard that helps agent developers trace a failed restaurant booking back to the earliest incorrect step.

## The Unique Kernel
The final failed action may only be a symptom. CausalTrace Lite compares the simulated trace with the expected correct trace, evaluates each stage against its expected behavior, and highlights the earliest incorrect step. It compares that diagnosis with a naive debugger that blames the last error.

## Who It's For
AI developers, especially beginners building multi-step agents with tools, who need to understand why an agent failed and currently have to inspect its steps themselves.

## The Core Loop
Choose a deterministic restaurant-booking failure scenario, follow the agent through Understand, Choose, and Execute, inspect each step, and compare the earliest-error diagnosis with last-error blame.

## Inspiration & Identity
An interactive debugging dashboard: visually clear, inspectable, and focused on explaining where a failure began. No specific product reference was provided.

## Why This Matters to the Learner
The learner is interested in how an agent's final error can hide an earlier misunderstanding. They want to improve the plan-first workflow and understand project decisions rather than blindly accept generated code.

## What "Working" Looks Like
A judge can open the proof of concept, select a restaurant-booking failure, inspect the three-stage timeline, and see both the earliest incorrect step and the naive last-error diagnosis in under a minute. The simulation is deterministic and requires no API key.

## The POC Boundary

**In scope**
- Exactly three deterministic restaurant-booking scenarios, with one primary failure originating in each stage: Understand, Choose, and Execute.
- An interactive timeline through Understand, Choose, and Execute, with inspectable stage details.
- Comparison of each simulated stage with its expected behavior to identify and explain the earliest incorrect step.
- A side-by-side or otherwise clear comparison with naive last-error diagnosis.
- A visually clear, locally runnable proof of concept that can be built and tested within the remaining hackathon time (target: about two hours).

## Later
- More scenario types or other agent domains.
- Broader workflow and visualization refinements after the core experience is demonstrated.

## Explicitly Cut
- Live LLM or agent API calls: deterministic simulation keeps the demo simple, predictable, and free to run without credentials.
- Real restaurant booking, external tools, or network integrations: the proof of concept demonstrates diagnosis, not booking services.
- Production-grade tracing, user accounts, persistence, or deployment: these are not needed to prove the core idea in a short hackathon.
