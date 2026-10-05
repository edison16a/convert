import type { Category } from "@/features/formats/types";
import { Icon, type IconProps } from "./Icon";

export const ImageIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
  </Icon>
);

export const DocumentIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 3.5h6.5L19 9v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18V6A2.5 2.5 0 0 1 7.5 3.5Z" />
    <path d="M13 3.8V9h5.2M8.5 13h7M8.5 16.5h5" />
  </Icon>
);

export const TableIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="3" />
    <path d="M3.5 10h17M3.5 14.5h17M9.5 5v14" />
  </Icon>
);

export const VideoIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="6" width="13" height="12" rx="3" />
    <path d="m16 10.5 4.5-2.5v8L16 13.5" />
  </Icon>
);

export const AudioIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 17.5V6.5l10-2v11" />
    <circle cx="6.5" cy="17.5" r="2.5" />
    <circle cx="16.5" cy="15.5" r="2.5" />
  </Icon>
);

export const FileIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 3.5h6.5L19 9v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18V6A2.5 2.5 0 0 1 7.5 3.5Z" />
    <path d="M13 3.8V9h5.2" />
  </Icon>
);

const BY_CATEGORY: Record<Category, (p: IconProps) => React.JSX.Element> = {
  image: ImageIcon,
  audio: AudioIcon,
  video: VideoIcon,
  document: DocumentIcon,
  data: TableIcon,
  archive: FileIcon,
};

/** The icon for a category. Unknown files get a plain page. */
export function CategoryIcon({ category, ...rest }: IconProps & { category: Category | null }) {
  const Component = category ? BY_CATEGORY[category] : FileIcon;
  return <Component {...rest} />;
}
