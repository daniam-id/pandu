import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center gap-2">
          <div className="rounded-full bg-brand-accent/20 p-3">
            <AlertTriangle className="h-8 w-8 text-brand-accent" aria-hidden />
          </div>
          <CardTitle className="text-3xl font-bold text-brand-primary">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-base">
            Halaman tidak ditemukan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">
            Rute yang Anda tuju tidak ada di aplikasi Pandu.ai.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link to="/" className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              Kembali ke Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
