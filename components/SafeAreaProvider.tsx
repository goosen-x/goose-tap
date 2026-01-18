'use client';

export function SafeAreaProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      {children}
    </div>
  );
}
