---
id: security_and_privacy_architecture
title: Myco Security Architecture, Data Privacy, and Compliance Posture
access: public
version: 1.0.0
last_updated: 2026-10-26
---

# Myco Security Architecture, Data Privacy & Compliance

## 1. Zero Model Training Policy
Myco enforces a strict and non-negotiable data privacy policy: **Myco never trains public or foundational AI models on customer source code or pull request data**. Customer code, diffs, architectural schemas, and analysis artifacts remain strictly isolated to the customer's authenticated tenant and are discarded after analysis or retained solely per enterprise contract retention policies.

## 2. Infrastructure & Data Isolation
- **Tenant Isolation**: Every enterprise organization is assigned dedicated tenant boundaries. Data from one organization is cryptographically segregated and never accessible to another.
- **Dedicated VPC & Self-Hosted Options**: For enterprise customers with strict regulatory requirements (e.g. financial institutions, defense, healthcare), Myco supports deployment within single-tenant private cloud instances or self-hosted VPCs with zero data egress.
- **Encryption**:
  - In Transit: All communications utilize TLS 1.3 encryption.
  - At Rest: Stored analysis metadata and configuration artifacts are encrypted with AES-256.

## 3. Secret Redaction & In-Flight Masking
Before any source code or diff is processed by reasoning engines, Myco's pipeline runs automated regex and entropy scanning to redact sensitive credentials, including:
- Cloud provider keys (AWS Access Keys `AKIA...`, Google Cloud Service Accounts, Azure Client Secrets).
- Source control tokens (GitHub PATs `ghp_...`, fine-grained PATs `github_pat_...`).
- Payment and service keys (Stripe Secret Keys `sk_live_...`, Slack Bot Tokens `xoxb-...`).
- Private cryptographic keys (`-----BEGIN PRIVATE KEY-----`).
- Generic JWT and Bearer tokens.
Redacted secrets are masked with safe placeholder tokens before any external reasoning call occurs.

## 4. Compliance & Certifications
- **SOC 2 Type II Controls**: Audited operational, availability, and confidentiality controls.
- **Least-Privilege GitHub Permissions**: When integrating as a GitHub App, Myco requests only read permissions on repository contents and pull requests, and write permissions strictly for posting review comments and check runs.
- **Audit Logging**: Comprehensive operational logging of scan events, timestamps, and findings without retaining sensitive proprietary source code.
