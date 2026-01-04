import React, { useState } from 'react';
import axios from 'axios';
import { HelpCircle, CheckCircle, XCircle, RefreshCw, Trophy, ArrowRight } from 'lucide-react';

const Quiz = ({ initialDoc }) => {
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showFinalScore, setShowFinalScore] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sourceDoc, setSourceDoc] = useState('');

    React.useEffect(() => {
        if (initialDoc) {
            generateQuiz(initialDoc);
        }
    }, [initialDoc]);

    const generateQuiz = async (docId = null) => {
        setLoading(true);
        resetQuiz();

        try {
            const payload = docId ? { docId } : { topic: "General" };
            const response = await axios.post('http://localhost:8080/api/v1/quiz', payload);

            if (response.data.quiz && response.data.quiz.length > 0) {
                setQuizQuestions(response.data.quiz);
                setSourceDoc(response.data.source || 'Unknown Source');
            } else {
                alert("Could not generate a quiz from this document. It might be too short.");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate quiz. Backend error.");
        }
        setLoading(false);
    };

    const resetQuiz = () => {
        setQuizQuestions([]);
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowFinalScore(false);
        setSelectedOption(null);
        setIsAnswered(false);
    };

    const handleOptionClick = (option) => {
        if (isAnswered) return;

        setSelectedOption(option);
        setIsAnswered(true);

        const currentQ = quizQuestions[currentQuestionIndex];
        if (option === currentQ.correct) {
            setScore(score + 1);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setShowFinalScore(true);
        }
    };

    if (loading) {
        return (
            <div className="container flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
                <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
                <p>Generating a unique quiz for you...</p>
            </div>
        );
    }

    if (showFinalScore) {
        return (
            <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
                <div className="card" style={{ padding: '3rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1.5rem', borderRadius: '50%', backgroundColor: '#fef9c3', color: '#ca8a04', marginBottom: '1.5rem' }}>
                        <Trophy size={48} />
                    </div>
                    <h2 className="title">Quiz Completed!</h2>
                    <p style={{ fontSize: '1.25rem', margin: '1rem 0' }}>
                        You scored <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{score}</span> out of <span style={{ fontWeight: 700 }}>{quizQuestions.length}</span>
                    </p>
                    <div style={{ marginTop: '2rem' }}>
                        <button className="btn" onClick={() => generateQuiz(initialDoc || sourceDoc)}>
                            Take Another Quiz
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (quizQuestions.length === 0) {
        return (
            <div className="container">
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h1 className="title">Knowledge Check</h1>
                    <p className="subtitle">Test your understanding with AI-generated quizzes.</p>
                </div>
                <div className="card flex flex-col items-center justify-center p-8">
                    <HelpCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <button className="btn" onClick={() => generateQuiz()}>Start Random Quiz</button>
                </div>
            </div>
        );
    }

    const currentQ = quizQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="title" style={{ fontSize: '1.5rem' }}>Quiz: {sourceDoc}</h1>
                    <p className="subtitle">Question {currentQuestionIndex + 1} of {quizQuestions.length}</p>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Score: {score}</div>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '2rem' }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary-color)', borderRadius: '3px', transition: 'width 0.3s ease' }}></div>
            </div>

            <div className="card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', lineHeight: '1.5' }}>
                    {currentQ.question}
                </h2>

                <div className="flex flex-col gap-3">
                    {currentQ.options.map((option, idx) => {
                        let style = {
                            padding: '1rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            cursor: isAnswered ? 'default' : 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        };

                        if (isAnswered) {
                            if (option === currentQ.correct) {
                                style.backgroundColor = '#ecfdf5'; // green
                                style.borderColor = 'var(--success-color)';
                            } else if (option === selectedOption && option !== currentQ.correct) {
                                style.backgroundColor = '#fef2f2'; // red
                                style.borderColor = 'var(--error-color)';
                            }
                        } else if (selectedOption === option) {
                            // Selected state before answer reveal (not applicable here as we reveal immediately)
                        } else {
                            // Default hover
                            style[':hover'] = { backgroundColor: 'var(--bg-color)' }; // This doesn't work in inline style, handled by className usually
                        }

                        return (
                            <div
                                key={idx}
                                onClick={() => handleOptionClick(option)}
                                style={style}
                                className={!isAnswered ? "hover:bg-gray-50" : ""}
                            >
                                <span style={{ fontWeight: 500 }}>{option}</span>
                                {isAnswered && option === currentQ.correct && <CheckCircle size={20} style={{ color: 'var(--success-color)' }} />}
                                {isAnswered && option === selectedOption && option !== currentQ.correct && <XCircle size={20} style={{ color: 'var(--error-color)' }} />}
                            </div>
                        );
                    })}
                </div>

                {isAnswered && (
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={handleNext} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Results'} <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Quiz;
