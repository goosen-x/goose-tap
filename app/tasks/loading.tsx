export default function TasksLoading() {
  return (
    <div className="flex flex-col gap-3">
      {/* Daily reward skeleton */}
      <div className="h-20 w-full bg-secondary/50 rounded-lg animate-pulse" />
      {/* Task cards skeleton */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 w-full bg-secondary/50 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
