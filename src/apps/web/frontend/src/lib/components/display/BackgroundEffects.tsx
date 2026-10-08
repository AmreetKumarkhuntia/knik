/** Animated gradient blobs for the page background. */
export default function BackgroundEffects() {
  return (
    <>
      <div
        className="absolute -top-20 -left-20 w-[700px] h-[700px] rounded-full blur-[140px] opacity-30 animate-blob pointer-events-none"
        style={{ backgroundColor: 'var(--color-primary)' }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-[600px] h-[600px] rounded-full blur-[140px] opacity-30 animate-blob animation-delay-2000 pointer-events-none"
        style={{ backgroundColor: 'var(--color-primary-hover)' }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[140px] opacity-20 animate-blob animation-delay-4000 pointer-events-none"
        style={{ backgroundColor: 'var(--color-primary)' }}
      />
    </>
  )
}
