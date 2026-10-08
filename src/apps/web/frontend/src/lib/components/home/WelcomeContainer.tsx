import type { WelcomeContainerProps } from '$types/sections/home'

export default function WelcomeContainer({ isVisible, children }: WelcomeContainerProps) {
  return isVisible ? (
    <div className="w-full max-w-[800px] mx-auto flex min-h-full flex-col justify-center gap-6 py-8 sm:py-12">
      {children}
    </div>
  ) : null
}
