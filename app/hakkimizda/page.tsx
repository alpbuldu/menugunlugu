import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Menü Günlüğü, her gün ne pişirsem sorusuna ilham veren, dengeli ve ulaşılabilir menüler sunan bir yemek platformudur.",
};

export default function HakkimizdaPage() {
  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-12 sm:py-16">

      <h1 className="text-3xl sm:text-4xl font-bold text-warm-900 mb-2">Hakkımızda</h1>
      <p className="text-warm-500 mb-10">
        <a href="https://www.instagram.com/hikayeliyemekler/" target="_blank" rel="noopener noreferrer"
          className="text-brand-600 font-medium hover:text-brand-700 transition-colors">
          Hikayeli Yemekler
        </a>
        {"'in günlük menü defteri"}
      </p>

      <div className="prose prose-warm max-w-none space-y-6 text-warm-700 leading-relaxed">
        <p>
          <strong className="text-warm-900">Menü Günlüğü</strong>, her gün "ne pişirsem?" sorusuna ilham veren,
          dengeli ve ulaşılabilir menüler sunmak için oluşturulmuş bir yemek platformudur.
          <strong> Günün Menüsü</strong> yaklaşımıyla; çorba, ana yemek, yardımcı lezzet ve tatlıdan oluşan
          dört aşamalı bir plan sunar. Amaç, hem günlük yemek planlamasını kolaylaştırmak hem de sofralara
          çeşitlilik ve denge kazandırmaktır.
        </p>

        <p>
          Platformda yer alan tarifler, herkesin evde rahatlıkla uygulayabileceği şekilde sade, anlaşılır
          ve ölçülü anlatımlarla hazırlanır. Mevsime uygun, pratik ve çoğunlukla Türk mutfağına yakın
          tarifler tercih edilirken, zaman zaman farklı mutfaklardan uyarlanmış lezzetlere de yer verilir.
          Her tarif, hem mutfakta yol gösterici olacak hem de güvenle uygulanabilecek bir yapıdadır.
        </p>

        <p>
          Menü Günlüğü, sadece tarif paylaşan bir site olmanın ötesinde, düzenli yemek planlama alışkanlığı
          kazandırmayı hedefler. Geçmiş menülere kolayca ulaşabileceğiniz arşiv yapısı sayesinde, farklı
          günler için ilham alabilir ve kendi sofranızı planlayabilirsiniz. Her gün yenilenen içerikleriyle,
          mutfağınıza pratiklik ve süreklilik kazandırır.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-warm-200 flex flex-col sm:flex-row gap-4">
        <Link href="/menu"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors">
          🍽️ Günün Menüsünü Gör
        </Link>
        <Link href="/iletisim"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-warm-300 text-warm-700 hover:bg-warm-50 rounded-xl font-medium transition-colors">
          ✉️ Bize Ulaşın
        </Link>
      </div>

    </div>
  );
}
