export type PortfolioMediaItem = {
  kind: "image" | "video";
  src: string;
  alt: string;
  caption: string;
  poster?: string;
};

export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  slug: string;
  n: string;
  name: string;
  status: string;
  tagline?: string;
  summary: string;
  desc: string;
  stack: string[];
  links: ProjectLink[];
  group: "shipped" | "in-progress";
  featured?: boolean;
  latestRelease?: string;
  features?: string[];
  learned?: string[];
  media?: PortfolioMediaItem[];
};
