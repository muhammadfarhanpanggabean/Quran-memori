import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, Question, GameMode } from '../types';

const questionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            questionText: {
                type: Type.STRING,
                description: "The question for the user. For multiple choice, it's 'Lanjutkan ayat...'. For 'Guess the Surah', it's the full verse in Arabic script. For 'Fill in the Blank', it's the verse with '[...]' as a placeholder. Must be in Bahasa Indonesia or Arabic as appropriate."
            },
            options: {
                type: Type.ARRAY,
                description: "An array of exactly 4 strings representing the multiple-choice options. Could be verses in Arabic script, Surah names in Latin script, or missing words in Arabic script.",
                items: {
                    type: Type.STRING
                }
            },
            correctAnswer: {
                type: Type.STRING,
                description: "The correct answer. This must exactly match one of the strings in the 'options' array."
            },
            reference: {
                type: Type.STRING,
                description: "The reference of the correct verse, e.g., 'Al-Baqarah: 255'."
            }
        },
        required: ["questionText", "options", "correctAnswer", "reference"]
    }
};

const getDifficultyInstructions = (difficulty: Difficulty) => {
    switch(difficulty) {
        case 'Mudah':
            return "For 'Mudah' (Easy) level: Provide a verse and ask the user to provide the *next* verse. The question should be like 'Lanjutkan ayat berikut: [ayat]'. The options should be four different verses, one of which is the correct next verse.";
        case 'Sedang':
            return "For 'Sedang' (Medium) level: Ask the user to recite a *specific* verse from a Surah within the selected Juz. The question should be like 'Sebutkan bunyi ayat ke-[nomor] dari Surah [nama surah]'. The options should be four different verses from the same Juz.";
        case 'Susah':
            return "For 'Susah' (Hard) level: Provide a *fragment* or the *end* of a verse and ask the user to complete it and identify the Surah and verse number. The question should be like 'Lengkapi potongan ayat berikut: [...potongan ayat...]'. The options should be four complete verses that plausibly complete the fragment.";
    }
}

const getTebakSurahDifficultyInstructions = (difficulty: Difficulty) => {
    switch(difficulty) {
        case 'Mudah':
            return "For 'Mudah' (Easy) level: Use well-known and easily recognizable verses from the selected Juz.";
        case 'Sedang':
            return "For 'Sedang' (Medium) level: Use verses that are less common but still identifiable. The distractor Surah names should be from the same Juz to increase the challenge.";
        case 'Susah':
            return "For 'Susah' (Hard) level: Use verses that are thematically similar to verses in other Surahs, or use verses from the beginning/end of a Surah which can be confusing. The distractors should be very plausible.";
    }
}

const getIsiAyatDifficultyInstructions = (difficulty: Difficulty) => {
    switch(difficulty) {
        case 'Mudah':
            return "For 'Mudah' (Easy) level: Remove one common, easily identifiable word from a well-known verse. The blank should be clearly indicated with `[...]`. The distractor options should be phonetically or contextually different.";
        case 'Sedang':
            return "For 'Sedang' (Medium) level: Remove a less common word, or two consecutive words. The distractor options should be plausible and might come from similar verses (mutashabihat).";
        case 'Susah':
            return "For 'Susah' (Hard) level: Remove a crucial phrase or a word from a complex verse that is similar to other verses. The distractors must be very tricky, perhaps differing only by a single letter or harakat.";
    }
}


const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

export const generateQuestions = async (juz: number[], difficulty: Difficulty, numberOfQuestions: number, gameMode: GameMode, dailyChallengeDate?: string): Promise<Question[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let prompt: string;
    
    let dailyChallengeInstruction = '';
    if (gameMode === 'Tantangan Harian' && dailyChallengeDate) {
        dailyChallengeInstruction = `
        IMPORTANT: This is a Daily Challenge for the date ${dailyChallengeDate}.
        You MUST use this date as a seed to generate the exact same set of questions for every user playing on this day.
        The question set must be unique for this date.
        `;
    }

    if (gameMode === 'Isi Ayat' || (gameMode === 'Tantangan Harian' && (new Date(dailyChallengeDate!).getDate() % 3 === 2))) {
        const difficultyInstruction = getIsiAyatDifficultyInstructions(difficulty);
        prompt = `
            You are an expert in the Quran. Your task is to generate ${numberOfQuestions} 'Fill in the Blank' multiple-choice questions in Bahasa Indonesia.
            ${dailyChallengeInstruction}
            The questions must be based on the content of Juz ${juz.join(', ')}.
            The difficulty level is ${difficulty}.

            The user will be given a verse in Arabic with one or more words missing, replaced by '[...]'. They must choose the correct word(s) to complete the verse.

            ${difficultyInstruction}

            Rules:
            1. The 'questionText' MUST be the verse in Arabic script with a part missing, indicated by '[...]'.
            2. Provide exactly 4 options for each question. The 'options' should be the missing Arabic word(s).
            3. One option must be the correct missing part. The other three must be plausible but incorrect distractors.
            4. All options and the correct answer must be in Arabic script.
            5. The 'correctAnswer' field must contain the exact string of the correct missing part from the 'options' array.
            6. The 'reference' must be the full, accurate reference for the complete verse (Surah name: verse number).
            7. Do not repeat questions.
            8. Ensure the \`[...]\` placeholder is used consistently for the blank.

            Return the response as a JSON array that validates against the provided schema.
        `;
    } else if (gameMode === 'Tebak Surah' || (gameMode === 'Tantangan Harian' && (new Date(dailyChallengeDate!).getDate() % 3 === 1))) {
        const difficultyInstruction = getTebakSurahDifficultyInstructions(difficulty);
        prompt = `
            You are an expert in the Quran. Your task is to generate ${numberOfQuestions} 'Guess the Surah' multiple-choice questions in Bahasa Indonesia.
            ${dailyChallengeInstruction}
            The questions must be based on the content of Juz ${juz.join(', ')}.
            The difficulty level is ${difficulty}.

            The user will be given a full verse from the Quran in Arabic script (as 'questionText'), and they must guess which Surah it belongs to.

            ${difficultyInstruction}

            Rules:
            1. The 'questionText' MUST be only the full verse in Arabic script, without any introductory Indonesian text.
            2. Provide exactly 4 options for each question in the 'options' array.
            3. The 'options' should be Surah names in Latin script (e.g., 'Al-Baqarah', 'Ali 'Imran').
            4. One option must be the correct Surah name. The other three must be plausible but incorrect Surah names, preferably from the same Juz.
            5. The 'correctAnswer' field must contain the exact string of the correct Surah name from the 'options' array.
            6. The 'reference' must be the full, accurate reference for the question verse (Surah name: verse number).
            7. Do not repeat questions.
            8. Provide a diverse set of questions from different Surahs within the selected Juz.

            Return the response as a JSON array that validates against the provided schema.
        `;
    } else { // Pilihan Ganda or Daily Challenge fallback
        const difficultyInstruction = getDifficultyInstructions(difficulty);
        prompt = `
            You are an expert in the Quran. Your task is to generate ${numberOfQuestions} multiple-choice Quran memorization questions in Bahasa Indonesia.
            ${dailyChallengeInstruction}
            The questions must be based on the content of Juz ${juz.join(', ')}.
            The difficulty level is ${difficulty}.

            ${difficultyInstruction}

            Rules:
            1. All questions ('questionText') must be in Bahasa Indonesia.
            2. Provide exactly 4 options for each question in the 'options' array.
            3. One option must be the correct answer. The other three must be plausible but incorrect distractors, preferably from nearby verses or the same Surah to make it challenging.
            4. The 'correctAnswer' field must contain the exact string of the correct option from the 'options' array.
            5. All options ('options' array) and the correct answer ('correctAnswer') must be in Arabic script.
            6. The 'reference' must be accurate for the correct answer (Surah name: verse number).
            7. Do not repeat questions.
            8. Provide a diverse set of questions from different Surahs within the selected Juz.

            Return the response as a JSON array that validates against the provided schema.
        `;
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`Membuat pertanyaan baru (Percobaan ${attempt}/${MAX_RETRIES})...`);
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: questionSchema,
                    thinkingConfig: { thinkingBudget: 0 },
                },
            });

            const jsonString = response.text.trim();
            const questions = JSON.parse(jsonString);
            
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error("API tidak menghasilkan pertanyaan atau formatnya salah.");
            }

            // Basic validation
            if (!questions.every(q => q.options && q.options.length === 4 && q.options.includes(q.correctAnswer))) {
                throw new Error("Data yang dihasilkan tidak sesuai dengan struktur kuis.");
            }
            
            console.log("Berhasil membuat pertanyaan!");
            return questions as Question[];

        } catch (error) {
            console.error(`Gagal pada percobaan ${attempt}:`, error);
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            
            if (errorMessage.includes('PERMISSION_DENIED')) {
                throw error;
            }

            if (attempt === MAX_RETRIES) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }

    throw new Error("Gagal membuat pertanyaan setelah beberapa kali percobaan.");
};