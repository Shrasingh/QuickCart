import Link from "next/link";
import Container from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container>
      <div className="flex flex-col items-center justify-center gap-y-5 px-4 py-24 text-center">
        <p className="text-6xl font-bold text-neutral-900">404</p>
        <h1 className="text-2xl font-semibold text-neutral-800">
          Page not found
        </h1>
        <p className="max-w-md text-neutral-500">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved or no longer exists.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Back to home
        </Link>
      </div>
    </Container>
  );
}
