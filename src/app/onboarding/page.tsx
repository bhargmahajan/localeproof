'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { submitPhone } from '@/app/actions/onboarding'

export default function OnboardingPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Grab the session token when the page loads
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setToken(data.session.access_token)
    })
  }, [])

  const handleSubmit = async (formData: FormData) => {
    formData.append('token', token) // Attach the token for the server action
    const res = await submitPhone(formData)
    
    if (res.error) {
      setError(res.error)
    } else {
      router.push('/') // Success! Send them back to the main app
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full p-6 border rounded-lg shadow-sm bg-slate-900 border-slate-800 text-white">
        <h1 className="text-xl font-bold mb-4">Unlock Your 2 Free Credits</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="tel" 
            name="phone" 
            required 
            placeholder="9876543210"
            className="p-3 border border-slate-800 bg-slate-950 rounded-md"
          />
          <button type="submit" className="bg-blue-600 text-white p-3 rounded-md font-medium hover:bg-blue-500 transition">
            Verify & Unlock
          </button>
        </form>
      </div>
    </div>
  )
}