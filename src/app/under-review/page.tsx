
'use client';

import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Hourglass, LogOut } from 'lucide-react';

export default function UnderReviewPage() {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-2xl">
                    <CardHeader className="items-center text-center">
                        <Logo />
                        <CardTitle className="font-headline text-3xl pt-4">
                            Application Submitted
                        </CardTitle>
                        <CardDescription>
                            Thank you for your interest.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Hourglass className="mx-auto h-16 w-16 text-primary mb-4 animate-pulse" />
                        <p className="text-lg font-medium">Your profile is under review.</p>
                        <p className="text-muted-foreground mt-2">
                            An administrator will review your application shortly. You will be notified once your account is approved.
                        </p>
                    </CardContent>
                    <CardContent>
                         <Button onClick={handleLogout} variant="outline" className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
