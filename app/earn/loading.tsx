export default function EarnLoading() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 w-full bg-secondary/50 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
