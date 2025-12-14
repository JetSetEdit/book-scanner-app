'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Voice {
  voice_id: string
  name: string
  accent?: string
}

interface VoiceAgentProps {
  isbn?: string
  bookId?: string
  className?: string
  voiceId?: string // Optional: specific ElevenLabs voice ID (defaults to Australian)
}

export function VoiceAgent({ isbn, bookId, className, voiceId }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [australianVoices, setAustralianVoices] = useState<Voice[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(voiceId || 'IKne3meq5aSn9XLyUdCD') // Default: Charlie
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [isTestingAI, setIsTestingAI] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const conversationHistoryRef = useRef<Message[]>([])
  const selectedVoiceIdRef = useRef<string>(voiceId || 'IKne3meq5aSn9XLyUdCD')
  const queryQueueRef = useRef<string[]>([])
  const isProcessingQueueRef = useRef<boolean>(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Fetch available Australian voices
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voice/voices')
        if (response.ok) {
          const data = await response.json()
          if (data.australianVoices && data.australianVoices.length > 0) {
            setAustralianVoices(data.australianVoices)
            // Set default voice only if selectedVoiceId hasn't been set yet
            // Don't override user's selection
            setSelectedVoiceId(prev => {
              if (prev === 'IKne3meq5aSn9XLyUdCD' && !voiceId) {
                // Only set default if still using the initial default
                const defaultVoice = data.australianVoices[0].voice_id
                selectedVoiceIdRef.current = defaultVoice // Update ref too
                return defaultVoice
              }
              selectedVoiceIdRef.current = prev // Keep ref in sync
              return prev // Keep current selection
            })
          } else if (data.error) {
            // API key not configured - log warning but continue
            console.warn('Voice selection unavailable:', data.error)
          }
        } else {
          // Gracefully handle missing API key or other errors
          console.warn('Failed to fetch voices:', response.status, response.statusText)
          // Continue without voice selection - will use default voice
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error)
        // Continue without voice selection - will use default voice
      }
    }
    fetchVoices()
  }, [voiceId])

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      handleUserQuery(transcript)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      
      // Handle specific error types
      const errorType = event.error || ''
      if (errorType === 'not-allowed' || errorType === 'NotAllowedError') {
        setPermissionError('Microphone permission denied. Please enable microphone access in your browser settings.')
      } else if (errorType === 'no-speech') {
        setError('No speech detected. Please try again.')
      } else if (errorType === 'audio-capture') {
        setError('No microphone found. Please check your microphone connection.')
      } else if (errorType === 'network') {
        setError('Network error. Please check your connection.')
      } else {
        setError(`Speech recognition error: ${errorType}`)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    synthesisRef.current = window.speechSynthesis

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel()
      }
    }
  }, [])

  const checkMicrophonePermission = async (): Promise<'granted' | 'denied' | 'prompt' | 'error'> => {
    console.log('🔐 Checking microphone permission...')
    
    // Check if we're on HTTPS or localhost (required for microphone access)
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1'
    
    console.log('🔒 Is secure context:', isSecure, 'Protocol:', window.location.protocol, 'Hostname:', window.location.hostname)
    
    if (!isSecure) {
      const currentUrl = window.location.href
      const localhostUrl = currentUrl.replace(window.location.hostname, 'localhost')
      setPermissionError(
        `Microphone access requires HTTPS or localhost. You're accessing via ${window.location.hostname}. ` +
        `Please use: ${localhostUrl} or enable HTTPS.`
      )
      return 'error'
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia not available')
      setError('Microphone access is not available in this browser.')
      return 'error'
    }

    // Try to check permission status using Permissions API (if available)
    try {
      if (navigator.permissions && navigator.permissions.query) {
        console.log('📋 Checking permission status via Permissions API...')
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        console.log('📊 Permission state:', result.state)
        
        if (result.state === 'denied') {
          setPermissionError('Microphone permission denied. Please enable microphone access in your browser settings (click the lock icon in the address bar) and refresh the page.')
          return 'denied'
        }
        if (result.state === 'granted') {
          console.log('✅ Permission already granted')
          return 'granted'
        }
        // If 'prompt', we'll request it below
        console.log('⏳ Permission state is "prompt", will request...')
      }
    } catch (e) {
      // Permissions API might not be supported, that's okay
      console.log('⚠️ Permissions API not available, will request directly:', e)
    }

    // Request microphone permission explicitly (this will prompt if needed)
    console.log('🎤 Requesting microphone access via getUserMedia...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('✅ Microphone access granted!')
      // Stop the stream immediately - we just wanted permission
      stream.getTracks().forEach(track => track.stop())
      setPermissionError(null)
      return 'granted'
    } catch (err: any) {
      console.error('❌ getUserMedia error:', err)
      let errorMsg = 'Microphone permission denied'
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission denied. Please click the lock icon in your browser\'s address bar and allow microphone access, then refresh the page.'
      } else if (err?.name === 'NotFoundError') {
        errorMsg = 'No microphone found. Please check your microphone connection.'
      } else if (err?.name === 'NotReadableError') {
        errorMsg = 'Microphone is already in use by another application.'
      }
      setPermissionError(errorMsg)
      return 'denied'
    }
  }

  const startListening = async () => {
    console.log('🎤 startListening called')
    
    // Clear previous errors
    setError(null)
    setPermissionError(null)

    if (!recognitionRef.current) {
      console.error('❌ Speech recognition not available')
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    console.log('🔍 Checking microphone permission...')
    // Check and request microphone permission first
    const permissionStatus = await checkMicrophonePermission()
    console.log('📊 Permission status:', permissionStatus)
    
    if (permissionStatus === 'denied' || permissionStatus === 'error') {
      console.log('❌ Permission denied or error')
      return
    }

    console.log('✅ Permission granted, starting speech recognition...')
    // Now start speech recognition (it may also prompt, but we've already requested permission)
    try {
      recognitionRef.current.start()
      setIsListening(true)
      console.log('🎙️ Speech recognition started')
    } catch (error: any) {
      console.error('❌ Error starting recognition:', error)
      setIsListening(false)
      
      // Handle permission errors
      if (error?.name === 'NotAllowedError' || error?.message?.includes('not-allowed')) {
        setPermissionError('Microphone permission denied. Please click the lock icon in your browser\'s address bar and allow microphone access, then refresh the page.')
      } else {
        setError(`Failed to start listening: ${error?.message || 'Unknown error'}`)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleUserQuery = async (query: string) => {
    if (!query.trim()) return

    // If currently speaking, queue this query
    if (isSpeaking) {
      console.log('⏸️ Currently speaking, queuing query:', query)
      queryQueueRef.current.push(query)
      return
    }

    // Process the query
    await processQuery(query)
  }

  const processQuery = async (query: string) => {
    // Prevent multiple simultaneous queries
    if (isProcessingQueueRef.current) {
      console.log('⏸️ Already processing a query, queuing:', query)
      queryQueueRef.current.push(query)
      return
    }

    isProcessingQueueRef.current = true

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: query,
      timestamp: new Date()
    }
    
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    conversationHistoryRef.current = updatedMessages
    setIsProcessing(true)

    try {
      // Call voice agent API
      const response = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          isbn,
          bookId,
          conversationHistory: conversationHistoryRef.current.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response from voice agent')
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.text,
        timestamp: new Date()
      }

      setMessages([...updatedMessages, assistantMessage])
      conversationHistoryRef.current = [...updatedMessages, assistantMessage]

      // Update suggested questions
      if (data.suggestedQuestions) {
        setSuggestedQuestions(data.suggestedQuestions)
      }

      // Speak the response and wait for it to complete
      await speakResponse(data.text)

      // If should continue, automatically start listening again
      if (data.shouldContinue) {
        setTimeout(() => {
          if (!isListening && !isSpeaking) {
            startListening()
          }
        }, 1000)
      }

    } catch (error) {
      console.error('Error processing query:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages([...updatedMessages, errorMessage])
    } finally {
      setIsProcessing(false)
      isProcessingQueueRef.current = false
      
      // Process next queued query if any
      if (queryQueueRef.current.length > 0 && !isSpeaking) {
        const nextQuery = queryQueueRef.current.shift()
        if (nextQuery) {
          console.log('▶️ Processing queued query:', nextQuery)
          setTimeout(() => processQuery(nextQuery), 500) // Small delay between queries
        }
      }
    }
  }

  const speakResponse = async (text: string) => {
    setIsSpeaking(true)

    try {
      // Use ref to ensure we always have the latest voice ID (avoids closure issues)
      const currentVoiceId = selectedVoiceIdRef.current || selectedVoiceId || 'IKne3meq5aSn9XLyUdCD'
      console.log('🔊 Attempting ElevenLabs TTS for:', text.substring(0, 50) + '...')
      console.log('🎤 Current selectedVoiceId state:', selectedVoiceId)
      console.log('🎤 Current selectedVoiceIdRef:', selectedVoiceIdRef.current)
      console.log('🎤 Using voiceId for TTS:', currentVoiceId)
      
      // Try ElevenLabs TTS first
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text,
          voiceId: currentVoiceId // Use current selected voice from ref
        })
      })

      console.log('📡 ElevenLabs TTS response status:', response.status)

      if (response.ok) {
        console.log('✅ ElevenLabs TTS successful, playing audio...')
        // Get audio blob
        const audioBlob = await response.blob()
        console.log('🎵 Audio blob size:', audioBlob.size, 'bytes')
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Play audio
        const audio = new Audio(audioUrl)
        currentAudioRef.current = audio
        
        // Create a promise that resolves when audio finishes
        const audioFinished = new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl) // Clean up
            currentAudioRef.current = null
            setIsSpeaking(false)
            console.log('✅ ElevenLabs audio playback completed')
            resolve()
          }
          audio.onerror = (e) => {
            URL.revokeObjectURL(audioUrl) // Clean up
            currentAudioRef.current = null
            console.error('❌ ElevenLabs TTS playback error:', e)
            setIsSpeaking(false)
            reject(e)
          }
        })
        
        await audio.play()
        console.log('▶️ ElevenLabs audio playing')
        
        // Wait for audio to finish before returning
        await audioFinished
        
        // Process next queued query if any
        if (queryQueueRef.current.length > 0) {
          const nextQuery = queryQueueRef.current.shift()
          if (nextQuery) {
            console.log('▶️ Processing queued query after audio:', nextQuery)
            setTimeout(() => processQuery(nextQuery), 500)
          }
        }
        
        return
      } else {
        // If ElevenLabs fails, fall back to browser TTS
        const errorData = await response.json().catch(() => ({}))
        console.warn('⚠️ ElevenLabs TTS failed:', response.status, errorData)
        console.log('Falling back to browser TTS')
        await useBrowserTTS(text)
      }
    } catch (error) {
      console.error('❌ Error with ElevenLabs TTS:', error)
      console.log('Falling back to browser TTS')
      await useBrowserTTS(text)
    } finally {
      // Ensure speaking state is cleared if something went wrong
      if (!currentAudioRef.current) {
        setIsSpeaking(false)
      }
    }
  }

  const useBrowserTTS = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthesisRef.current) {
        setIsSpeaking(false)
        resolve()
        return
      }

      synthesisRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
        
        // Process next queued query if any
        if (queryQueueRef.current.length > 0) {
          const nextQuery = queryQueueRef.current.shift()
          if (nextQuery) {
            console.log('▶️ Processing queued query after browser TTS:', nextQuery)
            setTimeout(() => processQuery(nextQuery), 500)
          }
        }
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        resolve()
      }

      synthesisRef.current.speak(utterance)
    })
  }

  const stopSpeaking = () => {
    // Stop current audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
    }
    setIsSpeaking(false)
    
    // Clear queue when manually stopped
    queryQueueRef.current = []
  }

  const handleSuggestedQuestion = (question: string) => {
    handleUserQuery(question)
  }

  const testAIConnection = async () => {
    setIsTestingAI(true)
    setDebugInfo('Testing AI connection...')
    
    try {
      const testQuery = 'Tell me about this book'
      console.log('🧪 Testing AI with query:', testQuery)
      
      const response = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: testQuery,
          isbn,
          bookId,
          conversationHistory: []
        })
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const data = await response.json()
      console.log('🧪 AI test response:', data)
      
      const isLikelyAI = data.text.length > 100 && !data.text.includes('has') && !data.text.includes('contains')
      setDebugInfo(`✅ Response received!\n\nText: ${data.text.substring(0, 200)}...\n\nLength: ${data.text.length} chars\nLikely AI: ${isLikelyAI ? 'Yes' : 'Possibly template'}\n\nCheck server logs for AI generation details.`)
    } catch (error: any) {
      console.error('🧪 AI test error:', error)
      setDebugInfo(`❌ Error: ${error.message}\n\nCheck server terminal logs for details.`)
    } finally {
      setIsTestingAI(false)
    }
  }

  return (
    <div className={`voice-agent ${className || ''}`}>
      <div className="border rounded-lg p-4 bg-card shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Voice Assistant</h3>
          <div className="flex gap-2">
            {isSpeaking && (
              <Button
                variant="outline"
                size="sm"
                onClick={stopSpeaking}
                aria-label="Stop speaking"
              >
                <VolumeX className="h-4 w-4" />
              </Button>
            )}
            {isListening ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopListening}
                aria-label="Stop listening"
              >
                <MicOff className="h-4 w-4" />
                <span className="ml-2">Listening...</span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={startListening}
                disabled={isProcessing || isSpeaking}
                aria-label="Start listening"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                <span className="ml-2">Ask a question</span>
              </Button>
            )}
          </div>
        </div>

        {/* Voice Selector */}
        {australianVoices.length > 0 && (
          <div className="mb-4">
            <Label htmlFor="voice-select" className="text-sm text-foreground mb-2 block">
              Voice:
            </Label>
            <Select 
              value={selectedVoiceId} 
              onValueChange={(newVoiceId) => {
                const selectedVoice = australianVoices.find(v => v.voice_id === newVoiceId)
                setSelectedVoiceId(newVoiceId)
                selectedVoiceIdRef.current = newVoiceId // Update ref immediately
                toast.success(`Voice changed to ${selectedVoice?.name || 'selected voice'}`)
              }}
            >
              <SelectTrigger id="voice-select" className="w-full">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {australianVoices.map((voice) => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} {voice.accent ? `(${voice.accent})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Conversation History */}
        {messages.length > 0 && (
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggested Questions */}
        {suggestedQuestions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Error Messages */}
        {permissionError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">Microphone Permission Required</p>
            <p className="text-sm text-red-700 mt-1">{permissionError}</p>
            <p className="text-xs text-red-600 mt-2">
              <strong>How to enable:</strong> Click the lock icon in your browser's address bar, then allow microphone access.
            </p>
          </div>
        )}

        {error && !permissionError && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        {/* Debug Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={testAIConnection}
            disabled={isTestingAI || !isbn}
            className="w-full"
          >
            {isTestingAI ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Testing AI...
              </>
            ) : (
              '🧪 Test AI Connection'
            )}
          </Button>
          {debugInfo && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
              {debugInfo}
            </div>
          )}
        </div>

        {/* Help Text */}
        {messages.length === 0 && !error && !permissionError && (
          <div className="text-sm text-gray-500 mt-4">
            <p>Click the microphone to ask questions about this book.</p>
            <p className="mt-1">Try asking:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>"What are the content warnings?"</li>
              <li>"Tell me about this book"</li>
              <li>"What are the severe warnings?"</li>
            </ul>
            <p className="mt-2 text-xs text-gray-400">
              Note: Microphone access is required. Make sure to allow permissions when prompted.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}

