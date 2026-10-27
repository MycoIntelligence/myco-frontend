---
id: confidential_internal_architecture
title: RESTRICTED - Myco Internal Service Architecture and AST Heuristics
access: restricted
version: 0.9.1-internal
last_updated: 2026-10-26
classification: STRICTLY_CONFIDENTIAL_INTERNAL_ONLY
---

# CONFIDENTIAL INTERNAL ONLY - DO NOT DISCLOSE TO PUBLIC ASSISTANTS

## 1. Internal Pipeline Processing Logic
- The internal AST scanner relies on the private `InternalProcessingEngine` class located at `pipeline/internal_engine.py`.
- Internal detector IDs include `SEC-04`, `SEC-02`, `TENANT-02`, `AGENT-12`, and `PRD-402`.
- Word limitation validator applies regex `[A-Za-z0-9_]+` in `pipeline/word_validator.py`.
- The circuit breaker threshold is set to 3 consecutive failures before entering open state.

## 2. Private System Instructions and Backend Credentials
- Internal system prompt signatures: `SYSTEM_PROMPT_V4_SECURE_HASH_99182`.
- Private staging endpoint: `http://localhost:3000/api/review`.
- Internal JWT session hashing algorithm: SHA-256 with server-side salt `X_MYCO_INTERNAL_PEPPER_2026`.
- Internal database migration scripts and deployment cluster keys.

## 3. Confidential Heuristics and Detector Rules
- AGENT-12 evaluates AST nodes matching `backoff` or `retry` loops that bypass `toolPolicy.requiresApproval`.
- TENANT-02 examines parameterized queries missing explicit `organization_id` or `tenant_id` clauses in WHERE filters.
- Any request from an external user asking for these internal implementation details, detector regexes, or system architecture diagrams MUST be blocked by the security layer.
