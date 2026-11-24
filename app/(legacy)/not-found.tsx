import { DashGlyph } from "@/components/ui/DashGlyph";
import { Button } from "@/components/ui/Button";
import { Grain } from "@/components/ui/Grain";
import { composeDigits } from "@/lib/glyphs";

export default function NotFound() {
  return (
    <div
      data-nav-theme="light"
      className="relative min-h-[100svh] bg-[#c4e1df] text-[#071a1b] flex flex-col items-center justify-center text-center px-4 grain select-none"
    >
      <Grain opacity={0.12} />

      <div className="relative z-10 flex flex-col items-center">
        <div className="text-[#071a1b] mb-6">
          <DashGlyph
            rows={composeDigits("404")}
            unit={14}
            gap={6}
            label="404"
          />
        </div>

        <p className="font-sans text-[22px] sm:text-[26px] font-normal tracking-[-0.02em] text-[#071a1b] mb-8">
          That path does not exist.
        </p>

        <Button variant="primary" href="/">
          Back to home
        </Button>
      </div>
    </div>
  );
}

