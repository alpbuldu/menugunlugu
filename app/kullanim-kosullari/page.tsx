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
        <p className="text-sm text-warm-400 mb-2">Son güncelleme: Mayıs 2026</p>
        <p className="text-warm-700 text-sm leading-relaxed mb-8">
          Menü Günlüğü platformunu (web sitesi ve mobil uygulama) kullanarak aşağıdaki koşulları kabul etmiş
          sayılırsınız. Lütfen bu koşulları dikkatlice okuyun.
        </p>

        {/* 1 */}
        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">1. Hizmetin Tanımı ve Kullanım Amacı</h2>
        <p className="text-warm-700 text-sm leading-relaxed mb-2">
          Menü Günlüğü (&ldquo;Platform&rdquo;), kullanıcıların günlük menüler keşfedebileceği, yemek tarifleri
          paylaşabileceği ve mutfak topluluğuyla bağlantı kurabileceği bir dijital platformdur.
          Hikayeli Yemekler ekosisteminin bir parçasıdır.
        </p>
        <p className="text-warm-700 text-sm leading-relaxed">
          Platform; web sitesi (menugunlugu.com) ve mobil uygulama (iOS/Android) üzerinden sunulmaktadır.
          Tüm hizmetler yalnızca kişisel, ticari olmayan amaçlarla kullanılabilir; içerikler izinsiz
          kopyalanamaz, dağıtılamaz veya ticari amaçla kullanılamaz.
        </p>

        {/* 2 */}
        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">2. Üyelik ve Hesap Güvenliği</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>Platforma üye olmak için geçerli bir e-posta adresi ve en az 6 karakterli bir şifre gereklidir.</li>
          <li>13 yaşından küçük kişiler platformu kullanamazlar; 18 yaşından küçük kullanıcıların veli/vasi onayı alması gerekmektedir.</li>
          <li>Kullanıcı adı 3–20 karakter arasında olmalı; yalnızca küçük harf, rakam ve alt çizgi içerebilir.</li>
          <li>Kullanıcı adınızı en fazla 3 kez değiştirebilirsiniz.</li>
          <li>Başkası adına hesap oluşturulamaz.</li>
          <li>Hesabınızın güvenliğinden siz sorumlusunuz. Şüpheli aktiviteleri derhal <a href="mailto:iletisim@menugunlugu.com" className="text-brand-600 hover:underline">iletisim@menugunlugu.com</a> adresine bildirin.</li>
        </ul>

        {/* 3 */}
        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">3. İçerik Kuralları ve Yayın Politikası</h2>
        <p className="text-warm-700 text-sm leading-relaxed mb-2">
          Paylaştığınız tüm içerikler (tarif, blog yazısı, yorum, fotoğraf) aşağıdaki kurallara uygun olmalıdır:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>İçerikler yemek, mutfak ve beslenme konularıyla ilgili olmalıdır.</li>
          <li>Özgün olmalı; başkasına ait içerik izinsiz kullanılmamalıdır.</li>
          <li>Hakaret, nefret söylemi, müstehcenlik veya yasa dışı içerik paylaşılamaz.</li>
          <li>Yanıltıcı, yanlış veya spam niteliğinde içeriklere izin verilmez.</li>
          <li>Reklam amaçlı veya ticari tanıtım içerikleri paylaşılamaz.</li>
        </ul>
        <p className="text-warm-700 text-sm leading-relaxed mt-2">
          Üye içerikleri Platform editörleri tarafından incelenerek onaylandıktan sonra yayınlanır.
          Platform, uygunsuz içerikleri onaylamama veya yayından kaldırma hakkını saklı tutar.
        </p>

        {/* 4 */}
        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">4. Platform&rsquo;un Yetkileri</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>Teknik, yasal veya operasyonel gereklilikler nedeniyle hizmeti önceden bildirim yapmaksızın geçici olarak askıya alabilir ya da tamamen sonlandırabilir.</li>
          <li>Kullanım koşullarını ihlal eden hesapları uyarı yapmaksızın askıya alabilir veya kalıcı olarak kapatabilir.</li>
          <li>Platform arayüzü, tasarımı, logosu ve özgün içerikler Menü Günlüğü / Hikayeli Yemekler&rsquo;e aittir; izinsiz kullanılamaz veya çoğaltılamaz.</li>
          <li>Kullanıcı içeriklerini Platform içinde görüntüleme ve sosyal medya hesaplarında paylaşma amacıyla ücretsiz, münhasır olmayan lisans kullanabilir.</li>
        </ul>

        {/* 5 */}
        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">5. Fikri Mülkiyet</h2>
        <p className="text-warm-700 text-sm leading-relaxed mb-2">
          Platform&rsquo;a yüklediğiniz içerikler üzerindeki fikri mülkiyet haklarınız size aittir. İçerik
          paylaşarak Platform&rsquo;un söz konusu içerikleri yayınlamasına, sosyal medya hesaplarında
          kullanmasına ve toplulukla paylaşmasına ücretsiz, münhasır olmayan lisans vermiş olursunuz.
        </p>
        <p className="text-warm-700 text-sm leading-relaxed">
          Platform&rsquo;un arayüzü, logosu, tasarımı ve Platform&rsquo;a özgü tüm içerikler Hikayeli Yemekler
          mülkiyetindedir. Bu materyaller izin alınmadan kullanılamaz, kopyalanamaz veya dağıtılamaz.
        </p>

        {/* 6 */}
        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">6. Gizlilik ve Kişisel Veriler</h2>
        <p className="text-warm-700 text-sm leading-relaxed mb-2">
          Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında korunmaktadır.
          Verileriniz yalnızca hizmetin işleyişi için gerekli olduğu ölçüde kullanılır; üçüncü taraflarla
          ticari amaçlarla paylaşılmaz.
        </p>
        <p className="text-warm-700 text-sm leading-relaxed">
          Detaylı bilgi için{" "}
          <Link href="/gizlilik-politikasi" className="text-brand-600 hover:underline">Gizlilik Politikamızı</Link>
          {" "}ve{" "}
          <Link href="/aydinlatma-metni" className="text-brand-600 hover:underline">KVKK Aydınlatma Metnimizi</Link>
          {" "}incelemenizi öneririz.
        </p>

        {/* 7 */}
        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">7. Yer Sağlayıcı Statüsü</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Menü Günlüğü, 5651 sayılı Kanun kapsamında yer sağlayıcı konumundadır. Platform, kullanıcılar
          tarafından oluşturulan içeriklerden doğrudan sorumlu değildir; ancak hukuka aykırı olduğu
          bildirilen içerikleri inceleyerek kaldırma hakkını saklı tutar.
        </p>

        {/* 8 */}
        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">8. Sorumluluk Sınırlaması</h2>
        <p className="text-warm-700 text-sm leading-relaxed mb-2">
          Platform, kullanıcı içeriklerinin doğruluğunu, tamlığını veya güncelliğini garanti etmez.
          Paylaşılan tarifler ve bilgiler yalnızca genel bilgilendirme amaçlıdır; sağlık, alerji veya
          beslenme konularında profesyonel tıbbi tavsiye yerine geçmez.
        </p>
        <p className="text-warm-700 text-sm leading-relaxed">
          Platform; teknik arızalar, veri kayıpları veya üçüncü taraf hizmetlerinden kaynaklanan
          sorunlardan sorumlu tutulamaz.
        </p>

        {/* 9 */}
        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">9. Hesap Sonlandırma</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Kullanım koşullarını ihlal eden hesaplar önceden bildirim yapılmaksızın askıya alınabilir veya
          kalıcı olarak silinebilir. Hesabınızı dilediğiniz zaman ayarlar bölümünden veya{" "}
          <a href="mailto:iletisim@menugunlugu.com" className="text-brand-600 hover:underline">iletisim@menugunlugu.com</a>
          {" "}adresine başvurarak silebilirsiniz.
        </p>

        {/* 10 */}
        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">10. Geçerli Hukuk ve Yetkili Mahkeme</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Bu sözleşme Türkiye Cumhuriyeti hukukuna tabidir. Taraflar arasında doğabilecek
          uyuşmazlıklarda Türk mahkemeleri yetkili olup İstanbul mahkemeleri esas yetki merciidir.
        </p>

        {/* 11 */}
        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">11. Değişiklikler ve Yürürlük</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Bu koşullar zaman zaman güncellenebilir. Önemli değişiklikler e-posta veya Platform üzerinden
          önceden bildirilecektir. Platforma kullanmaya devam etmeniz güncel koşulları kabul ettiğiniz
          anlamına gelir. İşbu sözleşme, üyelik oluşturulduğu anda yürürlüğe girer.
        </p>

        <div className="mt-10 pt-6 border-t border-warm-100">
          <p className="text-xs text-warm-400 mb-4">Diğer yasal belgeler:</p>
          <div className="flex flex-wrap gap-4 text-xs text-warm-400">
            <Link href="/gizlilik-politikasi" className="hover:text-brand-600 hover:underline transition-colors">Gizlilik Politikası</Link>
            <Link href="/aydinlatma-metni" className="hover:text-brand-600 hover:underline transition-colors">KVKK Aydınlatma Metni</Link>
          </div>
          <p className="text-xs text-warm-400 mt-4">
            Sorularınız için:{" "}
            <a href="mailto:iletisim@menugunlugu.com" className="text-brand-600 hover:underline">iletisim@menugunlugu.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
