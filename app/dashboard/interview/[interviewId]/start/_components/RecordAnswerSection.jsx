"use client"
import { Button } from '@/components/ui/button'
import { db } from '@/utils/db'

import { chatSession } from '@/utils/GeminiAIModal'
import { UserAnswer } from '@/utils/schema'
import { useUser } from '@clerk/nextjs'
import { Mic } from 'lucide-react'
import moment from 'moment'
import Image from 'next/image'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import useSpeechToText from 'react-hook-speech-to-text'
import Webcam from 'react-webcam' // ✅ Real webcam component
import { toast } from 'sonner'
import { eq, and } from 'drizzle-orm'

const RecordAnswerSection = ({ mockInterviewQuestion, activeQuestionIndex, interviewData }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false)
  const [hasRecordedAnswer, setHasRecordedAnswer] = useState(false)
  const { user } = useUser();
  const wasRecordingRef = useRef(false);
  const isSavingRef = useRef(false); // Prevent duplicate saves
  const {
    error,
    interimResult,
    isRecording,
    results,
    setResults,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  // Reset answer when question changes
  useEffect(() => {
    setUserAnswer('');
    setResults([]);
    setHasRecordedAnswer(false);
    wasRecordingRef.current = false;
    isSavingRef.current = false;
  }, [activeQuestionIndex, setResults])

  // Update userAnswer from speech-to-text results
  useEffect(() => {
    if (results && results.length > 0) {
      // When useLegacyResults is false, each result contains the full transcript
      // Get the latest transcript from the last result
      const latestResult = results[results.length - 1];
      if (latestResult?.transcript) {
        setUserAnswer(latestResult.transcript);
      }
    }
  }, [results])

  const updateUserAnswer = useCallback(async (answerText) => {
    if (!answerText || answerText.trim().length < 10) {
      toast.error('Please provide a longer answer (at least 10 characters)');
      return;
    }

    // Prevent duplicate calls - check ref first (most reliable)
    if (isSavingRef.current) {
      console.log('Skipping duplicate save attempt - already saving');
      return;
    }

    // Set flags to prevent duplicate calls
    isSavingRef.current = true;
    setLoading(true);
    setHasRecordedAnswer(true);

    try {
      // Check if answer already exists for this question
      const currentQuestion = mockInterviewQuestion[activeQuestionIndex]?.Question;
      if (!currentQuestion || !interviewData?.mockId) {
        throw new Error('Missing question or interview data');
      }

      // Check if answer already exists for this question
      const existingAnswers = await db
        .select()
        .from(UserAnswer)
        .where(
          and(
            eq(UserAnswer.mockIdRef, interviewData.mockId),
            eq(UserAnswer.question, currentQuestion),
            eq(UserAnswer.userEmail, user?.primaryEmailAddress?.emailAddress || '')
          )
        );

      const feedback =
        "Question: " + currentQuestion +
        ", User Answer: " + answerText +
        ". Depends on question and user answer for given interview question. " +
        "Please give us rating for answer and feedback as area of improvement if any " +
        "in just 3 to 5 lines to improve it, in JSON format with rating field and feedback field.";

      const result = await chatSession.sendMessage(feedback);
      
      // Properly handle Gemini API response
      let textResponse;
      if (result?.response) {
        if (typeof result.response.text === 'function') {
          textResponse = await result.response.text();
        } else {
          textResponse = result.response.text();
        }
      } else {
        throw new Error('No response from Gemini API');
      }

      const mockJsonResp = textResponse.replace(/```json|```/g, '').trim();
      console.log('Gemini response:', mockJsonResp);
      const jsonFeedbackResp = JSON.parse(mockJsonResp);

      if (!jsonFeedbackResp?.feedback || !jsonFeedbackResp?.rating) {
        throw new Error('Invalid response format from Gemini API');
      }

      const answerData = {
        userAns: answerText.trim(),
        feedback: jsonFeedbackResp.feedback,
        rating: String(jsonFeedbackResp.rating),
        correctAns: mockInterviewQuestion[activeQuestionIndex]?.Answer || '',
        createdAt: moment().format('DD-MM-YYYY'),
      };

      let resp;
      if (existingAnswers.length > 0) {
        // Update existing answer
        console.log('Updating existing answer...');
        console.log('Answer text:', answerText);
        console.log('Question:', currentQuestion);
        console.log('Mock ID:', interviewData.mockId);
        console.log('User Email:', user?.primaryEmailAddress?.emailAddress);
        
        resp = await db
          .update(UserAnswer)
          .set(answerData)
          .where(
            and(
              eq(UserAnswer.mockIdRef, interviewData.mockId),
              eq(UserAnswer.question, currentQuestion),
              eq(UserAnswer.userEmail, user?.primaryEmailAddress?.emailAddress || '')
            )
          )
          .returning({ id: UserAnswer.id });

        console.log('Database update result:', resp);
        
        if (resp && resp.length > 0) {
          console.log('Successfully updated answer with ID:', resp[0].id);
          toast.success('Answer updated successfully!');
        } else {
          throw new Error('Failed to update answer in database');
        }
      } else {
        // Insert new answer
        console.log('Inserting new answer...');
        console.log('Answer text:', answerText);
        console.log('Question:', currentQuestion);
        console.log('Mock ID:', interviewData.mockId);
        console.log('User Email:', user?.primaryEmailAddress?.emailAddress);
        
        const insertData = {
          ...answerData,
          mockIdRef: interviewData.mockId,
          question: currentQuestion,
          userEmail: user?.primaryEmailAddress?.emailAddress || '',
        };
        
        console.log('Insert data:', insertData);
        
        resp = await db
          .insert(UserAnswer)
          .values(insertData)
          .returning({ id: UserAnswer.id });

        console.log('Database insert result:', resp);
        
        if (resp && resp.length > 0) {
          console.log('Successfully inserted answer with ID:', resp[0].id);
          toast.success('User Answer recorded Successfully');
        } else {
          console.error('Insert returned empty result:', resp);
          throw new Error('Failed to insert answer into database - no ID returned');
        }
      }

      
    } catch (err) {
      console.error('Error recording answer:', err);
      setHasRecordedAnswer(false); // Reset flag on error so user can retry
      isSavingRef.current = false; // Reset saving flag on error
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeQuestionIndex, interviewData, mockInterviewQuestion, user]);

  // Save answer when recording stops and we have results
  useEffect(() => {
    console.log('useEffect triggered - isRecording:', isRecording, 'wasRecording:', wasRecordingRef.current, 'userAnswer length:', userAnswer.trim().length, 'results length:', results?.length, 'hasRecorded:', hasRecordedAnswer, 'loading:', loading, 'isSaving:', isSavingRef.current);
    
    // If we were recording but now we're not, and we have results, save it
    if (wasRecordingRef.current && !isRecording && !hasRecordedAnswer && !loading && !isSavingRef.current) {
      // Get the answer from results array directly (more reliable than userAnswer state)
      let answerText = '';
      if (results && results.length > 0) {
        const latestResult = results[results.length - 1];
        answerText = latestResult?.transcript || '';
      } else if (userAnswer.trim().length > 0) {
        answerText = userAnswer.trim();
      }
      
      console.log('Answer text from results:', answerText, 'Length:', answerText.length);
      
      if (answerText.length >= 10) {
        console.log('Conditions met for auto-save, setting timer...');
        
        // Small delay to ensure results are finalized
        const timer = setTimeout(() => {
          console.log('Timer fired, calling updateUserAnswer with:', answerText);
          updateUserAnswer(answerText);
        }, 1000);
        return () => {
          console.log('Cleaning up timer');
          clearTimeout(timer);
        };
      } else {
        console.log('Answer too short, not saving. Length:', answerText.length);
      }
    }
    wasRecordingRef.current = isRecording;
  }, [isRecording, userAnswer, results, hasRecordedAnswer, loading, updateUserAnswer])

  const StartStopRecording = async () => {
    if (isRecording) {
      // Get the final answer from results before stopping
      let finalAnswer = '';
      if (results && results.length > 0) {
        const latestResult = results[results.length - 1];
        finalAnswer = latestResult?.transcript || '';
        // Update userAnswer state with the final result
        if (finalAnswer) {
          setUserAnswer(finalAnswer);
        }
      }
      
      stopSpeechToText()
      console.log('Recording stopped. Final answer from results:', finalAnswer)
      console.log('Results array:', results)
      console.log('Result length:', results?.length)
      console.log('UserAnswer state:', userAnswer)
      
      // The useEffect will handle saving when isRecording changes to false
    }
    else {
      setUserAnswer('');
      setResults([]);
      setHasRecordedAnswer(false);
      isSavingRef.current = false;
      startSpeechToText()
    }
  }


  return (
    <div className='flex items-center justify-center flex-col'>
      <div className='relative flex flex-col justify-center items-center mt-20 rounded-lg p-5 bg-black'>
        <Image
          src={'/cam.png'}
          width={200}
          height={200}
          className='absolute top-0 left-1/2 -translate-x-1/2 opacity-30 z-0'
          alt='cam overlay'
        />
        <Webcam
          mirrored={true}
          style={{
            height: 300,
            width: '100%',
            borderRadius: '8px',
            zIndex: 10,
          }}
        />
      </div>

      <Button variant="outline" className="my-10" onClick={StartStopRecording} disabled={loading}>
        {isRecording ? (
          <h2 className='text-red-600 flex gap-2'><Mic /> Stop Recording</h2>
        ) : 'Record Answer'}
      </Button>

      {loading && (
        <p className='text-sm text-gray-500 mt-2'>Saving your answer...</p>
      )}
    </div>
  )
}

export default RecordAnswerSection
