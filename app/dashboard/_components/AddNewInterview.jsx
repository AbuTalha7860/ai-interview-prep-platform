"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chatSession } from "@/utils/GeminiAIModal";
import { LoaderCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { useRouter } from "next/navigation";

const AddNewInterview = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdAt, setCreatedAt] = useState("");
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only runs on client to avoid hydration mismatch
    setCreatedAt(moment().format("DD-MM-YYYY"));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const InputPrompt = `
      Job Position: ${jobPosition}, 
      Job Description: ${jobDesc}, 
      Years of Experience: ${jobExperience}. 
      Based on this information, please provide 5 interview questions with answers in JSON format, ensuring "Question" and "Answer" are fields in the JSON.
    `;

    const result = await chatSession.sendMessage(InputPrompt);

    if (!result?.response) {
      console.error("Gemini API failed: No response returned.");
      alert("Gemini API is down or overloaded. Try again later.");
      setLoading(false);
      return;
    }

    const rawText = await result.response.text();
    const cleanedJson = rawText.replace(/```json|```/g, "").trim();

    const resp = await db
      .insert(MockInterview)
      .values({
        mockId: uuidv4(),
        jsonMokedResp: cleanedJson,
        jobPosition: jobPosition,
        jobDesc: jobDesc,
        jobExperience: jobExperience,
        createdBy: user?.primaryEmailAddress?.emailAddress,
        createdAt: createdAt,
      })
      .returning({ mockId: MockInterview.mockId });

    console.log("Inserted ID:", resp);

    if(resp){
      setOpenDialog(false);
      router.push('/dashboard/interview/'+resp[0]?.mockId)
    }
    setLoading(false);
  };

  return (
    <div>
      <div
        className="p-10 border rounded-lg bg-secondary hover:scale-105 hover:shadow-md cursor-pointer transition-all"
        onClick={() => setOpenDialog(true)}
      >
        <h2 className="text-lg text-center">+ Add New</h2>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Tell us more about the job you are interviewing for
            </DialogTitle>
            <DialogDescription>
              Fill in the job details to generate mock interview questions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="mt-4">
            <div className="my-4">
              <label className="block mb-1 font-medium">
                Job Role / Position
              </label>
              <Input
                placeholder="Ex. Full Stack Developer"
                required
                onChange={(event) => setJobPosition(event.target.value)}
              />
            </div>

            <div className="my-4">
              <label className="block mb-1 font-medium">
                Job Description / Tech Stack
              </label>
              <Textarea
                placeholder="Ex. React, Angular, Node.js, MySQL, etc."
                required
                onChange={(event) => setJobDesc(event.target.value)}
              />
            </div>

            <div className="my-4">
              <label className="block mb-1 font-medium">
                Years of Experience
              </label>
              <Input
                type="number"
                placeholder="Ex. 5"
                required
                max="60"
                onChange={(event) => setJobExperience(event.target.value)}
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircle className="animate-spin mr-2" />
                    Generating from AI...
                  </>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddNewInterview;
