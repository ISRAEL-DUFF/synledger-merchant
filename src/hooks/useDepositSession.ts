import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';

export type DepositSessionStatus = 'PENDING' | 'DETECTED' | 'CONFIRMING' | 'CONFIRMED' | 'SETTLED' | 'EXPIRED' | 'FAILED';

export interface DepositSession {
    id: string;
    depositAddress: string;
    expectedAmountFormatted: string;
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
    const [socket, setSocket] = useState<Socket | null>(null);

    // 1. Create or fetch session when params are ready
    const createSession = useCallback(async (params?: { paymentId?: string }) => {
        if (!chain || !token) return;
        if (!params?.paymentId && !merchantPaymentId) return;

        let paymentId = params?.paymentId || merchantPaymentId;

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
            setSession(newSession);
        } catch (err: any) {
            console.error('Failed to create deposit session:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [merchantPaymentId, chain, token]);

    // 2. WebSocket Connection for Real-time Updates
    useEffect(() => {
        if (!session?.id) return;

        // Connect to the deposit-sessions namespace
        const wsUrl = API_URL.replace('/api', ''); // Adjust if API_URL includes /api suffix
        const newSocket = io(`${wsUrl}/deposit-sessions`, {
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        newSocket.on('connect', () => {
            console.log('Connected to deposit sessions WebSocket');
            newSocket.emit('subscribe', { sessionId: session.id });
        });

        newSocket.on('session.state', (data: DepositSession) => {
            console.log('Session state updated:', data);
            setSession(prev => ({ ...prev, ...data }));
        });

        newSocket.on('deposit.detected', (data) => {
            toast.success('Deposit detected! Waiting for block confirmations...');
        });

        newSocket.on('deposit.confirmed', () => {
            toast.success('Deposit confirmed on the blockchain!');
        });

        newSocket.on('session.settled', () => {
            toast.success('Payment settled to merchant successfully!');
        });

        newSocket.on('session.expired', () => {
            toast.error('Deposit session expired.');
        });

        newSocket.on('session.failed', (data) => {
            toast.error(`Deposit failed: ${data.reason}`);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [session?.id]);

    // 3. Fallback Polling (if WS fails or as a backup)
    useEffect(() => {
        if (!session?.id || ['SETTLED', 'EXPIRED', 'FAILED'].includes(session.status)) return;

        const interval = setInterval(async () => {
            // If socket is connected, skip polling to save requests
            if (socket?.connected) return;

            try {
                const res = await fetch(`${API_URL}/checkout/payments/${merchantPaymentId}/deposit-session/status/${session.id}`);
                if (res.ok) {
                    const data = await res.json();

                    // Only update if status actually changed to avoid unnecessary re-renders
                    if (data.status !== session.status || data.confirmations !== session.confirmations) {
                        setSession(prev => ({ ...prev, ...data }));
                    }
                }
            } catch (err) {
                console.error('Polling failed:', err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [session?.id, session?.status, session?.confirmations, merchantPaymentId, socket?.connected]);

    return {
        session,
        loading,
        error,
        createSession,
        isTerminalState: session ? ['SETTLED', 'EXPIRED', 'FAILED'].includes(session.status) : false
    };
}
