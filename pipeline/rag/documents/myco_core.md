---
id: myco_core_architecture
title: Myco Core Architecture, Product Capabilities, and Pilot Workflow
access: public
version: 1.0.0
last_updated: 2026-10-26
---

# Myco Core Architecture & Product Capabilities

## 1. What is Myco?
Myco is an agentic code intelligence platform engineered for modern software development teams. Unlike traditional linters or code-review assistants that inspect isolated pull request diffs in a vacuum, Myco takes a **context-first** approach: it maps your full system architecture—including cross-file dependency graphs, data models, database schemas, API contracts, and security policies—before evaluating code changes.

By understanding system invariants before reasoning over the diff, Myco catches subtle, high-severity logical flaws that surface only when a change interacts with the broader codebase.

## 2. Core Capabilities and Differentiators
- **Context-First Reasoning**: Analyzes the blast radius of changes across the entire repository rather than merely checking syntax or styling.
- **P0 and P1 Blocker Detection**: Identifies critical risks such as:
  - Tool approval bypasses in autonomous AI coding loops (e.g. exponential backoff loops skipping mandatory approval gates).
  - Unindexed or breaking database queries impacting production scale.
  - Breaking API schema alterations and cross-service contract violations.
  - Silent concurrency race conditions and tenant isolation leaks.
- **Language & Stack Support**: Deep native analysis for TypeScript, JavaScript, Python, Go, Java, and SQL migrations, with active expansion to Rust and C#. Handles mono-repos, polyglot microservices, and multi-package architectures.
- **Interactive Playground**: Public interactive playground on the Myco website allowing developers to test real PR diffs and view context-aware evidence, policy traces, and suggested fixes without mandatory signup.

## 3. Developer Workflow & Integrations
- **GitHub App & CI/CD**: Seamlessly installs as a GitHub App or runs inside existing CI/CD pipelines (GitHub Actions, GitLab CI, Buildkite).
- **Inline PR Findings**: Posts structured, actionable findings directly on pull request lines, complete with:
  - Issue description and severity classification (P0 Blocker, P1 Critical, P2 Advisory).
  - Traceability to relevant architecture or PRD policies.
  - Suggested remediation patches ready for 1-click review.
- **Pre-Merge Quality Gate**: Can be configured as a required status check in GitHub branch protection rules to prevent high-severity architectural regressions from merging.

## 4. Evaluation Pilot & Pricing Plans
- **Team Plan**: $20 per developer per month, or $16 per developer per month billed annually ($192/year, 20% savings). Includes full review pipeline, unlimited reviews and repositories, dashboard and analytics, email/community support, and a 30-day free trial with no credit card required. LLM usage is paid separately via customer API key.
- **Enterprise Plan**: Custom pricing tailored to active developer seats, repository volume, and deployment architecture (cloud-managed SaaS or dedicated self-hosted VPC). Includes SSO/SAML, audit logs, custom connectors, advanced self-learning, and dedicated CSM.
- **30-Day Collaborative Trial & Pilot**: Teams can evaluate Myco on production pull requests. Paid seats are admin-approved; only developers whose PRs are reviewed need a seat.
- **How to Request a Pilot**: Engineering leaders can request a pilot via the "Request a pilot" button on the website, or by leaving their contact details directly with Myco Assistance.
