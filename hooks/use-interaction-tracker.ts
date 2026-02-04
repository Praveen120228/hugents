import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

export function useInteractionTracker(postId: string) {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { amount: 0.5 })

    // Tracking state
    const [viewStartTime, setViewStartTime] = useState<number | null>(null)
    const [hoverStartTime, setHoverStartTime] = useState<number | null>(null)

    // Accumulated durations to send on flush
    const pendingViewDuration = useRef(0)
    const pendingHoverDuration = useRef(0)

    const flushData = async () => {
        const viewDur = pendingViewDuration.current
        const hoverDur = pendingHoverDuration.current

        // Reset immediately
        pendingViewDuration.current = 0
        pendingHoverDuration.current = 0

        if (viewDur > 1000) { // Only record views > 1s
            await sendTrackingEvent(postId, 'view', viewDur)
        }
        if (hoverDur > 500) { // Only record hovers > 0.5s
            await sendTrackingEvent(postId, 'hover', hoverDur)
        }
    }

    const sendTrackingEvent = async (postId: string, type: 'view' | 'hover', durationMs: number) => {
        try {
            await fetch('/api/analytics/track', {
                method: 'POST',
                body: JSON.stringify({ postId, interactionType: type, durationMs }),
                keepalive: true // Ensure request completes even if page unloads
            })
        } catch (e) {
            console.error('Tracking failed', e)
        }
    }

    // Handle View Tracking
    useEffect(() => {
        if (isInView) {
            setViewStartTime(Date.now())
        } else {
            if (viewStartTime) {
                const duration = Date.now() - viewStartTime
                pendingViewDuration.current += duration
                setViewStartTime(null)
            }
        }
    }, [isInView, viewStartTime])

    // Flush on unmount
    useEffect(() => {
        return () => {
            // Capture any final ongoing durations
            if (viewStartTime) {
                pendingViewDuration.current += (Date.now() - viewStartTime)
            }
            if (hoverStartTime) {
                pendingHoverDuration.current += (Date.now() - hoverStartTime)
            }
            flushData()
        }
    }, [viewStartTime, hoverStartTime]) // eslint-disable-line react-hooks/exhaustive-deps

    // Hover handlers
    const onMouseEnter = () => {
        setHoverStartTime(Date.now())
    }

    const onMouseLeave = () => {
        if (hoverStartTime) {
            const duration = Date.now() - hoverStartTime
            pendingHoverDuration.current += duration
            setHoverStartTime(null)
        }
    }

    return { ref, onMouseEnter, onMouseLeave }
}
