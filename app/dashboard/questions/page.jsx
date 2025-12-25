'use client';

import { useState, useEffect, useCallback } from 'react';
import { chatSession } from '@/utils/GeminiAIModal';
import { db } from '@/utils/db';
import { Questions } from '@/utils/schema';
import { eq, and } from 'drizzle-orm';
import { toast } from 'sonner';

/* -------------------- */
/* 🔒 Safe JSON Parser  */
/* -------------------- */
function parseAIJson(text, type = 'object') {
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const startChar = type === 'array' ? '[' : '{';
    const endChar = type === 'array' ? ']' : '}';

    const start = cleaned.indexOf(startChar);
    const end = cleaned.lastIndexOf(endChar);

    if (start === -1 || end === -1) {
      throw new Error('No valid JSON found in AI response');
    }

    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('Frontend Developer');
  const [error, setError] = useState('');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);

  /* -------------------- */
  /* Generate Questions  */
  /* -------------------- */
  const generateQuestions = useCallback(async (forceRegenerate = false) => {
    setLoading(true);
    setError('');

    try {
      if (forceRegenerate) {
        await db.delete(Questions).where(eq(Questions.role, role));
      }

      const prompt = `
Generate 5 popular, practical, real interview questions for a ${role} role.

Rules:
- Return ONLY valid JSON
- No explanation
- No markdown

Format:
[
  {"question":"..."},
  {"question":"..."}
]
`;

      const result = await chatSession.sendMessage(prompt);
      const textResponse = typeof result.response.text === 'function'
        ? await result.response.text()
        : result.response.text;

      console.log('RAW QUESTIONS AI RESPONSE:', textResponse);

      const aiQuestions = parseAIJson(textResponse, 'array');

      if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) {
        throw new Error('Invalid questions format');
      }

      const validQuestions = aiQuestions
        .filter(q => q?.question && typeof q.question === 'string')
        .slice(0, 5)
        .map(q => ({ question: q.question.trim(), answer: null }));

      setQuestions(validQuestions);

      await db.insert(Questions).values(
        validQuestions.map(q => ({
          text: q.question,
          role,
          answer: null,
          createdAt: new Date().toISOString(),
        }))
      );

      toast.success(`Generated ${validQuestions.length} questions`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to generate questions');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  /* -------------------- */
  /* Generate Answer     */
  /* -------------------- */
  const generateAnswer = useCallback(async (index) => {
    setSelectedQuestionIndex(index);
    setError('');

    try {
      const question = questions[index]?.question;
      if (!question) throw new Error('Invalid question');

      const prompt = `
Answer the following interview question for a ${role} role.

Rules:
- Return ONLY valid JSON
- No explanation
- No markdown

Format:
{"answer":"..."}

Question:
"${question}"
`;

      const result = await chatSession.sendMessage(prompt);
      const textResponse = typeof result.response.text === 'function'
        ? await result.response.text()
        : result.response.text;

      console.log('RAW ANSWER AI RESPONSE:', textResponse);

      const aiAnswer = parseAIJson(textResponse, 'object');

      if (!aiAnswer?.answer || typeof aiAnswer.answer !== 'string') {
        throw new Error('Invalid answer format');
      }

      const updated = [...questions];
      updated[index] = { ...updated[index], answer: aiAnswer.answer.trim() };
      setQuestions(updated);

      await db.update(Questions)
        .set({ answer: aiAnswer.answer.trim() })
        .where(and(eq(Questions.text, question), eq(Questions.role, role)));

      toast.success('Answer generated');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to generate answer');
      setError(err.message);
    } finally {
      setSelectedQuestionIndex(null);
    }
  }, [questions, role]);

  /* -------------------- */
  /* Fetch Questions     */
  /* -------------------- */
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await db.select().from(Questions).where(eq(Questions.role, role));
      if (data.length) {
        setQuestions(data.map(q => ({ question: q.text, answer: q.answer })));
      } else {
        await generateQuestions(false);
      }
    } catch {
      toast.error('Failed to load questions');
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [role, generateQuestions]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  /* -------------------- */
  /* UI                  */
  /* -------------------- */
  return (
    <div className="p-6 md:p-10 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Interview Questions</h1>

        <div className="flex gap-4 mb-6">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border px-4 py-2 rounded"
          >
            <option>Frontend Developer</option>
            <option>Backend Developer</option>
            <option>Full Stack Developer</option>
            <option>DevOps Engineer</option>
          </select>

          <button
            onClick={() => generateQuestions(true)}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            {loading ? 'Generating...' : 'Regenerate'}
          </button>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {questions.map((q, i) => (
          <div key={i} className="bg-white p-6 mb-4 rounded shadow">
            <h2 className="font-semibold">{q.question}</h2>

            {q.answer ? (
              <p className="mt-3 text-gray-700 whitespace-pre-wrap">{q.answer}</p>
            ) : (
              <button
                onClick={() => generateAnswer(i)}
                disabled={selectedQuestionIndex !== null}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
              >
                {selectedQuestionIndex === i ? 'Generating...' : 'Generate Answer'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
