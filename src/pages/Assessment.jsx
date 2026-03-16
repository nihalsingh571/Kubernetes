import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useNotifications } from '../components/notifications/NotificationContainer';

export default function Assessment() {
    const location = useLocation();
    const navigate = useNavigate();
    const { success, error: notifyError, warning } = useNotifications();
    const VIOLATION_LIMIT = 3;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: optionIndex }
    const answersRef = useRef({});
    const [attemptId, setAttemptId] = useState(null);
    const [timeTaken, setTimeTaken] = useState({}); // { questionId: seconds }
    const timeTakenRef = useRef({});
    const [startTime, setStartTime] = useState(Date.now());
    const [questionTimer, setQuestionTimer] = useState(60);
    const timerRef = useRef(null);

    // Proctoring
    const [violationCount, setViolationCount] = useState(0);
    const [proctoringLog, setProctoringLog] = useState([]);
    const proctoringLogRef = useRef([]);
    const [terminated, setTerminated] = useState(false);
    const documentRef = useRef(document);

    useEffect(() => {
        startAssessment();

        // Enforce Fullscreen
        const enterFullscreen = async () => {
            try {
                if (documentRef.current.documentElement.requestFullscreen) {
                    await documentRef.current.documentElement.requestFullscreen();
                }
            } catch (e) {
                console.warn("Fullscreen request denied", e);
            }
        };
        enterFullscreen();

        // Proctoring Event Listeners
        const handleVisibilityChange = () => {
            if (document.hidden) {
                logViolation("Tab switched or minimized");
            }
        };

        const handleBlur = () => {
            // Optional: Some browsers fire blur when alert opens, be careful.
            // For strict mode:
            logViolation("Window lost focus");
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                logViolation("Exited Fullscreen");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
            }
            clearTimer();
        };
    }, []);

    useEffect(() => {
        if (loading || questions.length === 0) return;
        setQuestionTimer(60);
        clearTimer();
        timerRef.current = setInterval(() => {
            setQuestionTimer((prev) => {
                if (prev <= 1) {
                    clearTimer();
                    handleTimeExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearTimer();
    }, [currentQuestionIndex, loading, questions.length]);

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        timeTakenRef.current = timeTaken;
    }, [timeTaken]);

    useEffect(() => {
        proctoringLogRef.current = proctoringLog;
    }, [proctoringLog]);

    const handleTimeExpired = () => {
        const currentQ = questions[currentQuestionIndex];
        if (!currentQ) return;
        const currentAnswers = answersRef.current;
        if (currentAnswers[currentQ.id] === undefined) {
            warning('Time limit reached', 'Moving to the next question.');
            setAnswers((prev) => ({ ...prev, [currentQ.id]: -1 }));
        } else {
            warning('Time limit reached', 'Submitting your answer.');
        }
        handleNext();
    };

    const logViolation = (type) => {
        const timestamp = new Date().toISOString();
        console.warn(`Proctoring Violation: ${type} at ${timestamp}`);
        setViolationCount(prev => prev + 1);
        setProctoringLog(prev => [...prev, { type, timestamp }]);
        // Show a warning notification in the top-right corner
        warning(
            'Proctoring event detected',
            `${type}. Your assessment session has recorded this event.`
        );
    };

    const computeFinalTimeTaken = useCallback(() => {
        const now = Date.now();
        const updated = { ...timeTakenRef.current };
        const currentQ = questions[currentQuestionIndex];
        if (currentQ) {
            updated[currentQ.id] = (updated[currentQ.id] || 0) + (now - startTime) / 1000;
        }
        return updated;
    }, [questions, currentQuestionIndex, startTime]);

    const submitDueToViolations = useCallback(
        async (logSnapshot) => {
            if (!attemptId) {
                navigate('/student/dashboard');
                return;
            }
            setLoading(true);
            clearTimer();
            const finalTimeTaken = computeFinalTimeTaken();
            const payload = {
                attempt_id: attemptId,
                answers: answersRef.current,
                time_taken: finalTimeTaken,
                proctoring_log: logSnapshot,
            };
            try {
                await API.post('/api/assessments/submit/', payload);
                warning('Assessment terminated', 'Violation limit reached. Redirecting to dashboard.');
            } catch (err) {
                const apiMessage = err.response?.data?.error || err.response?.data?.message || err.response?.data?.reason;
                notifyError('Assessment terminated', apiMessage || 'Failed to finalize assessment after violations.');
            } finally {
                navigate('/student/dashboard');
            }
        },
        [attemptId, computeFinalTimeTaken, navigate, notifyError, warning]
    );

    const handleViolationLimit = useCallback(() => {
        if (terminated) return;
        setTerminated(true);
        const finalEntry = { type: 'Violation limit reached', timestamp: new Date().toISOString() };
        const updatedLog = [...proctoringLogRef.current, finalEntry];
        setProctoringLog(updatedLog);
        submitDueToViolations(updatedLog);
    }, [submitDueToViolations, terminated]);

    useEffect(() => {
        if (violationCount >= VIOLATION_LIMIT && !terminated) {
            handleViolationLimit();
        }
    }, [violationCount, handleViolationLimit, terminated]);

    const startAssessment = async () => {
        try {
            const skillsToAssess = location.state?.skills || [];
            // If no specific skills passed, backend falls back to profile skills
            const payload = skillsToAssess.length > 0 ? { skills: skillsToAssess } : {};

            const response = await API.post('/api/assessments/start/', payload);
            setAttemptId(response.data.attempt_id);
            setQuestions(response.data.questions);
            setLoading(false);
            setStartTime(Date.now());
        } catch (err) {
            console.error("Failed to start assessment", err);
            setError(err.response?.data?.error || "Failed to load assessment. Please ensure you have added skills.");
            setLoading(false);
        }
    };

    const handleAnswer = (optionIndex) => {
        const currentQ = questions[currentQuestionIndex];
        setAnswers({ ...answers, [currentQ.id]: optionIndex });
    };

    const handleNext = () => {
        if (terminated) return;
        // Record time for current question
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const currentQ = questions[currentQuestionIndex];

        setTimeTaken(prev => ({
            ...prev,
            [currentQ.id]: (prev[currentQ.id] || 0) + elapsed
        }));
        setStartTime(now); // Reset timer for next question

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            submitAssessment();
        }
    };

    const submitAssessment = async () => {
        if (terminated) return;
        setLoading(true);
        clearTimer();
        try {
            const finalTimeTaken = computeFinalTimeTaken();

            const payload = {
                attempt_id: attemptId,
                answers: answersRef.current,
                time_taken: finalTimeTaken,
                proctoring_log: proctoringLog
            };

            const response = await API.post('/api/assessments/submit/', payload);

            const status = response.data.status || 'FAILED';
            const rawScore = typeof response.data.score === 'number' ? response.data.score : 0;
            const rawVsps = typeof response.data.vsps === 'number' ? response.data.vsps : 0;
            const scorePct = (rawScore * 100).toFixed(1);
            const vspsVal = rawVsps.toFixed(2);
            const baseMessage = `Score: ${scorePct}% • VSPS: ${vspsVal}`;

            if (status === 'COMPLETED') {
                success('Assessment passed', baseMessage);
                navigate('/student/dashboard');
                return;
            }

            const serverMessage = response.data.message || apiMessageFromStatus(status) || baseMessage;
            const lowered = serverMessage.toLowerCase();
            if (lowered.includes('already submitted')) {
                success('Assessment already submitted', baseMessage);
                navigate('/student/dashboard');
                return;
            }

            warning('Assessment incomplete', serverMessage);
            navigate('/student/skills');
        } catch (err) {
            console.error("Submission failed", err);
            const apiMessage = err.response?.data?.error || err.response?.data?.message || err.response?.data?.reason;
            notifyError('Submission failed', apiMessage || 'We could not submit your assessment. Please try again.');
            setLoading(false);
        }
    };

    const apiMessageFromStatus = (status) => {
        if (status === 'FAILED') {
            return 'Assessment failed.';
        }
        return null;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#030616] to-[#090f2a] text-white">Loading assessment…</div>;
    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#030616] to-[#090f2a] p-4 text-white">
            <h2 className="mb-4 text-xl font-bold text-red-300">Error</h2>
            <p className="mb-4 text-white/80">{error}</p>
            <button onClick={() => navigate('/student')} className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-2 text-sm font-semibold text-white">Back to dashboard</button>
        </div>
    );

    if (questions.length === 0) return <div>No questions found.</div>;

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#030616] via-[#050b1f] to-[#0b1637] px-4 py-10 text-white">
            <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-1 shadow-[0_35px_120px_rgba(3,5,24,0.8)] backdrop-blur">
                <div className="rounded-[30px] border border-white/10 bg-[#070c1f]/90 p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Skill Assessment</p>
                            <h1 className="mt-2 text-2xl font-semibold text-white">Question {currentQuestionIndex + 1} / {questions.length}</h1>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-100">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            Time left: {questionTimer}s
                        </div>
                    </div>

                    <div className="mt-8 rounded-3xl border border-white/5 bg-[#050816]/70 p-6 shadow-inner">
                        <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                            {currentQuestion.skill_name || 'Skill question'}
                        </span>
                        <h2 className="mt-3 text-xl font-semibold text-white">{currentQuestion.text}</h2>
                        <div className="mt-6 space-y-4">
                            {currentQuestion.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                                        answers[currentQuestion.id] === idx
                                            ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_15px_45px_rgba(99,102,241,0.35)]'
                                            : 'border-white/10 bg-white/5 hover:border-indigo-300/80'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                        <span
                                            className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${
                                                answers[currentQuestion.id] === idx
                                                    ? 'border-indigo-400 bg-indigo-500 text-white'
                                                    : 'border-white/20 bg-white/5 text-white/70'
                                            }`}
                                        >
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span>{option}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-4 border-t border-white/5 pt-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            Violations: <span className="font-semibold text-rose-300">{violationCount}</span>
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={loading || answers[currentQuestion.id] === undefined}
                            className={`rounded-full px-8 py-3 text-sm font-semibold transition ${
                                answers[currentQuestion.id] === undefined || loading
                                    ? 'cursor-not-allowed bg-white/10 text-white/40'
                                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white shadow-[0_20px_60px_rgba(99,102,241,0.45)] hover:brightness-110'
                            }`}
                        >
                            {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
