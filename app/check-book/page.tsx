"use client"

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, Loader2 } from 'lucide-react'

interface CheckStep {
  step: number
  name: string
  status: 'pending' | 'checking' | 'complete'
  data?: any
}

export default function CheckBookPage() {
  const [isbn, setIsbn] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentIsbn, setCurrentIsbn] = useState<string | null>(null)
  const [steps, setSteps] = useState<CheckStep[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!isbn.trim()) return
    
    setLoading(true)
    setError(null)
    setCurrentIsbn(isbn.trim())
    setSteps([
      { step: 1, name: 'Database Check', status: 'pending' },
      { step: 2, name: 'Cover Check', status: 'pending' },
      { step: 3, name: 'Description Check', status: 'pending' },
      { step: 4, name: 'External API Check', status: 'pending' },
      { step: 5, name: 'Content Warnings Check', status: 'pending' },
    ])
    
    try {
      const response = await fetch('/api/check-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn: isbn.trim() })
      })
      
      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            
            if (data.type === 'start') {
              // Initialization
            } else if (data.type === 'check') {
              // Update step to checking
              setSteps(prev => prev.map(s => 
                s.step === data.step 
                  ? { ...s, status: 'checking' as const }
                  : s
              ))
            } else if (data.type === 'result') {
              // Update step with result
              setSteps(prev => prev.map(s => 
                s.step === data.step 
                  ? { ...s, status: 'complete' as const, data: data.data }
                  : s
              ))
            } else if (data.type === 'complete') {
              setLoading(false)
            } else if (data.type === 'error') {
              setError(data.error)
              setLoading(false)
            }
          }
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheck()
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Book Checker</h1>
        <p className="text-muted-foreground">Simple terminal-style book information checker</p>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter ISBN (e.g., 9781501110368)"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleCheck} disabled={loading || !isbn.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Check
              </>
            )}
          </Button>
        </div>
      </Card>

      {currentIsbn && (
        <Card className="p-6 font-mono text-sm bg-slate-950 text-green-400 border-green-800">
          <div className="space-y-1">
            <div className="text-green-300 mb-4">
              📚 Checking ISBN: {currentIsbn}
            </div>
            <div className="text-slate-400 mb-4">──────────────────────────────────────────────────</div>
            
            {steps.map((step) => (
              <div key={step.step} className="mt-4">
                <div className="text-green-300 mb-2">
                  {step.step}. {step.name}:
                  {step.status === 'checking' && (
                    <span className="ml-2 text-yellow-400">
                      <Loader2 className="h-3 w-3 inline animate-spin" /> checking...
                    </span>
                  )}
                </div>
                
                {step.status === 'pending' && (
                  <div className="text-slate-500 ml-4">   ⏳ Waiting...</div>
                )}
                
                {step.status === 'checking' && (
                  <div className="text-yellow-400 ml-4">   🔄 Checking...</div>
                )}
                
                {step.status === 'complete' && step.data && (
                  <>
                    {step.step === 1 && (
                      step.data.found ? (
                        <>
                          <div className="text-green-400 ml-4">   ✅ Found book - y</div>
                          {step.data.title && (
                            <div className="text-slate-300 ml-4">      Title: {step.data.title}</div>
                          )}
                          {step.data.author && (
                            <div className="text-slate-300 ml-4">      Author: {step.data.author}</div>
                          )}
                        </>
                      ) : (
                        <div className="text-red-400 ml-4">   ❌ Found book - n</div>
                      )
                    )}
                    
                    {step.step === 2 && (
                      step.data.found ? (
                        <>
                          <div className="text-green-400 ml-4">   ✅ Found cover - y</div>
                          {step.data.size && (
                            <div className="text-slate-300 ml-4">      Size: {(step.data.size / 1024).toFixed(1)} KB</div>
                          )}
                        </>
                      ) : (
                        <div className="text-red-400 ml-4">   ❌ Found cover - n</div>
                      )
                    )}
                    
                    {step.step === 3 && (
                      step.data.found ? (
                        <>
                          <div className="text-green-400 ml-4">   ✅ Found description - y</div>
                          {step.data.length !== undefined && (
                            <>
                              <div className="text-slate-300 ml-4">      Length: {step.data.length} characters</div>
                              {step.data.isThin && (
                                <div className="text-yellow-400 ml-4">      ⚠️  Thin description (&lt; 150 chars)</div>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <div className="text-red-400 ml-4">   ❌ Found description - n</div>
                      )
                    )}
                    
                    {step.step === 4 && (
                      step.data.found ? (
                        <>
                          <div className="text-green-400 ml-4">   ✅ Found in external APIs - y</div>
                          {step.data.candidates !== undefined && (
                            <div className="text-slate-300 ml-4">      Found {step.data.candidates} candidate(s)</div>
                          )}
                          {step.data.candidateList && step.data.candidateList.length > 0 && (
                            <div className="ml-4 mt-1">
                              {step.data.candidateList.map((c: any, i: number) => (
                                <div key={i} className="text-slate-300">
                                  {'      '}{i + 1}. {c.title} by {c.author || 'Unknown'} ({c.source})
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-red-400 ml-4">   ❌ Found in external APIs - n</div>
                      )
                    )}
                    
                    {step.step === 5 && (
                      step.data.found ? (
                        <>
                          <div className="text-green-400 ml-4">   ✅ Found warnings - y</div>
                          {step.data.count !== undefined && (
                            <div className="text-slate-300 ml-4">      Count: {step.data.count}</div>
                          )}
                          {step.data.severityCounts && (
                            <div className="text-slate-300 ml-4">
                              {'      '}Severity: {Object.entries(step.data.severityCounts).map(([s, c]) => `${s}:${c}`).join(', ')}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-red-400 ml-4">   ❌ Found warnings - n</div>
                      )
                    )}
                  </>
                )}
              </div>
            ))}

            {error && (
              <div className="mt-4 text-red-400">
                <div>Error: {error}</div>
              </div>
            )}

            {!loading && steps.every(s => s.status === 'complete') && (
              <>
                <div className="text-slate-400 mt-4">──────────────────────────────────────────────────</div>
                <div className="text-green-300 mt-4">✅ Check complete!</div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

