'use client'

import { useState } from 'react'

interface DebugLog {
    timestamp: string
    level: 'info' | 'success' | 'warning' | 'error'
    message: string
    data?: any
}

export default function DebugPage() {
    const [isbn, setIsbn] = useState('')
    const [logs, setLogs] = useState<DebugLog[]>([])
    const [isScanning, setIsScanning] = useState(false)

    const addLog = (level: DebugLog['level'], message: string, data?: any) => {
        setLogs(prev => [...prev, {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        }])
    }

    const handleScan = async () => {
        if (!isbn.trim()) {
            addLog('error', 'Please enter an ISBN')
            return
        }

        setLogs([])
        setIsScanning(true)
        addLog('info', `Starting scan for ISBN: ${isbn}`)

        try {
            const response = await fetch('/api/scan-isbn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isbn: isbn.trim() })
            })

            if (!response.ok) {
                addLog('error', `HTTP Error: ${response.status} ${response.statusText}`)
                setIsScanning(false)
                return
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
                addLog('error', 'No response body')
                setIsScanning(false)
                return
            }

            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    addLog('success', 'Scan completed')
                    break
                }

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)

                        if (data === '[DONE]') {
                            addLog('success', 'Stream ended')
                            continue
                        }

                        try {
                            const parsed = JSON.parse(data)

                            if (parsed.type === 'progress') {
                                addLog('info', parsed.message)
                            } else if (parsed.type === 'complete') {
                                addLog('success', 'Scan complete!', parsed.data)
                            } else if (parsed.type === 'error') {
                                addLog('error', parsed.message, parsed.error)
                            } else if (parsed.type === 'ambiguous') {
                                addLog('warning', 'Multiple books found', parsed.candidates)
                            } else {
                                addLog('info', 'Received data', parsed)
                            }
                        } catch (e) {
                            // Ignore parse errors for non-JSON chunks
                        }
                    }
                }
            }
        } catch (error) {
            addLog('error', 'Scan failed', error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setIsScanning(false)
        }
    }

    const getLevelColor = (level: DebugLog['level']) => {
        switch (level) {
            case 'info': return 'text-blue-600 bg-blue-50'
            case 'success': return 'text-green-600 bg-green-50'
            case 'warning': return 'text-yellow-600 bg-yellow-50'
            case 'error': return 'text-red-600 bg-red-50'
        }
    }

    const getLevelIcon = (level: DebugLog['level']) => {
        switch (level) {
            case 'info': return 'ℹ️'
            case 'success': return '✅'
            case 'warning': return '⚠️'
            case 'error': return '❌'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold mb-2">📊 ISBN Scanner Debug Console</h1>
                    <p className="text-gray-600 mb-6">Verbose logging for debugging the book scanning process</p>

                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={isbn}
                            onChange={(e) => setIsbn(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleScan()}
                            placeholder="Enter ISBN (e.g., 9781542016414)"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isScanning}
                        />
                        <button
                            onClick={handleScan}
                            disabled={isScanning}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                        >
                            {isScanning ? '🔄 Scanning...' : '🔍 Scan'}
                        </button>
                        <button
                            onClick={() => setLogs([])}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                        >
                            🗑️ Clear
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Debug Logs</h2>
                        <span className="text-sm text-gray-500">{logs.length} entries</span>
                    </div>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {logs.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-lg">No logs yet</p>
                                <p className="text-sm">Enter an ISBN and click Scan to start debugging</p>
                            </div>
                        ) : (
                            logs.map((log, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border-l-4 ${getLevelColor(log.level)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{getLevelIcon(log.level)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono text-gray-500">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </span>
                                                <span className={`text-xs font-semibold uppercase ${log.level === 'error' ? 'text-red-600' : log.level === 'success' ? 'text-green-600' : log.level === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`}>
                                                    {log.level}
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900">{log.message}</p>
                                            {log.data && (
                                                <details className="mt-2">
                                                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                                                        View data
                                                    </summary>
                                                    <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto">
                                                        {JSON.stringify(log.data, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
