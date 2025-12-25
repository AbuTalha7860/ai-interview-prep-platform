"use client";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { eq } from "drizzle-orm";
import React, { useEffect, useState, useCallback } from "react";
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

  // Function to convert rating text to numeric value
  const ratingToNumber = (rating) => {
    if (!rating) return 0;
    const ratingLower = String(rating).toLowerCase().trim();
    
    if (ratingLower.includes('excellent') || ratingLower.includes('outstanding') || ratingLower === '5') return 5;
    if (ratingLower.includes('very good') || ratingLower.includes('very-good') || ratingLower === '4') return 4;
    if (ratingLower.includes('good') || ratingLower === '3') return 3;
    if (ratingLower.includes('fair') || ratingLower.includes('average') || ratingLower === '2') return 2;
    if (ratingLower.includes('poor') || ratingLower.includes('needs improvement') || ratingLower === '1') return 1;
    
    // Try to parse as number if it's a numeric string
    const num = parseInt(rating);
    if (!isNaN(num) && num >= 1 && num <= 5) return num;
    
    return 0;
  };

  // Function to convert numeric value back to rating text
  const numberToRating = (num) => {
    if (num >= 4.5) return 'Excellent';
    if (num >= 3.5) return 'Very Good';
    if (num >= 2.5) return 'Good';
    if (num >= 1.5) return 'Fair';
    return 'Poor';
  };

  // Calculate overall rating
  const calculateOverallRating = () => {
    if (!feedbackList || feedbackList.length === 0) return null;
    
    const ratings = feedbackList.map(item => ratingToNumber(item.rating));
    const validRatings = ratings.filter(r => r > 0);
    
    if (validRatings.length === 0) return null;
    
    const average = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
    return {
      text: numberToRating(average),
      numeric: average.toFixed(1),
      percentage: ((average / 5) * 100).toFixed(0)
    };
  };

  const GetFeedback = useCallback(async () => {
    if (!interviewId) return;
    
    try {
      const result = await db
        .select()
        .from(UserAnswer)
        .where(eq(UserAnswer.mockIdRef, interviewId))
        .orderBy(UserAnswer.id);

      console.log('Feedback results:', result);
      setFeedbackList(result || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setFeedbackList([]);
    }
  }, [interviewId]);

  const overallRating = calculateOverallRating();

  useEffect(() => {
    if (interviewId) {
      GetFeedback();
    }
  }, [interviewId, GetFeedback]);

  return (
    <div className="p-6">
      {feedbackList?.length==0?
        <h2 className="font-bond text-xl text-gray-500">No Interview Feedback Record Found</h2>
        :
      <>
      <h2 className="text-3xl font-bold text-green-500 mb-6">Congratulations!</h2>
      <h2 className="font-bold text-2xl">Here is your Interview Feedback</h2>
      
      <div className="my-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
        <h2 className="text-primary text-lg font-semibold mb-2">Your overall rating:</h2>
        {overallRating ? (
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-green-600">{overallRating.text}</span>
            <span className="text-xl text-gray-600">({overallRating.numeric}/5.0)</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4 max-w-xs">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${overallRating.percentage}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500">{overallRating.percentage}%</span>
          </div>
        ) : (
          <p className="text-gray-500">Calculating overall rating...</p>
        )}
      </div>
      
      <h2 className="text-sm text-gray-400 mb-4">
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
