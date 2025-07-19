import { Lightbulb, Volume2 } from 'lucide-react';
import React from 'react';

const QuestionSection = ({ mockInterviewQuestion, activeQuestionIndex }) => {

  const textToSpeech = (text) => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(speech);
    } else {
      alert('Sorry, Your browser does not support text to speech');
    }
  };

  return mockInterviewQuestion && (
    <div className='p-5 border rounded-lg my-10 bg-white shadow-sm'>
      {/* Question Pills */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {Array.isArray(mockInterviewQuestion) &&
          mockInterviewQuestion.map((_, index) => (
            <h2
              key={index}
              className={`p-2 rounded-full text-xs md:text-sm text-center cursor-pointer transition-all duration-200 ${
                activeQuestionIndex === index
                  ? 'bg-primary text-white scale-105 shadow'
                  : 'bg-secondary text-gray-800'
              }`}>
              Question #{index + 1}
            </h2>
          ))}
      </div>

      {/* Question Text + Volume Icon */}
      <div className='my-6 flex items-start gap-3'>
        <h2 className='text-md md:text-lg font-medium flex-1'>
          {mockInterviewQuestion[activeQuestionIndex]?.Question}
        </h2>
        <Volume2
          size={28} // ⬅️ Slightly bigger icon
          strokeWidth={2.2}
          className='cursor-pointer text-primary hover:scale-110 transition-transform'
          onClick={() =>
            textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.Question)
          }
        />
      </div>

      {/* Note Section */}
      <div className='border rounded-lg p-5 bg-blue-100 mt-10'>
        <h2 className='flex gap-2 items-center text-primary'>
          <Lightbulb />
          <strong>Note:</strong>
        </h2>
        <h2 className='text-sm text-primary my-2'>
          {process.env.NEXT_PUBLIC_QUESTION_NOTE}
        </h2>
      </div>
    </div>
  );
};

export default QuestionSection;
