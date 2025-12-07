'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email for the correct link.');
        return;
      }

      try {
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
            {status === 'loading' && (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-8 w-8 text-white" />
            )}
            {status === 'error' && (
              <XCircle className="h-8 w-8 text-white" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address.'}
            {status === 'success' && 'Your email has been successfully verified.'}
            {status === 'error' && 'We could not verify your email address.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div
            className={`p-4 rounded-lg ${
              status === 'success'
                ? 'bg-green-50 border border-green-200'
                : status === 'error'
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <p
              className={`text-sm ${
                status === 'success'
                  ? 'text-green-700'
                  : status === 'error'
                  ? 'text-red-700'
                  : 'text-blue-700'
              }`}
            >
              {message}
            </p>
          </div>

          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You can now log in to your account and start using PrintScrap.ai.
              </p>
              <Button
                onClick={handleLoginRedirect}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Go to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                If you continue to have issues, please contact support or try registering again.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleLoginRedirect}
                  variant="outline"
                  className="flex-1"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Register Again
                </Button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-sm text-gray-500">
              This should only take a moment...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
