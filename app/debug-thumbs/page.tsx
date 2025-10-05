"use client"

import { ThumbsButtons } from "@/components/thumbs-buttons"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function DebugThumbsPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [warning, setWarning] = useState<{
    id: string
    helpfulCount: number
    notHelpfulCount: number
    userValidation: boolean | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Test warning ID from your database
  const warningId = "3dca3c45-5f0d-4291-983c-594c0c4a72f7"

  // Fetch real data from database
  useEffect(() => {
    const fetchWarning = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("content_warnings")
          .select("id, helpful_count, not_helpful_count")
          .eq("id", warningId)
          .single()
        
        if (error) {
          console.error("Error fetching warning:", error)
          // Fallback to test data
          setWarning({
            id: warningId,
            helpfulCount: 0,
            notHelpfulCount: 0,
            userValidation: null
          })
        } else {
          setWarning({
            id: data.id,
            helpfulCount: data.helpful_count || 0,
            notHelpfulCount: data.not_helpful_count || 0,
            userValidation: null
          })
        }
      } catch (error) {
        console.error("Error:", error)
        // Fallback to test data
        setWarning({
          id: warningId,
          helpfulCount: 0,
          notHelpfulCount: 0,
          userValidation: null
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWarning()
  }, [warningId])

  // Load logs from localStorage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('debug-thumbs-logs')
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs))
      } catch (error) {
        console.error('Failed to parse saved logs:', error)
      }
    }
  }, [])

  // Save logs to localStorage whenever logs change
  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem('debug-thumbs-logs', JSON.stringify(logs))
    }
  }, [logs])

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log
    const originalError = console.error
    
    console.log = (...args) => {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')
      const newLog = `[LOG] ${new Date().toLocaleTimeString()}: ${message}`
      setLogs(prev => {
        const updated = [...prev, newLog]
        localStorage.setItem('debug-thumbs-logs', JSON.stringify(updated))
        return updated
      })
      originalLog(...args)
    }
    
    console.error = (...args) => {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')
      const newLog = `[ERROR] ${new Date().toLocaleTimeString()}: ${message}`
      setLogs(prev => {
        const updated = [...prev, newLog]
        localStorage.setItem('debug-thumbs-logs', JSON.stringify(updated))
        return updated
      })
      originalError(...args)
    }
    
    return () => {
      console.log = originalLog
      console.error = originalError
    }
  }, [])

  const copyLogsToClipboard = () => {
    const logText = logs.join('\n')
    navigator.clipboard.writeText(logText).then(() => {
      alert('Logs copied to clipboard!')
    })
  }

  const clearLogs = () => {
    setLogs([])
    localStorage.removeItem('debug-thumbs-logs')
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Thumbs Buttons</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Test Interface */}
          <div className="space-y-6">
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Test Warning</h2>
              <p className="text-muted-foreground mb-4">
                This is a test content warning for debugging the thumbs functionality.
              </p>
              
              {loading ? (
                <div className="text-center py-4">Loading warning data...</div>
              ) : warning ? (
                <ThumbsButtons
                  warningId={warning.id}
                  helpfulCount={warning.helpfulCount}
                  notHelpfulCount={warning.notHelpfulCount}
                  userValidation={warning.userValidation}
                />
              ) : (
                <div className="text-center py-4 text-red-500">Failed to load warning data</div>
              )}
            </div>

            <div className="p-6 border rounded-lg bg-muted">
              <h3 className="text-lg font-semibold mb-2">Debug Info</h3>
              {loading ? (
                <div className="text-sm">Loading...</div>
              ) : warning ? (
                <div className="text-sm space-y-1">
                  <p><strong>Warning ID:</strong> {warning.id}</p>
                  <p><strong>Helpful Count:</strong> {warning.helpfulCount}</p>
                  <p><strong>Not Helpful Count:</strong> {warning.notHelpfulCount}</p>
                  <p><strong>User Validation:</strong> {warning.userValidation || 'null'}</p>
                </div>
              ) : (
                <div className="text-sm text-red-500">No data available</div>
              )}
            </div>

            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click the thumbs up or thumbs down button</li>
                <li>Watch the terminal logs on the right</li>
                <li>Check if the page refreshes</li>
                <li>Copy logs to clipboard if needed</li>
              </ol>
            </div>
          </div>

          {/* Right Column - Terminal Logs */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Terminal Logs</h3>
              <div className="flex gap-2">
                <button
                  onClick={copyLogsToClipboard}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={clearLogs}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Click the thumbs buttons to see logs here.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
