export type Link = {
  id: number;
  slug: string;
  url: string;
  expiration: string | null;
  description?: string | null;
  createdAt: string;
};
