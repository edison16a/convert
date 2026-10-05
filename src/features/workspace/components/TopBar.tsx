import { SwapIcon } from "@/components/icons/interface";
import { SITE } from "@/config/site";
import { GitHubButton } from "./GitHubButton";

/** The brand on the left and the GitHub link on the right. Nothing else belongs up here. */
export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-2 text-accent-ink">
        <SwapIcon size={20} />
        <span className="text-base font-semibold tracking-tight">{SITE.name}</span>
      </div>
      <GitHubButton />
    </header>
  );
}
