

export default function BackgroundEffects() {
    return (
        <>
            <div className="absolute -top-20 -left-20 w-[700px] h-[700px] bg-purple-600 rounded-full blur-[140px] opacity-30 animate-blob pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-teal-500 rounded-full blur-[140px] opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[140px] opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>
        </>
    );
}
