"use client"
import { Button } from '@/components/ui/button'
import { db } from '@/utils/db'

import { chatSession } from '@/utils/GeminiAIModal'
import { UserAnswer } from '@/utils/schema'
import { useUser } from '@clerk/nextjs'
import { Mic } from 'lucide-react'
import moment from 'moment'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import useSpeechToText from 'react-hook-speech-to-text'
import Webcam from 'react-webcam' // ✅ Real webcam component
import { toast } from 'sonner'

const RecordAnswerSection = ({ mockInterviewQuestion, activeQuestionIndex, interviewData }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false)
  const { user } = useUser();
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

  useEffect(() => {
    results.map((result) => {
      setUserAnswer((prevAns) => prevAns + result?.transcript)
    })
  }, [results])
  useEffect(() => {
    if (!isRecording && userAnswer.length > 10) {
      updateUserAnswer()
    }
  }, [userAnswer])

  const StartStopRecording = async () => {
    if (isRecording) {

      stopSpeechToText()
      console.log(userAnswer)

    }
    else {
      startSpeechToText()
    }
  }

  const updateUserAnswer = async () => {
    setLoading(true);
    try {
      const feedback =
        "Question: " + mockInterviewQuestion[activeQuestionIndex]?.Question +
        ", User Answer: " + userAnswer +
        ". Depends on question and user answer for given interview question. " +
        "Please give us rating for answer and feedback as area of improvement if any " +
        "in just 3 to 5 lines to improve it, in JSON format with rating field and feedback field.";

      const result = await chatSession.sendMessage(feedback);
      const mockJsonResp = (result.response.text()).replace(/```json|```/g, '');
      console.log(mockJsonResp);
      const jsonFeedbackResp = JSON.parse(mockJsonResp);

      const resp = await db.insert(UserAnswer).values({
        mockIdRef: interviewData?.mockId,
        question: mockInterviewQuestion[activeQuestionIndex]?.Question,
        correctAns: mockInterviewQuestion[activeQuestionIndex]?.Answer,
        userAns: userAnswer,
        feedback: jsonFeedbackResp?.feedback,
        rating: jsonFeedbackResp?.rating,
        userEmail: user.primaryEmailAddress?.emailAddress,
        createdAt: moment().format('DD-MM-YYYY'), 
      });

      if (resp) {
        toast('User Answer recorded Successfully');
        setUserAnswer('');
        setResults([]);
      }

      
    } catch (err) {
      console.error('Gemini API error:', err);
      toast.error("Something went wrong. Gemini API might be down or overloaded. Try again later.");
    } finally {
      setLoading(false);
      setResults([]);
    }
  };

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

      <Button variant="outline" className="my-10" onClick={StartStopRecording}>
        {isRecording ? (
          <h2 className='text-red-600 flex gap-2'><Mic /> Stop Recording</h2>
        ) : 'Record Answer'}
      </Button>
    </div>
  )
}

export default RecordAnswerSection
