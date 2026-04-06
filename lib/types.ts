export type Category = "soup" | "main" | "side" | "dessert";
export type MenuStatus = "draft" | "published";

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  category: Category;
  ingredients: string;
  instructions: string;
  image_url: string | null;
  servings: number | null;
  created_at: string;
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
  created_at: string;
  updated_at: string;
  // joined
  category?: BlogCategory | null;
}
