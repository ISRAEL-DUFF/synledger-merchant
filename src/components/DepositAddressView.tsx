import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, AlertCircle, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { DepositSession } from '@/hooks/useDepositSession';
import { TokenSymbol } from '@/lib/chains-config';

interface DepositAddressViewProps {
    session: DepositSession | null;
    loading: boolean;
    error: string | null;
    currency: TokenSymbol;
    amount: string;
    urlParentOrigin?: string;
    onRetry?: () => void;
    onGoBack?: () => void;
}

export const DepositAddressView: React.FC<DepositAddressViewProps> = ({
    session,
    loading,
    error,
    currency,
    amount,
    urlParentOrigin,
    onRetry,
    onGoBack
}) => {
    const [copiedAddress, setCopiedAddress] = React.useState(false);
    const [copiedAmount, setCopiedAmount] = React.useState(false);

    React.useEffect(() => {
        if (!session || session.status !== 'SETTLED' || !urlParentOrigin) return;

        const timeoutId = window.setTimeout(() => {
            window.parent.postMessage(
                {
                    type: 'PAYMENT_SUCCESS',
                    data: {
                        reference: session.id,
                        status: session.status,
                        amount: amount,
                    },
                },
                urlParentOrigin,
            );
        }, 4000);

        return () => window.clearTimeout(timeoutId);
    }, [session, urlParentOrigin, amount]);

    const copyToClipboard = async (text: string, type: 'address' | 'amount') => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for non-secure contexts
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (!successful) throw new Error('copy command was unsuccessful');
            }

            if (type === 'address') {
                setCopiedAddress(true);
                setTimeout(() => setCopiedAddress(false), 2000);
            } else {
                setCopiedAmount(true);
                setTimeout(() => setCopiedAmount(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in zoom-in duration-300">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium">Generating unique deposit address...</p>
                <p className="text-xs text-muted-foreground/70 text-center max-w-xs">
                    This address is generated specifically for this order. It will expire soon.
                </p>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Generation Failed</h3>
                <p className="text-sm text-muted-foreground">{error || 'Could not create a deposit session.'}</p>

                <div className="flex gap-3 justify-center mt-6">
                    {onGoBack && (
                        <button onClick={onGoBack} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                            Go Back
                        </button>
                    )}
                    {onRetry && (
                        <button onClick={onRetry} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm">
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const { status, depositAddress, qrData, expectedAmount, confirmations, requiredConfirmations = 10 } = session;

    // Terminal states
    if (status === 'EXPIRED') {
        return (
            <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-warning/10 text-warning rounded-full flex items-center justify-center">
                    <Clock size={24} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Session Expired</h3>
                <p className="text-sm text-muted-foreground">The time limit to send the deposit has passed.</p>
                <button onClick={onGoBack} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm w-full">
                    Start New Payment
                </button>
            </div>
        );
    }

    if (status === 'FAILED') {
        return (
            <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Payment Failed</h3>
                <p className="text-sm text-muted-foreground">{session.failureReason || 'An error occurred during settlement.'}</p>
                <button onClick={onGoBack} className="mt-4 px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm w-full">
                    Close
                </button>
            </div>
        );
    }

    if (status === 'SETTLED') {
        return (
            <div className="py-12 text-center space-y-4 animate-in zoom-in">
                <div className="mx-auto w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Payment Complete!</h3>
                <p className="text-muted-foreground">The merchant has successfully received your payment.</p>
            </div>
        );
    }

    // In-progress states
    if (status === 'DETECTED' || status === 'CONFIRMING' || status === 'CONFIRMED') {
        return (
            <div className="py-8 text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2 animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>

                <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                        {status === 'CONFIRMED' ? 'Confirmed! Settling...' : 'Payment Detected!'}
                    </h3>
                    <p className="text-muted-foreground">
                        {status === 'DETECTED' && 'Waiting for your transaction to be confirmed on the blockchain.'}
                        {status === 'CONFIRMING' && `Confirming transaction... (${confirmations}/${requiredConfirmations})`}
                        {status === 'CONFIRMED' && 'Processing settlement to the merchant. This will just take a moment.'}
                    </p>
                </div>

                <div className="bg-muted rounded-xl p-4 border border-border inline-block min-w-[250px]">
                    <div className="text-sm text-muted-foreground mb-1">Detected Amount</div>
                    <div className="text-xl font-bold text-foreground">{expectedAmount} {currency}</div>
                </div>
            </div>
        );
    }

    // PENDING state
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {onGoBack && (
                <button onClick={onGoBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                    ← Back
                </button>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                <div className="bg-white p-4 rounded-xl inline-block shadow-sm mb-6 border border-border">
                    <QRCodeSVG
                        value={qrData}
                        size={200}
                        level="Q"
                        includeMargin={false}
                    />
                </div>

                <div className="space-y-4 text-left max-w-sm mx-auto">
                    {/* Amount Block */}
                    <div className="bg-background rounded-lg p-3 border border-border flex items-center justify-between group">
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Exact Amount Required</div>
                            <div className="font-mono text-lg font-bold text-foreground">
                                {expectedAmount} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => copyToClipboard(expectedAmount, 'amount')}
                            className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                            title="Copy amount"
                        >
                            {copiedAmount ? <CheckCircle2 size={18} className="text-success" /> : <Copy size={18} />}
                        </button>
                    </div>

                    {/* Address Block */}
                    <div className="bg-background rounded-lg p-3 border border-border flex items-center justify-between group">
                        <div className="truncate mr-4">
                            <div className="text-xs text-muted-foreground mb-1">Deposit Address</div>
                            <div className="font-mono text-sm text-foreground truncate">
                                {depositAddress}
                            </div>
                        </div>
                        <button
                            onClick={() => copyToClipboard(depositAddress, 'address')}
                            className="p-2 hover:bg-muted rounded-md transition-colors flex-shrink-0 text-muted-foreground hover:text-foreground"
                            title="Copy address"
                        >
                            {copiedAddress ? <CheckCircle2 size={18} className="text-success" /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="text-warning flex-shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-warning">
                    <p className="font-medium mb-1">Important</p>
                    <ul className="list-disc leading-tight pl-4 space-y-1">
                        <li>Send exactly <strong>{expectedAmount} {currency}</strong></li>
                        <li>Send only via the <strong>{session.chain}</strong> network</li>
                        <li>This address is valid for 1 transaction only</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
