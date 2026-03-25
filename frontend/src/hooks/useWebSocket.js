import { useState, useEffect, useCallback, useRef } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

/**
 * Custom hook to manage WebSocket connection for real-time analytics.
 * 
 * @param {string} sessionId - The session ID for this connection
 * @returns {object} - { isConnected, sendEvent, lastMessage, error }
 */
function useWebSocket(sessionId) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  const connect = useCallback(() => {
    if (!sessionId) return

    try {
      const ws = new WebSocket(`${WS_URL}/ws/session/${sessionId}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e)
        }
      }

      ws.onerror = (e) => {
        console.error('WebSocket error:', e)
        setError('Connection error')
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        
        // Attempt to reconnect
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`Reconnecting in ${delay}ms...`)
          
          reconnectTimerRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          setError('Max reconnection attempts reached')
        }
      }
    } catch (e) {
      console.error('Failed to create WebSocket:', e)
      setError('Failed to connect')
    }
  }, [sessionId])

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  const sendEvent = useCallback((eventType, data = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: eventType,
        ...data,
        timestamp: Date.now(),
      }
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send event')
    }
  }, [])

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [sessionId, connect, disconnect])

  return {
    isConnected,
    sendEvent,
    lastMessage,
    error,
    disconnect,
    reconnect: connect,
  }
}

export default useWebSocket
