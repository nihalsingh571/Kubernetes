# CareerLite — Hybrid ML Model & AI Presentation Guide

This document serves as a comprehensive guide for presenting the **CareerLite** recommendation system. It covers the technical architecture, mathematical formulas, implementation details, and common viva questions.

---

## 1. How the Hybrid ML Model Works

The CareerLite recommendation system is a **Multi-Layer Hybrid Model**. It doesn't just match keywords; it validates candidate performance and trust.

### The Three Pillars:
1.  **Semantic Match (TF-IDF + Cosine Similarity):**
    *   Converts student skills and internship descriptions into mathematical vectors.
    *   Calculates the "distance" between them to find the best contextual match.
2.  **VSPS (Verified Skill Performance Score):**
    *   A performance metric derived from real-time assessments.
    *   Weights: Accuracy (45%), Speed (20%), Difficulty (15%), Consistency (10%), and Recency (10%).
3.  **Trust Score (Verification Layer):**
    *   A 7-parameter credibility score that filters out fake listings and unreliable candidates.
    *   Factors: Recruiter Rating, Verification Status, Integrity (Proctoring), etc.

### Final Ranking Formula:
`Final Score = Semantic Similarity × VSPS × Trust Score`

---

## 2. Tools and Libraries Used

| Category | Tool / Library | Purpose |
| :--- | :--- | :--- |
| **Vectorization** | `scikit-learn` (TfidfVectorizer) | Converting text to numerical weights. |
| **Similarity Math** | `scikit-learn` (cosine_similarity) | Calculating overlap between candidate and job. |
| **Data Handling** | `NumPy` & `Pandas` | Fast mathematical operations and data processing. |
| **AI Generation** | `google-genai` (Gemini 2.0 Flash) | Generating adaptive MCQ questions. |
| **Backend Logic** | `Django REST Framework` | Orchestrating the data flow between ML engine and DB. |
| **Analysis** | `Matplotlib` & `Tabulate` | Generating performance charts and metrics for reports. |

---

## 3. Important Lines of Code (The "Brains" of the System)

### A. The VSPS Calculation (`recommender.py`)
This is the heart of the verified performance layer.
```python
base_performance = (
    0.45 * n.accuracy
    + 0.20 * n.speed_score
    + 0.15 * n.difficulty_score
    + 0.10 * n.consistency
    + 0.10 * n.recency_factor
)
penalty = n.skip_penalty * 0.15
raw_vsps = (base_performance - penalty) * n.integrity_factor
```

### B. AI Difficulty Adaptation (`gemini_generator.py`)
This logic ensures the system "learns" from the student and adapts.
```python
def determine_next_difficulty(last_accuracy: float) -> DifficultyLevel:
    if last_accuracy > 0.80:
        return 'hard'
    if last_accuracy < 0.50:
        return 'easy'
    return 'medium'
```

### C. The Recommendation Hook (`views.py`)
Where all scores are fused into the final ranking.
```python
# Final ranking score (proposal §5)
final_score = float(np.clip(cosine_sim * vsps_value * trust_score, 0.0, 1.0))
```

---

## 4. Detailed Notes for ML Model

### Why "Hybrid"?
It is hybrid because it combines **Content-Based Filtering** (TF-IDF) with **Performance-Based Ranking** (VSPS). Most systems only use Content-Based Filtering, which makes them easy to "game" with buzzwords. CareerLite requires you to *prove* you have the skill.

### The TF-IDF Logic:
*   **TF (Term Frequency):** How often a skill (e.g., "React") appears in a profile.
*   **IDF (Inverse Document Frequency):** Rare skills (e.g., "Kubernetes") are given more weight than common ones (e.g., "Communication").
*   **Cosine Similarity:** We treat profiles as vectors in a 1000-dimensional space. The "angle" between the student vector and the job vector determines the score.

### The Proctoring (Integrity) Layer:
We use a **Continuous Multiplier** instead of a binary fail. If a student switches tabs once, their `IntegrityFactor` drops to 0.85. This degrades their score without failing them immediately, allowing for accidental slips while heavily penalizing intentional cheating.

---

## 5. Viva Questions & Answers (Interview Prep)

**Q1: What is the benefit of using TF-IDF over simple keyword matching?**
*   **A:** Keyword matching is binary (Yes/No). TF-IDF provides a **weighted score**. It recognizes that "Kubernetes" is a more significant match than "Computer" because it is a rarer, more specific term across the entire platform.

**Q2: How does the system handle "cheating" during assessments?**
*   **A:** We use a real-time proctoring log. Each violation (like tab switching) reduces the `IntegrityFactor`. If a student has 3+ violations, they fail automatically. Otherwise, their VSPS is multiplied by 0.85 or 0.70, lowering their rank on the recruiter's list.

**Q3: Why did you choose Gemini 2.0 Flash for question generation?**
*   **A:** It offers a balance of high-quality reasoning (important for technical MCQ generation) and low latency. It allows us to generate adaptive, scenario-based "Hard" questions that a simple hardcoded database cannot provide.

**Q4: What is the 'Trust Score' and why is it important for recruiters?**
*   **A:** The Trust Score filters the "noise." A job might have a perfect skill match, but if the recruiter is unverified or has a low rating, the score drops. This protects students from spam and ensures recruiters see reliable candidates.

**Q5: What happens to a student's score if they don't take assessments for a long time?**
*   **A:** The `RecencyFactor` in the VSPS formula will gradually decrease toward 0. This ensures that the rankings favor active students with fresh, verified skills.

**Q6: Is this model scalable for millions of users?**
*   **A:** Yes. The TF-IDF and Cosine calculations are mathematically lightweight (matrix multiplication). By using `scikit-learn` and `NumPy`, the engine can rank thousands of internships for a student in milliseconds.

---

## 6. Presentation Checklist
- [ ] Show the `ML_MODEL_DOCUMENTATION.txt` for technical depth.
- [ ] Run `python -m ml_engine.recommender` to show a live scoring example.
- [ ] Open the `backend/res/` folder to show the **Evaluation Charts** (NDCG and Precision).
- [ ] Explain the **FinalScore** breakdown: `Cos (Skill) x VSPS (Ability) x Trust (Reliability)`.
