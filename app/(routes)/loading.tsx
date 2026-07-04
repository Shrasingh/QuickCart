import Container from "@/components/ui/container";

const SkeletonCard = () => (
  <div className="space-y-3">
    <div className="aspect-square w-full rounded-xl bg-neutral-200 animate-pulse" />
    <div className="h-4 w-3/4 rounded bg-neutral-200 animate-pulse" />
    <div className="h-3 w-1/2 rounded bg-neutral-200 animate-pulse" />
    <div className="h-4 w-1/4 rounded bg-neutral-200 animate-pulse" />
  </div>
);

export default function Loading() {
  return (
    <Container>
      <div className="space-y-10 pb-8">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="aspect-square md:aspect-[2.4/1] w-full rounded-xl bg-neutral-200 animate-pulse" />
        </div>
        <div className="flex flex-col gap-y-8 px-4 sm:px-6 lg:px-8">
          <div className="h-7 w-48 rounded bg-neutral-200 animate-pulse" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
