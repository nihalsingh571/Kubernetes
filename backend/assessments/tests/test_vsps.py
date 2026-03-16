import pytest
from ml_engine.recommender import MicroAssessment

def test_vsps_calculation():
    """Test VSPS score calculation"""
    # Test perfect scores
    assessment = MicroAssessment(
        accuracy=1.0,
        speed_score=1.0,
        skip_penalty=0.0
    )
    vsps = assessment.vsps()
    # 0.6 * 1.0 + 0.3 * 1.0 - 0.1 * 0.0 = 0.6 + 0.3 - 0.0 = 0.9
    assert abs(vsps - 0.9) < 0.001

def test_vsps_with_penalties():
    """Test VSPS with penalties"""
    assessment = MicroAssessment(
        accuracy=0.8,
        speed_score=0.7,
        skip_penalty=0.1
    )
    vsps = assessment.vsps()
    # 0.6 * 0.8 + 0.3 * 0.7 - 0.1 * 0.1 = 0.48 + 0.21 - 0.01 = 0.68
    assert abs(vsps - 0.68) < 0.001

def test_vsps_clamping():
    """Test VSPS clamping to [0,1]"""
    # Test that VSPS is always within [0,1] bounds
    # Maximum possible VSPS with best scores
    assessment = MicroAssessment(
        accuracy=1.0,
        speed_score=1.0,
        skip_penalty=0.0
    )
    vsps = assessment.vsps()
    assert 0.0 <= vsps <= 1.0  # Should be within bounds
    assert abs(vsps - 0.9) < 0.001  # Maximum value

    # Test lower bound with worst scores
    assessment = MicroAssessment(
        accuracy=0.0,
        speed_score=0.0,
        skip_penalty=1.0  # Maximum penalty
    )
    vsps = assessment.vsps()
    assert 0.0 <= vsps <= 1.0  # Should be within bounds
    assert vsps == 0.0  # Minimum value

def test_vsps_normalization():
    """Test that values are normalized before calculation"""
    assessment = MicroAssessment(
        accuracy=1.5,  # Above 1.0
        speed_score=0.5,
        skip_penalty=-0.5  # Below 0.0
    )
    normalized = assessment.normalized()
    assert normalized.accuracy == 1.0
    assert normalized.speed_score == 0.5
    assert normalized.skip_penalty == 0.0

def test_vsps_zero_scores():
    """Test VSPS with all zero scores"""
    assessment = MicroAssessment(
        accuracy=0.0,
        speed_score=0.0,
        skip_penalty=0.0
    )
    vsps = assessment.vsps()
    # 0.6*0 + 0.3*0 - 0.1*0 = 0.0
    assert vsps == 0.0

def test_vsps_high_penalty():
    """Test VSPS with high penalty reducing score"""
    assessment = MicroAssessment(
        accuracy=1.0,
        speed_score=1.0,
        skip_penalty=1.0  # Maximum penalty
    )
    vsps = assessment.vsps()
    # 0.6*1 + 0.3*1 - 0.1*1 = 0.6 + 0.3 - 0.1 = 0.8
    assert abs(vsps - 0.8) < 0.001