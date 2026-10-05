import { Workspace } from "@/features/workspace/components/Workspace";

/**
 * The only page. The server renders the empty screen (heading, copy and
 * privacy note) so search engines and slow connections see real content
 * before any JavaScript arrives.
 */
export default function Page() {
  return <Workspace />;
}
