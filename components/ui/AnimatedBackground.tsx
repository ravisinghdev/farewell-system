export default function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-20 overflow-hidden pointer-events-none"
    >
      <div className="absolute -top-40 -left-56 w-[780px] h-[780px] rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4] opacity-40 blur-3xl animate-blob" />
      <div className="absolute -bottom-56 -right-24 w-[640px] h-[640px] rounded-full bg-gradient-to-br from-[#ff7a59] to-[#7c3aed] opacity-25 blur-2xl animate-blob animation-delay-2000" />
    </div>
  );
}
