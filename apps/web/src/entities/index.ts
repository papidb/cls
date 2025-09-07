export type Link = {
  id: number;
  slug: string;
  url: string;
  userId: string;
  expiration: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};
