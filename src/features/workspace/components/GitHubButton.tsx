import { GitHubIcon } from "@/components/icons/brand";
import { SITE } from "@/config/site";

/** A quiet pill that links to the source. Uses the official GitHub mark. */
export function GitHubButton() {
  return (
    <a
      href={SITE.repoUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3.5 text-sm font-medium text-fg transition hover:bg-surface"
    >
      <GitHubIcon size={16} />
      View on GitHub
    </a>
  );
}
