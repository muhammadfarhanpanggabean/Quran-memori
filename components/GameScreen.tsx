import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, Question, GameMode } from '../types';
import { generateQuestions } from '../services/geminiService';
import { QUESTION_TIME_LIMIT } from '../constants';
import { CORRECT_ANSWER_SOUND, INCORRECT_ANSWER_SOUND, BUTTON_CLICK_SOUND } from '../sounds';
import { useSound } from '../hooks/useSound';

interface GameScreenProps {
  juz: number[];
  difficulty: Difficulty;
  numberOfQuestions: number;
  gameMode: GameMode;
  onGameEnd: (score: number) => void;
  motivationalQuote: string;
  isMuted: boolean;
}

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
);

const GameScreen: React.FC<GameScreenProps> = ({ juz, difficulty, numberOfQuestions, gameMode, onGameEnd, motivationalQuote, isMuted }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const scoreRef = useRef(score);
  
  const playCorrectSound = useSound(CORRECT_ANSWER_SOUND, isMuted);
  const playIncorrectSound = useSound(INCORRECT_ANSWER_SOUND, isMuted);
  const playClickSound = useSound(BUTTON_CLICK_SOUND, isMuted);


  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const getDailyChallengeDate = () => gameMode === 'Tantangan Harian' ? new Date().toISOString().split('T')[0] : undefined;

  const fetchQuestions = useCallback(async () => {
    playClickSound();
    setIsLoading(true);
    setError(null);
    setIsPermissionError(false);
    try {
      const dailyDate = getDailyChallengeDate();
      const fetchedQuestions = await generateQuestions(juz, difficulty, numberOfQuestions, gameMode, dailyDate);
      setQuestions(fetchedQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setSubmitted(false);
      setTimeLeft(QUESTION_TIME_LIMIT);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      if (errorMessage.includes('PERMISSION_DENIED')) {
        setError("Izin ditolak. Kunci API Anda mungkin tidak valid atau memerlukan penagihan. Silakan pilih kunci yang valid dan coba lagi.");
        setIsPermissionError(true);
      } else {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui');
        setIsPermissionError(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [juz, difficulty, numberOfQuestions, gameMode, playClickSound]);

  useEffect(() => {
    fetchQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSelectNewKey = async () => {
    playClickSound();
    try {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        await fetchQuestions();
    } catch (error) {
        console.error("Error opening key selection:", error);
        setError("Gagal membuka dialog pemilihan kunci. Silakan segarkan halaman.");
    }
  };

  const handleNext = useCallback(() => {
    playClickSound();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      setTimeLeft(QUESTION_TIME_LIMIT);
    } else {
      onGameEnd(scoreRef.current);
    }
  }, [currentQuestionIndex, questions.length, onGameEnd, playClickSound]);

  const handleTimeUp = useCallback(() => {
    setSubmitted(true);
    setTimeout(() => {
        handleNext();
    }, 2000);
  }, [handleNext]);

  useEffect(() => {
    if (isLoading || submitted) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
    }

    timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
            if (prevTime <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                handleTimeUp();
                return 0;
            }
            return prevTime - 1;
        });
    }, 1000);

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, submitted, handleTimeUp]);

  const handleAnswerSelect = (option: string) => {
    if (submitted) return;
    playClickSound();
    setSelectedAnswer(option);
  };
  
  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;
    playClickSound();
    if (timerRef.current) clearInterval(timerRef.current);

    setSubmitted(true);
    if (selectedAnswer === questions[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 20);
      setShowScoreAnimation(true);
      playCorrectSound();
      setTimeout(() => setShowScoreAnimation(false), 700);
    } else {
      playIncorrectSound();
    }
  };
  
  const getButtonClass = (option: string) => {
    const isSelected = option === selectedAnswer;

    if (!submitted) {
        return isSelected
          ? 'bg-teal-500 text-white border-teal-600 ring-2 ring-teal-300 active:scale-[0.98]'
          : 'bg-slate-100 border-slate-200 hover:border-teal-400 hover:bg-teal-50 hover:scale-[1.03] active:scale-[0.98]';
    }

    const isCorrect = option === currentQuestion.correctAnswer;
    
    if (isCorrect) {
        return 'bg-green-500 text-white border-green-600 transform scale-105';
    }
    if (isSelected && !isCorrect) {
        return 'bg-red-500 text-white border-red-600';
    }
    return 'bg-slate-200 border-slate-300 opacity-70 cursor-not-allowed';
  };

  if (isLoading) {
    return <div className="text-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto"></div>
        <p className="mt-4 text-lg">Menyiapkan pertanyaan...</p>
    </div>;
  }

  if (error) {
    return <div className="text-center p-8 bg-red-100 border border-red-400 rounded-lg">
        <p className="text-red-700 font-semibold">Oops! Terjadi Kesalahan</p>
        <p className="text-red-600 mt-2">{error}</p>
        {isPermissionError ? (
            <button onClick={handleSelectNewKey} className="mt-4 bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-transform transform active:scale-95">
                Pilih Kunci API
            </button>
        ) : (
            <button onClick={fetchQuestions} className="mt-4 bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-transform transform active:scale-95">
                Coba Lagi
            </button>
        )}
    </div>;
  }

  if (questions.length === 0) {
    return <div className="text-center p-8">Tidak ada pertanyaan yang dapat dibuat.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const optionLabels = ['A', 'B', 'C', 'D'];
  const timeColor = timeLeft <= 5 ? 'text-red-500' : 'text-slate-700';
  
  let currentModeForQuestion = gameMode;
  if(gameMode === 'Tantangan Harian'){
    const today = new Date();
    const day = today.getDate();
    if(day % 3 === 1) currentModeForQuestion = 'Tebak Surah';
    else if(day % 3 === 2) currentModeForQuestion = 'Isi Ayat';
    else currentModeForQuestion = 'Pilihan Ganda';
  }

  const isTebakSurah = currentModeForQuestion === 'Tebak Surah';
  const isArabicQuestionText = currentModeForQuestion === 'Tebak Surah' || currentModeForQuestion === 'Isi Ayat';
  const isArabicOption = currentModeForQuestion === 'Pilihan Ganda' || currentModeForQuestion === 'Isi Ayat';


  return (
    <>
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full animate-fade-in border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <div className="relative text-lg font-bold">
                    Skor: <span className="text-teal-500">{score}</span>
                    {showScoreAnimation && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-2xl font-bold text-green-500 animate-score-pulse pointer-events-none">
                            +20
                        </span>
                    )}
                </div>
                <div className={`flex items-center text-lg font-bold ${timeColor}`}>
                    <ClockIcon />
                    <span>{timeLeft}</span>
                </div>
                <div className="text-lg font-semibold">{currentQuestionIndex + 1} / {questions.length}</div>
            </div>
            <div className="mb-6 p-4 bg-slate-100 rounded-lg">
                {isTebakSurah && <p className="text-lg text-center font-medium mb-3">Dari surah manakah ayat berikut?</p>}
                {currentModeForQuestion === 'Isi Ayat' && <p className="text-lg text-center font-medium mb-3">Lengkapi bagian yang kosong pada ayat berikut:</p>}
                <p 
                    className={`text-xl text-center font-medium ${isArabicQuestionText ? 'font-serif' : ''}`}
                    dir={isArabicQuestionText ? 'rtl' : 'auto'}
                >
                    {currentQuestion.questionText}
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={submitted}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center text-left ${getButtonClass(option)}`}
                    >
                        <span className="font-sans font-bold text-lg mr-4 bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center">{optionLabels[index]}</span>
                        <span 
                            dir={isArabicOption ? 'rtl' : 'ltr'} 
                            lang={isArabicOption ? 'ar' : 'id'}
                            className={`flex-1 ${isArabicOption ? 'font-serif text-xl text-right' : 'font-sans text-lg'}`}
                        >
                            {option}
                        </span>
                    </button>
                ))}
            </div>
            
            {submitted && (
                <div className="mt-4 p-4 rounded-lg bg-slate-100 text-center animate-fade-in">
                    <h4 className="font-semibold">Referensi Jawaban Benar:</h4>
                    <p className="font-bold text-teal-500 mt-1">{currentQuestion.reference}</p>
                </div>
            )}

            <div className="mt-6">
                {!submitted ? (
                     <button onClick={handleSubmitAnswer} disabled={!selectedAnswer} className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-transform transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none">
                        Kirim Jawaban
                    </button>
                ) : (
                    <button onClick={handleNext} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-transform transform hover:scale-105 active:scale-95 animate-fade-in">
                        {currentQuestionIndex < questions.length - 1 ? 'Lanjut' : 'Selesai'}
                    </button>
                )}
            </div>
        </div>
        <div className="w-full max-w-2xl text-center mt-8">
            <p className="text-lg italic text-slate-600">
                "{motivationalQuote}"
            </p>
        </div>
    </>
  );
};

export default GameScreen;
