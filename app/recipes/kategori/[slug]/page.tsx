import { redirect } from "next/navigation";
interface Props { params: Promise<{ slug: string }>; }
export default async function RecipeKategoriRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/tarifler/kategori/${slug}`);
}
