"use client";

import { login, signInAnonymously } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
    useState,
    useTransition,
    useEffect,
    Suspense,
    useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Turnstile } from "@/components/turnstile";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            className="w-full hover:cursor-pointer"
            type="submit"
            disabled={pending}
        >
            {pending ? "Signing in..." : "Sign In"}
        </Button>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get("next") || "/book";
    const autoGuest = searchParams.get("guest") === "true";

    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [showTurnstile, setShowTurnstile] = useState(autoGuest);

    const handleTurnstileVerify = useCallback((token: string) => {
        setTurnstileToken(token);
        setError(null);
    }, []);

    const handleTurnstileExpire = useCallback(() => {
        setTurnstileToken(null);
    }, []);

    const handleTurnstileError = useCallback(() => {
        setTurnstileToken(null);
        setError("Security verification failed. Please try again.");
    }, []);

    // proceed with guest sign in after turnstile is verified for auto-guest
    useEffect(() => {
        if (autoGuest && turnstileToken && !isPending) {
            startTransition(async () => {
                const result = await signInAnonymously(turnstileToken);
                if (result.error) {
                    setError(result.error);
                } else {
                    router.push(nextUrl);
                }
            });
        }
    }, [autoGuest, turnstileToken, router, nextUrl, isPending]);

    async function handleSubmit(formData: FormData) {
        const res = await login(formData);
        if (res?.error) {
            setError(res.error);
        }
    }

    function handleGuestContinue() {
        if (!showTurnstile) {
            setShowTurnstile(true);
            return;
        }

        if (!turnstileToken) {
            return;
        }

        startTransition(async () => {
            const result = await signInAnonymously(turnstileToken);
            if (result.error) {
                setError(result.error);
            } else {
                router.push(nextUrl);
            }
        });
    }

    // show loading state for auto-guest after verification
    if (autoGuest && turnstileToken && isPending) {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        Setting up your guest session...
                    </p>
                </CardContent>
            </Card>
        );
    }

    // show turnstile for auto-guest before proceeding
    if (autoGuest && !turnstileToken) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-blue-900">
                        CareLink
                    </CardTitle>
                    <CardDescription className="text-center">
                        Quick security check before continuing
                    </CardDescription>
                </CardHeader>
                <CardContent className="py-6 flex flex-col items-center space-y-4">
                    <Turnstile
                        onVerify={handleTurnstileVerify}
                        onExpire={handleTurnstileExpire}
                        onError={handleTurnstileError}
                        appearance="always"
                    />
                    <p className="text-xs text-gray-500 text-center">
                        This helps us prevent spam and protect our services
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mb-[5rem]">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center text-blue-900">
                    CareLink
                </CardTitle>
                <CardDescription className="text-center">
                    Enter your email to sign in to your account
                </CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 mt-4">
                    <SubmitButton />

                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">
                                Or
                            </span>
                        </div>
                    </div>

                    {showTurnstile && (
                        <div className="space-y-2">
                            <Turnstile
                                onVerify={handleTurnstileVerify}
                                onExpire={handleTurnstileExpire}
                                onError={handleTurnstileError}
                                appearance="always"
                                className="flex justify-center"
                            />
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full hover:cursor-pointer"
                        onClick={handleGuestContinue}
                        disabled={
                            isPending || (showTurnstile && !turnstileToken)
                        }
                    >
                        {isPending
                            ? "Loading..."
                            : showTurnstile
                            ? turnstileToken
                                ? "Continue as Guest"
                                : "Waiting for verification..."
                            : "Continue as Guest"}
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                        Browse doctors and get AI consultations without an
                        account
                    </p>

                    <div className="text-sm text-center text-gray-500">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="text-blue-600 hover:underline hover:cursor-pointer"
                        >
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}

function LoadingCard() {
    return (
        <Card className="w-full max-w-md">
            <CardContent className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
            </CardContent>
        </Card>
    );
}

export default function LoginPage() {
  useEffect(() => {
    // remove scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  })

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <Suspense fallback={<LoadingCard />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
