"""
Custom Code Word Limit Validator for Demo Submissions.

Implements word counting and boundary validation for custom code submissions:
- Maximum: 1,200 words.
- Permitted range: 0 <= word_count <= 1,200 (inclusive).
- Consistent token-based algorithm: [A-Za-z0-9_]+
  - Identifiers, keywords, numbers, and string tokens are words.
  - Punctuation, symbols, and whitespace are token separators.
  - Matches frontend JavaScript implementation exactly.
"""

import re
from typing import Optional, Tuple

WORD_PATTERN = re.compile(r"[A-Za-z0-9_]+")

MIN_CUSTOM_CODE_WORDS = 0
MAX_CUSTOM_CODE_WORDS = 1200


class CustomCodeWordValidator:
    """Validates word boundaries for demo custom code submissions."""

    MIN_WORDS: int = MIN_CUSTOM_CODE_WORDS
    MAX_WORDS: int = MAX_CUSTOM_CODE_WORDS

    @staticmethod
    def count_words(text: str) -> int:
        """
        Counts words in code or text using a consistent token-based algorithm:
        - Words are contiguous sequences of alphanumeric characters and underscores [A-Za-z0-9_]+.
        - Whitespace and punctuation are treated as token separators.
        - Empty or whitespace-only text returns 0.
        """
        if not text or not isinstance(text, str):
            return 0
        return len(WORD_PATTERN.findall(text))

    @classmethod
    def validate(cls, text: str) -> Tuple[bool, int, Optional[str]]:
        """
        Validates whether code satisfies the demo word limits (0 - 1,200 words).

        Returns:
            Tuple of (is_valid: bool, word_count: int, error_message: Optional[str])
        """
        count = cls.count_words(text)

        if count > cls.MAX_WORDS:
            excess = count - cls.MAX_WORDS
            return (
                False,
                count,
                f"Submission rejected: code contains {count:,} words, which exceeds the maximum limit of {cls.MAX_WORDS:,} words. "
                f"Please remove at least {excess:,} words (allowed range: 0 – {cls.MAX_WORDS:,} words).",
            )

        return True, count, None
