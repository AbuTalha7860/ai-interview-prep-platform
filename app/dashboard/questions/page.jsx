'use client';

import { useState, useEffect } from 'react';
import { chatSession } from '@/utils/GeminiAIModal';
import { db } from '@/utils/db';
import { Questions } from '@/utils/schema';
import { eq } from 'drizzle-orm';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('Frontend Developer');
  const [error, setError] = useState('');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await db.select().from(Questions).where(eq(Questions.role, role));
      if (result.length > 0) {
        setQuestions(result.map(q => ({ question: q.text, answer: q.answer || null })));
      } else {
        await generateQuestions();
      }
    } catch (err) {
      setError('Failed to load questions.');
      console.error('DB error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const prompt = `Generate 5 popular real-life interview questions for a ${role} role. Return the response as a JSON array of objects, each with a 'question' key containing the question text.`;
      const result = await chatSession.sendMessage(prompt);

      let textResponse;
      if (result.response && typeof result.response.text === 'function') {
        textResponse = await result.response.text();
      } else if (result.text) {
        textResponse = result.text;
      } else {
        throw new Error('Unable to extract text from AI response.');
      }

      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
      let aiQuestions;
      if (jsonMatch && jsonMatch[1]) {
        try {
          aiQuestions = JSON.parse(jsonMatch[1].trim());
        } catch (parseErr) {
          throw new Error('Invalid JSON format in AI response: ' + jsonMatch[1]);
        }
      } else {
        try {
          aiQuestions = JSON.parse(textResponse.trim());
        } catch (parseErr) {
          throw new Error('No valid JSON found in AI response: ' + textResponse);
        }
      }

      if (!Array.isArray(aiQuestions)) {
        throw new Error('AI response is not an array of questions.');
      }

      const questionsWithNullAnswers = aiQuestions.map(q => ({ question: q.question, answer: null }));
      setQuestions(questionsWithNullAnswers);

      await db.insert(Questions).values(
        questionsWithNullAnswers.map(q => ({
          text: q.question,
          role,
          answer: null, // Answers will be generated on demand
          createdAt: new Date().toISOString(),
        }))
      );
    } catch (err) {
      setError(`Failed to generate questions with AI: ${err.message}`);
      console.error('AI error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAnswer = async (index) => {
    setLoading(true);
    setError('');
    try {
      const question = questions[index].question;
      const prompt = `Provide a concise and professional answer to the following interview question: "${question}". Return the response as a JSON object with an 'answer' key.`;
      const result = await chatSession.sendMessage(prompt);

      let textResponse;
      if (result.response && typeof result.response.text === 'function') {
        textResponse = await result.response.text();
      } else if (result.text) {
        textResponse = result.text;
      } else {
        throw new Error('Unable to extract text from AI response.');
      }

      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
      let aiAnswer;
      if (jsonMatch && jsonMatch[1]) {
        try {
          aiAnswer = JSON.parse(jsonMatch[1].trim());
        } catch (parseErr) {
          throw new Error('Invalid JSON format in AI response: ' + jsonMatch[1]);
        }
      } else {
        try {
          aiAnswer = JSON.parse(textResponse.trim());
        } catch (parseErr) {
          throw new Error('No valid JSON found in AI response: ' + textResponse);
        }
      }

      if (!aiAnswer?.answer) {
        throw new Error('AI response does not contain a valid answer.');
      }

      const updatedQuestions = [...questions];
      updatedQuestions[index] = { ...updatedQuestions[index], answer: aiAnswer.answer };
      setQuestions(updatedQuestions);

      // Update database with the answer
      await db
        .update(Questions)
        .set({ answer: aiAnswer.answer })
        .where(eq(Questions.text, question))
        .where(eq(Questions.role, role));
    } catch (err) {
      setError(`Failed to generate answer for question ${index + 1}: ${err.message}`);
      console.error('Answer generation error:', err);
    } finally {
      setLoading(false);
      setSelectedQuestionIndex(null); // Reset selection after generation
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [role]);

  return (
    <div className="p-6 md:p-10 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm text-blue-600 font-semibold uppercase">AI Interview Questions</p>
          <h1 className="text-3xl font-bold text-gray-800 mt-1">Generated Questions by Role</h1>
          <p className="text-gray-500 mt-2">Select a role to fetch or generate realistic interview questions powered by AI.</p>
        </div>

        {/* Role Selector and Button */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full md:w-auto border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="Full Stack Developer">Full Stack Developer</option>
            <option value="DevOps Engineer">DevOps Engineer</option>
          </select>
          <button
            onClick={generateQuestions}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition"
          >
            {loading ? 'Generating...' : 'Regenerate Questions'}
          </button>
        </div>

        {/* Error */}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {/* Questions Display */}
        {loading ? (
          <div className="flex justify-center mt-10">
            <div className="animate-spin h-10 w-10 border-4 border-t-blue-500 border-blue-200 rounded-full"></div>
          </div>
        ) : questions.length > 0 ? (
          <div className="grid gap-6">
            {questions.map((q, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{q.question}</h2>
                {q.answer ? (
                  <p className="text-gray-600 mt-2">Answer: {q.answer}</p>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedQuestionIndex(index);
                      generateAnswer(index);
                    }}
                    disabled={loading}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition"
                  >
                    {loading && selectedQuestionIndex === index ? 'Generating...' : 'Show Answer'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mt-4">No questions yet. Try generating some for the selected role.</p>
        )}
      </div>
    </div>
  );
}