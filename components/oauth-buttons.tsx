'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function OAuthButtons({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const redirectedTo: string = '/chat'
  const [isLoading, setIsLoading] = useState<{
    github: boolean
    google: boolean
    apple: boolean
  }>({
    github: false,
    google: false,
    apple: false
  })
  const [error, setError] = useState<string | null>(null)

  const handleOAuthLogin = async (provider: 'github' | 'google' | 'apple') => {
    const supabase = createClient()

    setIsLoading((prev) => ({ ...prev, [provider]: true }))
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/oauth?next=${redirectedTo}`,
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading({
        github: false,
        google: false,
        apple: false
      })
    }
  
  }

  return (
    <div className={cn(className)} {...props}>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        className='mb-4'
        variant='outline'
        onClick={() => handleOAuthLogin('google')}
        disabled={isLoading.google}
      >
        {isLoading.google ? 'Waiting on Google...' : 'Continue with Google instead'}
      </Button>

      <Button
        className='mb-4'
        variant='outline'
        onClick={() => handleOAuthLogin('github')}
        disabled={isLoading.github}
      >
        {isLoading.github ? 'Waiting on GitHub...' : 'Continue with GitHub instead'}
      </Button>
    </div>
  )
}