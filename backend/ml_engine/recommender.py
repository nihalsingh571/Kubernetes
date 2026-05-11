from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    """Clamp a numeric value into the [minimum, maximum] interval.
    Guarantees all scores stay in [0, 1] as required by the proposal.
    """
    return max(minimum, min(maximum, value))


# ---------------------------------------------------------------------------
# VSPS — Verified Skill Performance Score  (proposal §3)
# ---------------------------------------------------------------------------

@dataclass
class MicroAssessment:
    """Represents a candidate's performance metrics used to compute VSPS.

    All input values are expected in [0, 1].

    Proposal §3.2 full formula:
        BasePerformance = (0.45 × accuracy)
                        + (0.20 × speed_score)
                        + (0.15 × difficulty_score)
                        + (0.10 × consistency)
                        + (0.10 × recency_factor)
        Penalty         = skip_rate × 0.15
        VSPS            = (BasePerformance − Penalty) × integrity_factor
    """

    accuracy: float
    speed_score: float
    skip_penalty: float  # Raw skip rate (0–1); proposal uses SkipRate × 0.15

    # Extended parameters aligned with proposal §3.1
    difficulty_score: float = 0.5   # avg difficulty weight of solved questions
    consistency: float = 0.5        # stability across recent attempts
    recency_factor: float = 1.0     # freshness of the assessment (0–1)
    integrity_factor: float = 1.0   # proctoring anti-cheat multiplier (0.7–1.0)

    def normalized(self) -> "MicroAssessment":
        """Return a copy with all fields clamped to [0, 1]."""
        return MicroAssessment(
            accuracy=_clamp(self.accuracy),
            speed_score=_clamp(self.speed_score),
            skip_penalty=_clamp(self.skip_penalty),
            difficulty_score=_clamp(self.difficulty_score),
            consistency=_clamp(self.consistency),
            recency_factor=_clamp(self.recency_factor),
            integrity_factor=_clamp(self.integrity_factor, 0.7, 1.0),
        )

    def vsps(self) -> float:
        """Compute Verified Skill Performance Score (VSPS).

        Exact weights from proposal §3.2:
            BasePerformance = (0.45 × Accuracy)
                            + (0.20 × Speed)
                            + (0.15 × DifficultyScore)
                            + (0.10 × Consistency)
                            + (0.10 × RecencyFactor)
            Penalty         = SkipRate × 0.15
            VSPS            = (BasePerformance − Penalty) × IntegrityFactor

        Final value is clamped to [0, 1].
        """
        n = self.normalized()
        base_performance = (
            0.45 * n.accuracy
            + 0.20 * n.speed_score
            + 0.15 * n.difficulty_score
            + 0.10 * n.consistency
            + 0.10 * n.recency_factor
        )
        penalty = n.skip_penalty * 0.15
        raw_vsps = (base_performance - penalty) * n.integrity_factor
        return _clamp(raw_vsps)


# ---------------------------------------------------------------------------
# Candidate & Internship data classes
# ---------------------------------------------------------------------------

@dataclass
class CandidateProfile:
    """Represents a candidate in the recommendation system.

    recency_score in [0, 1] (1 = very recent activity).
    """

    id: Optional[int]
    skills: List[str]
    micro_assessment: MicroAssessment
    recency_score: float = 1.0

    def normalized_recency(self) -> float:
        """Recency clamped to [0, 1]."""
        return _clamp(self.recency_score)

    def skills_as_text(self) -> str:
        """Represent skills as a single string for TF-IDF."""
        return " ".join(self.skills)


@dataclass
class Internship:
    """Represents an internship opportunity.

    recruiter_rating in [0, 1] — platform quality score.
    recency_score    in [0, 1] — freshness of the listing.
    is_verified      bool      — recruiter verification status.
    """

    id: Optional[int]
    title: str
    description: str
    recruiter_rating: Optional[float] = None
    recency_score: float = 1.0
    is_verified: bool = False

    def text_for_vectorization(self) -> str:
        """Combine title and description for TF-IDF."""
        return f"{self.title} {self.description}"


# ---------------------------------------------------------------------------
# Trust Score  (proposal §4)
# ---------------------------------------------------------------------------

@dataclass
class TrustParams:
    """All parameters required for the 7-component Trust Score.

    Proposal §4.2:
        TrustScore = (0.25 × recruiter_rating)
                   + (0.20 × verification_status)
                   + (0.15 × assessment_integrity)
                   + (0.10 × freshness)
                   + (0.10 × resume_consistency)
                   + (0.10 × completion_ratio)
                   + (0.10 × endorsement_reliability)
    """
    recruiter_rating: float = 0.7       # platform quality score for the recruiter
    verification_status: float = 0.5   # 1.0 if verified, 0.5 if unverified
    assessment_integrity: float = 1.0  # integrity_factor from latest assessment
    freshness: float = 1.0             # recency of assessment / listing
    resume_consistency: float = 0.5    # consistency of accuracy across attempts
    completion_ratio: float = 0.5      # completed applications / total applications
    endorsement_reliability: float = 0.8  # placeholder until endorsement system is built


class TrustCalculator:
    """Calculates Trust Score using the full 7-parameter formula (proposal §4.2).

    TrustScore = (0.25 × RecruiterRating)
               + (0.20 × VerificationStatus)
               + (0.15 × AssessmentIntegrity)
               + (0.10 × Freshness)
               + (0.10 × ResumeConsistency)
               + (0.10 × CompletionRatio)
               + (0.10 × EndorsementReliability)

    All inputs are clamped to [0, 1]; the result is also clamped to [0, 1].

    Note: endorsement_reliability defaults to 0.8 (neutral/good) until a
    full endorsement system is implemented.
    """

    def __init__(self, confidence_factor: float = 1.0) -> None:
        # confidence_factor allows external scaling of recruiter_rating trust.
        self.confidence_factor = _clamp(confidence_factor)

    def compute_trust(
        self,
        # Legacy positional args kept for backwards compat with evaluation pipeline
        accuracy: float = 0.0,
        recency: float = 1.0,
        recruiter_rating: Optional[float] = None,
        # Full proposal params — take precedence when supplied
        params: Optional[TrustParams] = None,
    ) -> float:
        """Compute trust score.

        Pass a ``TrustParams`` dataclass for the full 7-parameter formula.
        If only legacy args are supplied, the method falls back to a derived
        TrustParams so the formula structure is preserved.

        All inputs assumed in [0, 1]; result clamped to [0, 1].
        """
        if params is None:
            # Build a TrustParams from legacy arguments for backwards compat
            rr = _clamp(recruiter_rating) if recruiter_rating is not None else 0.7
            params = TrustParams(
                recruiter_rating=_clamp(rr * self.confidence_factor),
                verification_status=0.5,       # unknown — use neutral
                assessment_integrity=_clamp(accuracy),
                freshness=_clamp(recency),
                resume_consistency=0.5,
                completion_ratio=0.5,
                endorsement_reliability=0.8,
            )

        trust = (
            0.25 * _clamp(params.recruiter_rating)
            + 0.20 * _clamp(params.verification_status)
            + 0.15 * _clamp(params.assessment_integrity)
            + 0.10 * _clamp(params.freshness)
            + 0.10 * _clamp(params.resume_consistency)
            + 0.10 * _clamp(params.completion_ratio)
            + 0.10 * _clamp(params.endorsement_reliability)
        )
        return _clamp(trust)


# ---------------------------------------------------------------------------
# Recommendation Engine
# ---------------------------------------------------------------------------

class RecommendationEngine:
    """Core recommendation engine.

    - Builds TF-IDF vectors for candidate skills and internship descriptions.
    - Computes cosine similarity (TF-IDF) between candidate and each internship.
    - Combines cosine similarity, VSPS and TrustScore into a final score.

    Final formula (proposal §5):
        FinalScore = CosineSimilarity × VSPS × TrustScore
    """

    def __init__(self, trust_calculator: Optional[TrustCalculator] = None) -> None:
        self.vectorizer = TfidfVectorizer()
        self.trust_calculator = trust_calculator or TrustCalculator()

    def _build_tfidf(
        self,
        candidate: CandidateProfile,
        internships: List[Internship],
    ) -> np.ndarray:
        """Fit TF-IDF on candidate skills + internship descriptions.

        Returns an array of cosine similarity scores in [0, 1].
        """
        documents: List[str] = [candidate.skills_as_text()] + [
            internship.text_for_vectorization() for internship in internships
        ]

        tfidf_matrix = self.vectorizer.fit_transform(documents)

        candidate_vector = tfidf_matrix[0:1]
        internship_matrix = tfidf_matrix[1:]

        similarities = cosine_similarity(candidate_vector, internship_matrix)[0]
        similarities = np.clip(similarities, 0.0, 1.0)
        return similarities

    def recommend(
        self,
        candidate: CandidateProfile,
        internships: List[Internship],
        top_k: Optional[int] = None,
        completion_ratio: float = 0.5,
    ) -> List[Dict[str, Any]]:
        """Compute ranked recommendations.

        FinalScore = CosineSimilarity × VSPS × TrustScore  (proposal §5)
        All intermediate and final scores are clamped to [0, 1].

        Args:
            candidate:        Candidate profile with skills and assessment data.
            internships:      List of internship opportunities.
            top_k:            If set, return only the top-k results.
            completion_ratio: Fraction of submitted applications that were
                              completed/accepted — fed into TrustScore.

        Returns a list of dicts:
        {
            "internship":       Internship,
            "cosine_similarity": float,
            "vsps":             float,
            "trust_score":      float,
            "final_score":      float,
        }
        """
        if not internships:
            return []

        # VSPS — full proposal formula (recency from candidate profile)
        ma = candidate.micro_assessment
        vsps_assessment = MicroAssessment(
            accuracy=ma.accuracy,
            speed_score=ma.speed_score,
            skip_penalty=ma.skip_penalty,
            difficulty_score=ma.difficulty_score,
            consistency=ma.consistency,
            recency_factor=candidate.normalized_recency(),
            integrity_factor=ma.integrity_factor,
        )
        vsps_value = vsps_assessment.vsps()

        similarities = self._build_tfidf(candidate, internships)

        recommendations: List[Dict[str, Any]] = []

        for index, internship in enumerate(internships):
            cosine_sim = float(_clamp(float(similarities[index])))

            # Trust Score — full 7-parameter formula (proposal §4.2)
            verification_status = 1.0 if internship.is_verified else 0.5
            trust_params = TrustParams(
                recruiter_rating=_clamp(
                    (internship.recruiter_rating or 0.7) * self.trust_calculator.confidence_factor
                ),
                verification_status=verification_status,
                assessment_integrity=_clamp(ma.integrity_factor),
                freshness=_clamp(candidate.normalized_recency()),
                resume_consistency=_clamp(ma.consistency),
                completion_ratio=_clamp(completion_ratio),
                endorsement_reliability=0.8,  # placeholder — no endorsement system yet
            )
            trust_score = self.trust_calculator.compute_trust(params=trust_params)

            # Final ranking score (proposal §5)
            final_score = float(np.clip(cosine_sim * vsps_value * trust_score, 0.0, 1.0))

            recommendations.append(
                {
                    "internship": internship,
                    "cosine_similarity": cosine_sim,
                    "vsps": vsps_value,
                    "trust_score": trust_score,
                    "final_score": final_score,
                }
            )

        recommendations.sort(key=lambda item: item["final_score"], reverse=True)

        if top_k is not None:
            recommendations = recommendations[:top_k]

        return recommendations


# ---------------------------------------------------------------------------
# Quick smoke-test — run with: python -m ml_engine.recommender
# ---------------------------------------------------------------------------

def example_usage() -> None:
    """Standalone example demonstrating the full proposal formula."""
    candidate = CandidateProfile(
        id=1,
        skills=["Python", "Django", "REST API"],
        micro_assessment=MicroAssessment(
            accuracy=0.85,
            speed_score=0.70,
            skip_penalty=0.10,
            difficulty_score=0.80,
            consistency=0.75,
            recency_factor=0.90,
            integrity_factor=0.95,
        ),
        recency_score=0.9,
    )

    internships = [
        Internship(
            id=101,
            title="Backend Developer Intern",
            description="Work on REST APIs using Python and Django in a microservices architecture.",
            recruiter_rating=0.85,
            recency_score=0.95,
            is_verified=True,
        ),
        Internship(
            id=102,
            title="Data Science Intern",
            description="Use Python, Pandas, and machine learning techniques to analyze large datasets.",
            recruiter_rating=0.9,
            recency_score=0.8,
            is_verified=False,
        ),
        Internship(
            id=103,
            title="Frontend React Intern",
            description="Build user interfaces with React and Tailwind CSS.",
            recruiter_rating=None,
            recency_score=1.0,
            is_verified=False,
        ),
    ]

    engine = RecommendationEngine()
    results = engine.recommend(candidate, internships, completion_ratio=0.75)

    print("=== Proposal VSPS example (§3.3) ===")
    vsps = candidate.micro_assessment.vsps()
    print(f"VSPS = {vsps:.3f}  (proposal example target ~= 0.752)\n")

    print("=== Ranked Recommendations ===")
    for item in results:
        internship = item["internship"]
        print(
            f"{internship.title} (ID={internship.id}) -> "
            f"Final={item['final_score']:.4f}, "
            f"Cos={item['cosine_similarity']:.4f}, "
            f"VSPS={item['vsps']:.4f}, "
            f"Trust={item['trust_score']:.4f}",
        )


if __name__ == "__main__":
    example_usage()
