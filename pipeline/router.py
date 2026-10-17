"""
Central Pipeline Router and Lifecycle Orchestrator for Public Demo.

Orchestrates the public demo request lifecycle:
1. Gateway (Session Extraction, Identity Resolution, JSON Validation)
2. Security (SSRF URL Guard, Untrusted Code Sanitization)
3. Demo Quota & Deduplication (Idempotency cache, Run allowance, Anti-spam RPM, Concurrency)
4. Classification (Structural AST analysis: INTERNAL vs EXTERNAL_MYCO vs REJECTED)
5. Execution (Internal Engine vs Future Myco Backend Adapter)
6. Allowance Accounting (Record success & cache OR refund allowance on failure)
7. Normalization & Telemetry (Sanitization, Structured Audit Logging, Metrics)
"""

import time
from typing import Any, Dict, List, Optional

from pipeline.backend_adapter import (
    BackendProvider,
    BackendRoutingRequest,
    future_myco_adapter,
)
from pipeline.classifier import classifier
from pipeline.config import config
from pipeline.gateway import gateway
from pipeline.internal_engine import internal_engine
from pipeline.normalizer import response_normalizer
from pipeline.observability import StructuredLogger, metrics
from pipeline.quota import TokenEstimator, quota_service
from pipeline.security import SecurityManager
from pipeline.types import (
    CodeInputFile,
    NormalizedResponse,
    ProcessingRoute,
    UsageMetadata,
    UserContext,
)
from pipeline.word_validator import CustomCodeWordValidator


class PipelineRouter:
    """
    Central API Request Pipeline Orchestrator for Public Demo.
    """

    def __init__(self, backend_provider: Optional[BackendProvider] = None):
        self._backend_provider = backend_provider or future_myco_adapter

    def set_backend_provider(self, provider: BackendProvider):
        """Allows dynamic switching of backend providers (e.g. mock provider for tests)."""
        self._backend_provider = provider

    def execute(
        self,
        raw_body: bytes,
        headers: Dict[str, str],
        client_ip: str = "127.0.0.1",
    ) -> NormalizedResponse:
        """
        Executes end-to-end request pipeline for an incoming demo request.
        """
        start_time = time.time()
        request_id = StructuredLogger.generate_request_id()
        metrics.increment("requests_total")

        # -------------------------------------------------------------
        # Stage 1: API Gateway & Session Resolution
        # -------------------------------------------------------------
        user: UserContext = gateway.authenticate_request(headers, client_ip)
        session_key = quota_service.get_session_fingerprint(user.user_id, client_ip)

        is_valid, payload, error_msg = gateway.parse_and_validate_payload(raw_body)
        if not is_valid:
            metrics.increment("requests_rejected")
            return response_normalizer.normalize(
                request_id=request_id,
                status_code=400,
                success=False,
                route_executed="REJECTED",
                message=error_msg or "Invalid request payload.",
                findings=[],
                summary={"rejected": True},
                usage=UsageMetadata(0, 0, 0, 0, 0, 0.0, 0, 0, 0),
                quota_info=quota_service.get_allowance_info(session_key),
                errors=[error_msg or "Invalid JSON payload"],
            )

        payload = payload or {}

        # -------------------------------------------------------------
        # Stage 2: Security & SSRF Protection
        # -------------------------------------------------------------
        repo_url = payload.get("repoUrl") or payload.get("repo_url")
        if repo_url:
            valid_url, ssrf_err = SecurityManager.validate_repository_url(repo_url)
            if not valid_url:
                metrics.increment("requests_rejected")
                return response_normalizer.normalize(
                    request_id=request_id,
                    status_code=400,
                    success=False,
                    route_executed="REJECTED",
                    message=f"Security rejection: {ssrf_err}",
                    findings=[],
                    summary={"securityViolation": "SSRF_GUARD_TRIGGERED"},
                    usage=UsageMetadata(0, 0, 0, 0, 0, 0.0, 0, 0, 0),
                    quota_info=quota_service.get_allowance_info(session_key),
                    errors=[ssrf_err or "SSRF check failed"],
                )

        # -------------------------------------------------------------
        # Extract Code Inputs & Compute Metrics
        # -------------------------------------------------------------
        raw_code = payload.get("code") or ""
        raw_diff = payload.get("diff") or ""
        prd_text = payload.get("prd") or ""
        requested_features = payload.get("requestedFeatures") or payload.get("features") or []

        primary_file_dict = payload.get("primaryFile")
        primary_file: Optional[CodeInputFile] = None
        if primary_file_dict and isinstance(primary_file_dict, dict):
            primary_file = CodeInputFile(
                path=primary_file_dict.get("path", "code.ts"),
                content=SecurityManager.sanitize_untrusted_code(primary_file_dict.get("content", "")),
            )
        elif raw_code:
            primary_file = CodeInputFile(
                path="input.ts",
                content=SecurityManager.sanitize_untrusted_code(raw_code),
            )
        elif raw_diff:
            primary_file = CodeInputFile(
                path="pr.diff",
                content=SecurityManager.sanitize_untrusted_code(raw_diff),
            )

        context_files: List[CodeInputFile] = []
        for cf in payload.get("contextFiles", []):
            if isinstance(cf, dict):
                context_files.append(
                    CodeInputFile(
                        path=cf.get("path") or cf.get("name") or "context.json",
                        content=SecurityManager.sanitize_untrusted_code(cf.get("content", "")),
                    )
                )

        file_count = (1 if primary_file else 0) + len(context_files)
        total_chars = (len(primary_file.content) if primary_file else 0) + sum(len(f.content) for f in context_files)
        diff_lines = TokenEstimator.count_diff_lines(raw_diff)
        if primary_file and primary_file.path.endswith((".diff", ".patch")):
            diff_lines += TokenEstimator.count_diff_lines(primary_file.content)

        # Compute content hash for idempotency deduplication
        all_content_str = (raw_code or (primary_file.content if primary_file else "")) + raw_diff + prd_text
        content_hash = quota_service.compute_content_hash(all_content_str)

        # -------------------------------------------------------------
        # Stage 2.5: Custom Code Demo Word Limit Validation (1,000 - 1,200 words)
        # -------------------------------------------------------------
        is_sample_demo = bool(payload.get("isDemo") or payload.get("is_demo") or payload.get("isSample"))
        is_custom_submission = (
            payload.get("isCustomCode") is True
            or payload.get("isCustom") is True
            or payload.get("enforceWordLimit") is True
            or (payload.get("isDemo") is False and "isDemo" in payload)
            or (headers.get("x-validate-word-limit", "").lower() in ("true", "1"))
        )

        if is_custom_submission:
            code_to_validate = (raw_code or (primary_file.content if primary_file else "")) + (f"\n{raw_diff}" if raw_diff else "")
            word_valid, word_count, word_err = CustomCodeWordValidator.validate(code_to_validate)
            if not word_valid:
                metrics.increment("requests_rejected")
                StructuredLogger.log(
                    level="WARN",
                    event="WORD_LIMIT_REJECTION",
                    request_id=request_id,
                    data={
                        "sessionKey": session_key,
                        "wordCount": word_count,
                        "minWords": CustomCodeWordValidator.MIN_WORDS,
                        "maxWords": CustomCodeWordValidator.MAX_WORDS,
                        "rejectionReason": word_err,
                    },
                )
                return response_normalizer.normalize(
                    request_id=request_id,
                    status_code=400,
                    success=False,
                    route_executed="REJECTED",
                    message=word_err or "Word count validation failed.",
                    findings=[],
                    summary={
                        "wordLimitViolation": True,
                        "wordCount": word_count,
                        "minWords": CustomCodeWordValidator.MIN_WORDS,
                        "maxWords": CustomCodeWordValidator.MAX_WORDS,
                        "rejected": True,
                        "preservedCode": code_to_validate,
                    },
                    usage=UsageMetadata(0, 0, 0, 0, 0, 0.0, 0, 0, word_count),
                    quota_info=quota_service.get_allowance_info(session_key),
                    errors=[word_err or "Word count outside permitted range (1,000 - 1,200 words)"],
                )

        # -------------------------------------------------------------
        # Stage 3: Demo Allowance & Fair Usage Pre-Flight
        # -------------------------------------------------------------

        quota_check = quota_service.check_and_reserve(
            session_key=session_key,
            content_hash=content_hash,
            payload_bytes=len(raw_body),
            content_chars=total_chars,
            file_count=file_count,
            diff_lines=diff_lines,
            is_admin_bypass=user.is_admin,
            is_sample_demo=is_sample_demo,
        )

        # Idempotency hit: Return identical response without decrementing allowance
        if quota_check.is_cached and quota_check.cached_response:
            cached_res = dict(quota_check.cached_response)
            cached_res["requestId"] = request_id
            cached_res["message"] = "Result retrieved from deduplication cache (demo allowance preserved)."
            cached_res["quota"] = quota_service.get_allowance_info(session_key)
            return NormalizedResponse(
                request_id=request_id,
                status_code=cached_res.get("statusCode", 200),
                success=cached_res.get("success", True),
                route_executed=cached_res.get("routeExecuted", "INTERNAL"),
                message=cached_res["message"],
                findings=cached_res.get("findings", []),
                summary=cached_res.get("summary", {}),
                usage=cached_res.get("usage", {}),
                quota=cached_res["quota"],
                errors=[],
            )

        # If quota / rate limit / payload size violated
        if not quota_check.allowed:
            metrics.increment("quota_exceeded_total")
            if quota_check.status_code == 429:
                metrics.increment("rate_limited_total")

            StructuredLogger.log(
                level="WARN",
                event="DEMO_ALLOWANCE_REJECTION",
                request_id=request_id,
                data={
                    "sessionKey": session_key,
                    "errorCode": quota_check.error_code,
                    "limitType": quota_check.limit_type,
                    "current": quota_check.current_value,
                    "max": quota_check.max_limit,
                },
            )

            allowance_snapshot = quota_service.get_allowance_info(session_key)
            return response_normalizer.normalize(
                request_id=request_id,
                status_code=quota_check.status_code,
                success=False,
                route_executed="REJECTED",
                message=quota_check.message,
                findings=[],
                summary={
                    "quotaExceeded": True,
                    "errorCode": quota_check.error_code,
                    "resetAt": quota_check.reset_at,
                    "nextAction": quota_check.next_action,
                },
                usage=UsageMetadata(total_chars, 0, 0, diff_lines, file_count, 0.0, 0, 0, 0),
                quota_info=allowance_snapshot,
                errors=[quota_check.message],
            )

        # -------------------------------------------------------------
        # Stage 4: Request Classification & Path Determination
        # -------------------------------------------------------------
        classification = classifier.classify(
            primary_file=primary_file,
            context_files=context_files,
            raw_code=raw_code,
            raw_diff=raw_diff,
            repo_url=repo_url,
            pr_number=payload.get("prNumber"),
            requested_features=requested_features,
        )

        StructuredLogger.log(
            level="INFO",
            event="REQUEST_CLASSIFIED",
            request_id=request_id,
            data={
                "route": classification.route.value,
                "confidence": classification.confidence,
                "detectedFormat": classification.detected_format,
                "reason": classification.reason,
            },
        )

        # -------------------------------------------------------------
        # Stage 5: Execution Handling (Internal vs Future Myco Backend)
        # -------------------------------------------------------------
        findings: List[Dict[str, Any]] = []
        summary: Dict[str, Any] = {}
        status_code = 200
        success = True
        message = "Demo analysis completed successfully."
        route_executed = classification.route.value
        errors: List[str] = []

        try:
            if classification.route == ProcessingRoute.INTERNAL:
                metrics.increment("requests_internal")
                if not primary_file:
                    primary_file = CodeInputFile(path="code.ts", content="")

                internal_res = internal_engine.process(
                    primary_file=primary_file,
                    context_files=context_files,
                    prd_text=prd_text,
                )
                findings = internal_res.get("findings", [])
                summary = internal_res.get("summary", {})
                summary["route"] = "INTERNAL"
                summary["isClean"] = internal_res.get("isClean", True)
                summary["isMergeBlocking"] = internal_res.get("isMergeBlocking", False)
                message = "Analysis completed via internal AST engine."

            elif classification.route == ProcessingRoute.EXTERNAL_MYCO:
                metrics.increment("requests_external_myco")
                routing_req = BackendRoutingRequest(
                    request_id=request_id,
                    user_id=user.user_id,
                    org_id=user.org_id,
                    tier="demo",
                    target_repository=repo_url,
                    pr_number=payload.get("prNumber"),
                    primary_file=primary_file.to_dict() if primary_file else None,
                    context_files=[cf.to_dict() for cf in context_files],
                    diff_text=raw_diff,
                    requested_features=requested_features,
                    timeout_seconds=config.myco_backend_timeout_seconds,
                    client_metadata=payload.get("metadata", {}),
                )

                ext_res = self._backend_provider.route_request(routing_req)
                status_code = ext_res.status_code
                findings = ext_res.findings
                summary = ext_res.summary
                summary["provider"] = ext_res.provider_id
                summary["backendStatus"] = ext_res.status
                summary["requiresMyco"] = True
                message = ext_res.error_message or "External backend candidate processed."
                success = (status_code in (200, 201, 202))
                if ext_res.error_message:
                    errors.append(ext_res.error_message)

            else:  # REJECTED
                metrics.increment("requests_rejected")
                status_code = 400
                success = False
                message = classification.reason
                errors.append(classification.reason)
                summary = {"rejected": True, "classification": classification.to_dict()}

        except Exception as exc:
            metrics.increment("requests_rejected")
            status_code = 500
            success = False
            message = "An internal processing error occurred."
            errors.append(str(exc))
            StructuredLogger.log("ERROR", "PIPELINE_EXCEPTION", request_id, {"error": str(exc)})

        # -------------------------------------------------------------
        # Stage 6: Fair Usage Accounting (Success Deduction vs Failure Refund)
        # -------------------------------------------------------------
        duration_ms = (time.time() - start_time) * 1000.0

        if success and status_code in (200, 201):
            # Format normalized response to cache
            allowance_snapshot = quota_service.get_allowance_info(session_key)
            norm_res = response_normalizer.normalize(
                request_id=request_id,
                status_code=status_code,
                success=True,
                route_executed=route_executed,
                message=message,
                findings=findings,
                summary=summary,
                usage=UsageMetadata(total_chars, 0, 0, diff_lines, file_count, duration_ms, 0, 0, 0),
                quota_info=allowance_snapshot,
                errors=errors,
            )
            # Record run towards demo allowance and populate cache for deduplication
            quota_service.record_success_and_cache(
                session_key=session_key,
                content_hash=content_hash,
                response_data=norm_res.to_dict(),
                is_admin_bypass=user.is_admin,
                is_sample_demo=is_sample_demo,
            )
        else:
            # Release concurrency WITHOUT charging against the user's demo allowance!
            quota_service.release_on_failure(session_key)

        # -------------------------------------------------------------
        # Stage 7: Telemetry, Normalization & Return
        # -------------------------------------------------------------
        metrics.record_latency(route_executed, duration_ms)
        allowance_snapshot = quota_service.get_allowance_info(session_key)

        usage = UsageMetadata(
            character_count=total_chars,
            estimated_tokens=TokenEstimator.estimate_tokens(raw_code or (primary_file.content if primary_file else "")),
            actual_tokens=0,
            diff_lines=diff_lines,
            file_count=file_count,
            processing_time_ms=duration_ms,
            daily_quota_consumed=allowance_snapshot["usedRuns"],
            daily_quota_remaining=allowance_snapshot["remainingRuns"],
            rate_limit_remaining=allowance_snapshot["remainingRuns"],
        )

        StructuredLogger.log(
            level="INFO",
            event="PIPELINE_COMPLETE",
            request_id=request_id,
            data={
                "route": route_executed,
                "statusCode": status_code,
                "durationMs": round(duration_ms, 2),
                "findingsCount": len(findings),
            },
        )

        return response_normalizer.normalize(
            request_id=request_id,
            status_code=status_code,
            success=success,
            route_executed=route_executed,
            message=message,
            findings=findings,
            summary=summary,
            usage=usage,
            quota_info=allowance_snapshot,
            errors=errors,
        )


pipeline_router = PipelineRouter()
