"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { db } from '@/utils/db';
import { MockInterview } from '@/utils/schema';
import { eq } from 'drizzle-orm';
import { Lightbulb, WebcamIcon, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const Interview = () => {
  const router = useRouter();
  const params = useParams();
  const { interviewId } = params;

  const [interviewData, setInterviewData] = useState(null);
  const [webcamEnable, setWebcamEnable] = useState(false);
  const [loading, setLoading] = useState(false); // loader state

  useEffect(() => {
    console.log(interviewId);
    GetInterviewDetails();
  }, []);

  const GetInterviewDetails = async () => {
    const result = await db.select().from(MockInterview)
      .where(eq(MockInterview.mockId, interviewId));
    setInterviewData(result[0]);
  };

  const handleStart = () => {
    setLoading(true);
    router.push(`/dashboard/interview/${interviewId}/start`);
  };

  if (!interviewData) {
    return (
      <div className='my-10 flex justify-center flex-col items-center'>
        <h2 className='text-lg text-gray-500'>Loading interview details...</h2>
      </div>
    );
  }

  return (
    <div className='my-10'>
      <h2 className='font-bold text-2xl'>Let's Get Started</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>

        {/* Interview Info */}
        <div className='flex flex-col my-5 gap-4'>
          <div className='flex flex-col my-5 gap-4 p-5 rounded-lg border'>
            <h2 className='text-lg'><strong>Job Role/Job Position:</strong> {interviewData.jobPosition}</h2>
            <h2 className='text-lg'><strong>Job Description/Tech Stack:</strong> {interviewData.jobDesc}</h2>
            <h2 className='text-lg'><strong>Job Experience:</strong> {interviewData.jobExperience}</h2>
          </div>

          <div className='p-5 rounded-lg border border-yellow-300 bg-yellow-100'>
            <h2 className='flex gap-2 items-center text-yellow-500'>
              <Lightbulb /><strong>Information</strong>
            </h2>
            <h2 className='mt-3 text-yellow-500'>
              {process.env.NEXT_PUBLIC_INFORMATION}
            </h2>
          </div>
        </div>

        {/* Webcam */}
        <div>
          {webcamEnable ? (
            <Webcam
              onUserMedia={() => setWebcamEnable(true)}
              onUserMediaError={() => setWebcamEnable(false)}
              style={{ height: 300, width: 300 }}
              mirrored={true}
            />
          ) : (
            <>
              <WebcamIcon className='h-72 w-full my-7 p-20 bg-secondary rounded-lg border' />
              <Button variant='ghost' className='w-full' onClick={() => setWebcamEnable(true)}>
                Enable Web Cam and Microphone
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Start Interview */}
      <div className='flex justify-end items-end mt-6'>
        <Button onClick={handleStart} disabled={loading} className='flex items-center gap-2'>
          {loading && <Loader2 className='w-4 h-4 animate-spin' />}
          {loading ? 'Starting...' : 'Start Interview'}
        </Button>
      </div>
    </div>
  );
};

export default Interview;
