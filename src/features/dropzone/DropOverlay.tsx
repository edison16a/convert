/**
 * The full screen hint shown while a file is dragged over the page. It never
 * takes pointer events, so the drop still lands on the window underneath.
 */
export function DropOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-3 z-40 flex items-center justify-center rounded-[2rem] border-2 border-dashed border-accent-ink bg-bg/85 shadow-[0_20px_60px_rgb(0_0_0/0.12)] backdrop-blur-sm transition duration-150 ${
        visible ? "scale-100 opacity-100" : "scale-[0.985] opacity-0"
      }`}
    >
      <p className="text-2xl font-semibold tracking-tight">Drop to add files</p>
    </div>
  );
}
