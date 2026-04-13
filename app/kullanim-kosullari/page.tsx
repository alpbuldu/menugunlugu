import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kullanım Koşulları | Menü Günlüğü",
  description: "Menü Günlüğü kullanım koşulları ve hizmet şartları.",
};

export default function KullanimKosullariPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-brand-600 hover:underline">← Ana Sayfa</Link>
      </div>

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8 sm:p-12 prose prose-warm max-w-none">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Kullanım Koşulları</h1>
        <p className="text-sm text-warm-400 mb-8">Son güncelleme: Nisan 2025</p>

        <p className="text-warm-700 text-sm leading-relaxed mb-6">
          Menü Günlüğü ("Platform") platformunu kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.
          Lütfen bu koşulları dikkatlice okuyun.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">1. Platform Hakkında</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Menü Günlüğü; günlük menüler, yemek tarifleri ve blog içerikleri sunan bir dijital platformdur.
          Kullanıcılar kayıt olarak tarif ve blog yazısı paylaşabilir, diğer kullanıcıları takip edebilir
          ve içerikleri favorilerine ekleyebilir.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">2. Hesap Oluşturma</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>Platforma üye olmak için geçerli bir e-posta adresi ve en az 6 karakterli bir şifre gereklidir.</li>
          <li>Kullanıcı adı 3–20 karakter arasında olmalı; yalnızca küçük harf, rakam ve alt çizgi içerebilir.</li>
          <li>Kullanıcı adınızı en fazla 3 kez değiştirebilirsiniz.</li>
          <li>Hesap bilgilerinizin güvenliğini sağlamak sizin sorumluluğunuzdadır.</li>
          <li>Başkası adına hesap oluşturulamaz.</li>
        </ul>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">3. İçerik Kuralları</h2>
        <p className="text-warm-700 text-sm leading-relaxed mb-2">Platform'da yayınlanan içerikler aşağıdaki kurallara uygun olmalıdır:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>Paylaşılan tarifler ve blog yazıları özgün olmalı; başkasının eserine ait içerik izinsiz kullanılmamalıdır.</li>
          <li>İçerikler yemek, beslenme ve mutfak kültürüyle ilgili olmalıdır.</li>
          <li>Hakaret, nefret söylemi, müstehcenlik veya yasa dışı içerik paylaşılamaz.</li>
          <li>Yanıltıcı veya yanlış bilgi içeren içerikler yayınlanamaz.</li>
          <li>Reklam ve spam niteliğindeki içeriklere izin verilmez.</li>
        </ul>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">4. İçerik Onay Süreci</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Üyeler tarafından paylaşılan tarif ve blog yazıları, Platform editörleri tarafından incelenerek
          onaylandıktan sonra yayınlanır. Platform, uygunsuz veya kurallara aykırı içerikleri onaylamama
          ya da yayından kaldırma hakkını saklı tutar.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">5. Fikri Mülkiyet</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Platform'a yüklediğiniz içerikler üzerindeki fikri mülkiyet haklarınız size aittir. Platform'da
          yayınlanmak üzere içerik yükleyerek, söz konusu içeriklerin Platform üzerinde görüntülenmesine
          ve paylaşılmasına ücretsiz ve münhasır olmayan lisans vermiş olursunuz.
        </p>
        <p className="text-warm-700 text-sm leading-relaxed mt-2">
          Platform'un arayüzü, logosu, tasarımı ve özgün içerikleri Menü Günlüğü'ne aittir; izinsiz
          kullanılamaz veya çoğaltılamaz.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">6. Hizmetin Değiştirilmesi ve Sona Erdirilmesi</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Platform, önceden haber vermeksizin hizmetini değiştirme, askıya alma veya sona erdirme hakkını saklı tutar.
          Kuralları ihlal eden hesaplar uyarı yapılmaksızın askıya alınabilir veya kapatılabilir.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">7. Sorumluluk Sınırlaması</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Platform, kullanıcı içerikleri nedeniyle ortaya çıkabilecek zararlardan sorumlu tutulamaz.
          Platform'da yer alan tarifler ve bilgiler genel bilgilendirme amaçlıdır; sağlık, alerji veya
          beslenme konularında profesyonel tıbbi tavsiye yerine geçmez.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">8. Geçerli Hukuk</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda Türk mahkemeleri yetkilidir.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">9. Değişiklikler</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Bu koşullar zaman zaman güncellenebilir. Önemli değişiklikler e-posta veya Platform üzerinden
          bildirilecektir. Platforma kullanmaya devam etmeniz güncel koşulları kabul ettiğiniz anlamına gelir.
        </p>

        <div className="mt-10 pt-6 border-t border-warm-100 flex flex-wrap gap-4 text-xs text-warm-400">
          <Link href="/aydinlatma-metni" className="hover:text-brand-600 hover:underline transition-colors">Aydınlatma Metni</Link>
          <Link href="/gizlilik-politikasi" className="hover:text-brand-600 hover:underline transition-colors">Gizlilik Politikası</Link>
        </div>
      </div>
    </div>
  );
}
