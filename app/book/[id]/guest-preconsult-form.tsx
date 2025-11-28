'use client'

import { useState, useCallback } from 'react'
import { useFormStatus } from 'react-dom'
import { createGuestPreConsult } from '../actions'
import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Turnstile } from '@/components/turnstile'

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button 
      type="submit" 
      className="w-full bg-slate-900 hover:bg-slate-800 hover:cursor-pointer" 
      disabled={pending || disabled}
    >
      {pending ? 'Saving...' : 'Save pre-consultation as guest'}
    </Button>
  )
}

export function GuestPreConsultForm({ doctorId }: { doctorId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null)
  }, [])

  async function handleSubmit(formData: FormData) {
    if (!turnstileToken) {
      setError('Please complete the security verification')
      toast.error('Please complete the security verification')
      return
    }

    formData.append('turnstileToken', turnstileToken)

    setError(null)
    setSuccess(false)
    const res = await createGuestPreConsult(formData)

    if (res?.error) {
      setError(res.error)
      toast.error(res.error)
      return
    }

    toast.success('Saved. Create an account to keep your progress.')
    setSuccess(true)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="doctorId" value={doctorId} />
      <CardContent className="space-y-4 p-0">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            Saved securely for this session. Sign up when you are ready to book.
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="symptoms">Symptoms (no names or contact info)</Label>
          <Textarea
            id="symptoms"
            name="symptoms"
            minLength={10}
            placeholder="e.g., Persistent cough for 3 days, mild fever, fatigue"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal">What do you hope to get from this visit?</Label>
          <Textarea
            id="goal"
            name="goal"
            minLength={5}
            maxLength={500}
            placeholder="Diagnosis, reassurance, prescription guidance, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="urgency">Urgency</Label>
          <select
            id="urgency"
            name="urgency"
            defaultValue="normal"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label>Security Verification</Label>
          <Turnstile 
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileExpire}
            onError={() => setTurnstileToken(null)}
            className="flex justify-center"
          />
          {!turnstileToken && (
            <p className="text-xs text-amber-600">
              Complete the verification above to submit
            </p>
          )}
        </div>
        
        <p className="text-xs text-slate-500">
          We avoid storing personally identifiable information until you create an account.
          Guest entries expire after 24 hours.
        </p>
      </CardContent>
      <CardFooter className="p-0">
        <SubmitButton disabled={!turnstileToken} />
      </CardFooter>
    </form>
  )
}
