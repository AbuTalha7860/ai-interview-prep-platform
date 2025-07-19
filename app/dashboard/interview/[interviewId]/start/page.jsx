"use client";
import { db } from '@/utils/db';
import { MockInterview } from '@/utils/schema';
import { eq } from 'drizzle-orm';
import React, { useEffect, useState, use } from 'react';
import QuestionSection from './_components/QuestionSection';
import dynamic from 'next/dynamic'; // ⬅️ Import Next.js dynamic
import { Button } from '@/components/ui/button';
import Link from 'next/link';



// ⬅️ Dynamically load RecordAnswerSection with SSR off
const RecordAnswerSection = dynamic(
  () => import('./_components/RecordAnswerSection'),
  { ssr: false }
);

const StartInterview = (props) => {
  const { interviewId } = use(props.params);

  const [interviewData, setInterviewData] = useState();
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  useEffect(() => {
    GetInterviewDetails();
  }, []);

  const GetInterviewDetails = async () => {
    const result = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.mockId, interviewId));

    if (!result[0]?.jsonMokedResp) {
      console.error("Invalid or missing interview data");
      return;
    }

    const jsonMokedResp = JSON.parse(result[0].jsonMokedResp);
    setMockInterviewQuestion(jsonMokedResp);
    setInterviewData(result[0]);
  };

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
        <QuestionSection 
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
        />
        <RecordAnswerSection 
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
          interviewData={interviewData}
        />
      </div>
      <div className='flex justify-end gap-6'>
        {activeQuestionIndex>0&& 
        <Button onClick={()=>setActiveQuestionIndex(activeQuestionIndex-1 )}>Previous Question</Button>}
        {activeQuestionIndex!=mockInterviewQuestion?.length-1 &&
        <Button onClick={()=>setActiveQuestionIndex(activeQuestionIndex+1 )}>Next Question</Button>}
        {activeQuestionIndex==mockInterviewQuestion?.length-1 &&
        <Link href = {'/dashboard/interview/'+interviewData?.mockId+'/feedback'}>
          <Button>End Interview</Button>
        </Link>}
      </div>
    </div>
  );
};

export default StartInterview;
