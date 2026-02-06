# Document Agent Selection Logic

## Summary

Document the current agent/model selection logic used by the book scanning system, including IP-based assignment for Quick scans, multi-model analysis for Deep scans, and Gemini quota management.

## Context

The system uses different AI models (OpenAI GPT-4o and Google Gemini) for generating content warnings. The selection logic varies based on:
- **Scan mode** (Quick vs Deep)
- **IP address** (deterministic assignment for Quick scans)
- **Gemini quota status** (daily usage limits)

This logic is currently implemented but not formally documented in the specification system. This change documents the existing behavior without modifying it.

## Scope

**In Scope:**
- IP-based model assignment for Quick scans
- Multi-model analysis for Deep scans
- Gemini quota management and threshold logic
- Deterministic hash-based assignment algorithm
- Model enablement flags and options

**Out of Scope:**
- Changing the selection logic (this is documentation only)
- Agent system (removed Dec 31, 2025; replaced with direct API calls)
- Rate limiting logic (separate concern)
- Model-specific analysis implementations

## Affected Capabilities

- **agent-selection** (new capability): Documents how models are selected for book analysis

## Non-Goals

- Modifying the selection algorithm
- Adding new models or agents
- Changing quota management behavior
- Restoring the old agent system

