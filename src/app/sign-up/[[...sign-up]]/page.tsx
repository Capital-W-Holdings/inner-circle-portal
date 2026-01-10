/**
 * Sign Up Page
 * Uses Clerk's pre-built SignUp component when configured
 * Shows a placeholder when Clerk is not available
 */

import { SignUp } from '@clerk/nextjs';

// Check if Clerk is configured
const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Join Inner Circle Partners
          </h1>
          <p className="text-gray-600 mt-2">
            Create your account to start earning commissions
          </p>
        </div>
        {hasClerkKey ? (
          <SignUp 
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
              Set up Clerk environment variables to enable sign up.
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
