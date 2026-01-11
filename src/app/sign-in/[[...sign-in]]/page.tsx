/**
 * Sign In Page
 * Uses Clerk's pre-built SignIn component when configured
 * Shows a placeholder when Clerk is not available
 */

import { SignIn } from '@clerk/nextjs';

// Check if Clerk is configured
const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignInPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            DFX RMS
          </h1>
          <p className="text-gray-600 mt-2">
            Sign in to access your partner dashboard
          </p>
        </div>
        {hasClerkKey ? (
          <SignIn 
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-lg',
              },
            }}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600 mb-4">
              Authentication is not configured.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Set up Clerk environment variables to enable sign in.
            </p>
            <a 
              href="/"
              className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Back to Home
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
