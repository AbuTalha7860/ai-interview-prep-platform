"use client";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { eq } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const Feedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const router = useRouter();
  const params = useParams();
  const interviewId = params.interviewId; // ✅ This is the correct way

  useEffect(() => {
    GetFeedback();
  }, []);

  const GetFeedback = async () => {
    const result = await db
      .select()
      .from(UserAnswer)
      .where(eq(UserAnswer.mockIdRef, interviewId))
      .orderBy(UserAnswer.id);

    console.log(result);
    setFeedbackList(result);
  };

  return (
    <div className="p-6">
      {feedbackList?.length==0?
        <h2 className="font-bond text-xl text-gray-500">No Interview Feedback Record Found</h2>
        :
      <>
      <h2 className="text-3xl font-bold text-green-500 mb-6">Congratulations!</h2>
      <h2 className="font-bold text-2xl">Here is your Interview Feedback</h2>
      
      <h2 className="text-primary text-lg my-3">Your overall rating:</h2>
      <h2 className="text-sm text-gray-400">
        Find below interview question with correct Answer, your answer, and
        feedback for improvement
      </h2>

      {feedbackList &&
        feedbackList.map((item, index) => (
          <Collapsible key={index} className="mt-7">
            <CollapsibleTrigger className="p-2 bg-secondary rounded-lg my-2 text-left flex justify-between gap-7 w-full">
              {item.question} <ChevronsUpDown className="h-5 w-5" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div>
                <h2 className="text-red-500 p-2 border rounded-lg">
                  <strong>Rating:</strong> {item.rating}
                </h2>
                <h2 className="p-2 border rounded-lg bg-red-50 text-sm text-red-900">
                  <strong>Your Answer: </strong> {item.userAns}
                </h2>
                <h2 className="p-2 border rounded-lg bg-green-50 text-sm text-green-900">
                  <strong>Correct Answer: </strong> {item.correctAns}
                </h2>
                <h2 className="p-2 border rounded-lg bg-blue-50 text-sm text-primary">
                  <strong>Feedback: </strong> {item.feedback}
                </h2>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
        </>}
      <Button onClick={() => router.replace("/dashboard")}>
        Go to dashboard
      </Button>
    </div>
  );
};

export default Feedback;
