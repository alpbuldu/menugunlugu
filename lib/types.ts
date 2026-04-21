export type Category = "soup" | "main" | "side" | "dessert";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface AdminProfile {
  id: number;
  username: string;
  avatar_url: string | null;
  updated_at: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected";
export type MenuStatus = "draft" | "published";

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  category: Category;
  description: string | null;
  seo_title: string | null;
  seo_keywords: string | null;
  ingredients: string;
  instructions: string;
  image_url: string | null;
  servings: number | null;
  created_at: string;
  updated_at: string | null;
  submitted_by: string | null;
}

export interface Menu {
  id: string;
  date: string; // ISO date: "2024-01-15"
  soup_id: string;
  main_id: string;
  side_id: string;
  dessert_id: string;
  status: MenuStatus;
  created_at: string;
  // Joined relations
  soup?: Recipe;
  main?: Recipe;
  side?: Recipe;
  dessert?: Recipe;
}

export interface MenuWithRecipes extends Menu {
  soup: Recipe;
  main: Recipe;
  side: Recipe;
  dessert: Recipe;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  category_id: string | null;
  published: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_keywords: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category?: BlogCategory | null;
}
