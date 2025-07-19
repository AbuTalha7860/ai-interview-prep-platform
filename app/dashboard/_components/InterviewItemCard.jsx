import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { Loader2 } from 'lucide-react' // Icon for spinner

const InterviewItemCard = ({interview}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false); // loader state

  const onStart = () => {
    setLoading(true);
    router.push('/dashboard/interview/' + interview?.mockId);
  }

  const onFeedbackPress = () => {
    router.push('/dashboard/interview/' + interview?.mockId + '/feedback');
  }

  return (
    <div className='border shadow-sm rounded-lg p-3'>
      <h2 className='font-bold text-primary'>{interview?.jobPosition}</h2>
      <h2 className='text-sm text-gray-600'>{interview?.jobExperience} Year of Experience</h2>
      <h2 className='text-sm text-gray-400'>Created At: {interview?.createdAt}</h2>
      <div className='flex justify-between mt-2 gap-5'>
        <Button
          size="sm"
          variant="outline"
          className='w-full'
          onClick={onFeedbackPress}
        >
          Feedback
        </Button>

        <Button
          size="sm"
          className='w-full flex items-center justify-center gap-2'
          onClick={onStart}
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Starting...' : 'Start'}
        </Button>
      </div>
    </div>
  )
}

export default InterviewItemCard
