import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';

export type DepositSessionStatus = 'PENDING' | 'DETECTED' | 'CONFIRMING' | 'CONFIRMED' | 'SETTLED' | 'EXPIRED' | 'FAILED';

export interface DepositSession {
    id: string;
    depositAddress: string;
    expectedAmount: string;
    chain: string;
    token: string;
    status: DepositSessionStatus;
    expiresAt: string;
    qrData: string;
    confirmations?: number;
    requiredConfirmations?: number;
    failureReason?: string;
}

export function useDepositSession(merchantPaymentId: string | undefined, chain: string | undefined, token: string | undefined) {
    const [session, setSession] = useState<DepositSession | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activePaymentId, setActivePaymentId] = useState<string | null>(merchantPaymentId || null);

    // 1. Create or fetch session when params are ready
    const createSession = useCallback(async (params?: { paymentId?: string }): Promise<DepositSession | null> => {
        if (!chain || !token) return null;
        if (!params?.paymentId && !merchantPaymentId) return null;

        let paymentId = params?.paymentId || merchantPaymentId;
        setActivePaymentId(paymentId || null);

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/checkout/payments/${paymentId}/deposit-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chain, token })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to generate deposit address');
            }

            const newSession = await res.json();
            console.log('Session:>>>>>', newSession)
            setSession(newSession);
            return newSession;
        } catch (err: any) {
            console.error('Failed to create deposit session:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [merchantPaymentId, chain, token]);

    // 2. WebSocket Connection for Real-time Updates
    useEffect(() => {
        if (!session?.id) return;

        // Connect to the deposit-sessions namespace
        const wsUrl = API_URL.replace('/api', ''); // Adjust if API_URL includes /api suffix
        console.log(`[WebSocket] Connecting to: ${wsUrl}/deposit-sessions for session: ${session.id}`);

        const newSocket = io(`${wsUrl}/deposit-sessions`, {
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            transports: ['websocket', 'polling'], // Allow fallback to long polling
        });

        newSocket.on('connect', () => {
            console.log('[WebSocket] Connected to /deposit-sessions namespace');
            newSocket.emit('subscribe', { sessionId: session.id });
        });

        newSocket.on('connect_error', (error) => {
            console.error('[WebSocket] Connection error:', error.message);
        });

        newSocket.on('disconnect', (reason) => {
            console.warn('[WebSocket] Disconnected:', reason);
        });

        newSocket.on('session.state', (data: DepositSession) => {
            console.log('[WebSocket] Session state received:', data);
            setSession(prev => ({ ...prev, ...data }));
        });

        newSocket.on('deposit.detected', (data) => {
            console.log('[WebSocket] Deposit detected:', data);
            toast.success('Deposit detected! Waiting for block confirmations...');
            setSession(prev => prev ? { ...prev, status: 'DETECTED', detectedTxHash: data.txHash } : null);
        });

        newSocket.on('deposit.confirming', (data) => {
            console.log('[WebSocket] Deposit confirming:', data);
            setSession(prev => prev ? { ...prev, status: 'CONFIRMING', confirmations: data.confirmations, requiredConfirmations: data.required } : null);
        });

        newSocket.on('deposit.confirmed', () => {
            console.log('[WebSocket] Deposit confirmed');
            toast.success('Deposit confirmed on the blockchain!');
            setSession(prev => prev ? { ...prev, status: 'CONFIRMED' } : null);
        });

        newSocket.on('session.settled', () => {
            console.log('[WebSocket] Session settled');
            toast.success('Payment settled to merchant successfully!');
            setSession(prev => prev ? { ...prev, status: 'SETTLED' } : null);
        });

        newSocket.on('session.expired', () => {
            console.log('[WebSocket] Session expired');
            toast.error('Deposit session expired.');
            setSession(prev => prev ? { ...prev, status: 'EXPIRED' } : null);
        });

        newSocket.on('session.failed', (data) => {
            console.log('[WebSocket] Session failed:', data);
            toast.error(`Deposit failed: ${data.reason}`);
            setSession(prev => prev ? { ...prev, status: 'FAILED', failureReason: data.reason } : null);
        });

        return () => {
            console.log('[WebSocket] Cleanup: disconnecting socket');
            newSocket.disconnect();
        };
    }, [session?.id]);

    // 3. Fallback Polling (if WS fails or as a backup)
    useEffect(() => {
        if (!session?.id || !activePaymentId || ['SETTLED', 'EXPIRED', 'FAILED'].includes(session.status)) return;

        const interval = setInterval(async () => {
            // Keep polling as a backup even if socket says connected
            // Just in case room subscription or events are not flowing
            try {
                const pollUrl = `${API_URL}/checkout/payments/${activePaymentId}/deposit-session/status/${session.id}`;
                const res = await fetch(pollUrl);

                if (res.ok) {
                    const data = await res.json();
                    // Only update if status actually changed or confirmations increased to avoid unnecessary re-renders
                    if (data.status !== session.status || data.confirmations !== session.confirmations) {
                        console.log('[Polling] Update received:', data);
                        setSession(prev => ({ ...prev, ...data }));
                    }
                } else {
                    console.warn(`[Polling] Failed with status ${res.status} for ${pollUrl}`);
                }
            } catch (err) {
                console.error('[Polling] Error:', err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [session?.id, session?.status, session?.confirmations, activePaymentId]);

    return {
        session,
        loading,
        error,
        createSession,
        isTerminalState: session ? ['SETTLED', 'EXPIRED', 'FAILED'].includes(session.status) : false
    };
}
