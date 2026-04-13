import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aydınlatma Metni | Menü Günlüğü",
  description: "Menü Günlüğü kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
};

export default function AydinlatmaMetniPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-brand-600 hover:underline">← Ana Sayfa</Link>
      </div>

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8 sm:p-12 prose prose-warm max-w-none">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni</h1>
        <p className="text-sm text-warm-400 mb-8">Son güncelleme: Nisan 2025</p>

        <p className="text-warm-700 text-sm leading-relaxed mb-6">
          Menü Günlüğü ("Platform") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında
          kişisel verilerinizi nasıl işlediğimizi aşağıda açıklamaktayız.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">1. Veri Sorumlusu</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Menü Günlüğü Platformu, KVKK kapsamında veri sorumlusu sıfatıyla hareket etmektedir.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">2. İşlenen Kişisel Veriler</h2>
        <p className="text-warm-700 text-sm leading-relaxed mb-2">Platform üzerinden aşağıdaki kişisel veriler işlenmektedir:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>Kimlik bilgileri: kullanıcı adı</li>
          <li>İletişim bilgileri: e-posta adresi</li>
          <li>Kullanım verileri: yayınlanan tarifler, blog yazıları, favoriler, takip edilen kullanıcılar</li>
          <li>Teknik veriler: IP adresi, tarayıcı türü, giriş/çıkış kayıtları</li>
          <li>Tercihler: pazarlama e-postası tercihi</li>
        </ul>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">3. Kişisel Verilerin İşlenme Amaçları</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>Üyelik hesabının oluşturulması ve yönetilmesi</li>
          <li>Platform hizmetlerinin sunulması (tarif paylaşımı, blog yazıları, günlük menü)</li>
          <li>Kullanıcı desteği ve iletişim</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          <li>Onay verilmesi hâlinde: kişiselleştirilmiş pazarlama e-postaları gönderilmesi</li>
          <li>Platform güvenliği ve dolandırıcılık önleme</li>
        </ul>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">4. Hukuki İşleme Sebepleri</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Kişisel verileriniz; sözleşmenin ifası, yasal yükümlülüklerin yerine getirilmesi, meşru menfaat ve
          açık rıza (pazarlama iletişimleri için) hukuki sebeplerine dayanılarak işlenmektedir.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">5. Kişisel Verilerin Aktarılması</h2>
        <p className="text-warm-700 text-sm leading-relaxed mb-2">
          Kişisel verileriniz aşağıdaki üçüncü taraflarla paylaşılabilmektedir:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>
            <strong>Supabase Inc. (ABD)</strong> – Veritabanı, kimlik doğrulama ve dosya depolama hizmetleri.
            KVKK m. 9 kapsamında açık rızanıza dayanılarak yurt dışına veri aktarımı yapılmaktadır.
          </li>
          <li>
            <strong>Vercel Inc. (ABD)</strong> – Platform barındırma ve içerik dağıtım hizmetleri.
          </li>
        </ul>
        <p className="text-warm-700 text-sm leading-relaxed mt-3">
          Söz konusu hizmet sağlayıcılar, kişisel verilerinizi yalnızca Platform adına ve talimatları
          doğrultusunda işlemektedir.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">6. Kişisel Verilerin Saklanma Süresi</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Kişisel verileriniz, hesabınızın aktif olduğu süre boyunca ve hesap silme talebinizden itibaren
          yasal saklama yükümlülükleri çerçevesinde belirlenen süreler boyunca muhafaza edilmektedir.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">7. KVKK Kapsamındaki Haklarınız</h2>
        <p className="text-warm-700 text-sm leading-relaxed mb-2">KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme</li>
          <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
          <li>Silinmesini veya yok edilmesini isteme</li>
          <li>Otomatik sistemler vasıtasıyla aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
          <li>Kanuna aykırı işlenmesi sebebiyle uğradığınız zararın giderilmesini talep etme</li>
        </ul>
        <p className="text-warm-700 text-sm leading-relaxed mt-3">
          Bu haklarınızı kullanmak için Platform'un iletişim kanalları aracılığıyla tarafımıza ulaşabilirsiniz.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">8. Değişiklikler</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Bu Aydınlatma Metni zaman zaman güncellenebilir. Önemli değişiklikler e-posta yoluyla bildirilecektir.
          Güncel metne her zaman bu sayfadan ulaşabilirsiniz.
        </p>

        <div className="mt-10 pt-6 border-t border-warm-100 flex flex-wrap gap-4 text-xs text-warm-400">
          <Link href="/kullanim-kosullari" className="hover:text-brand-600 hover:underline transition-colors">Kullanım Koşulları</Link>
          <Link href="/gizlilik-politikasi" className="hover:text-brand-600 hover:underline transition-colors">Gizlilik Politikası</Link>
        </div>
      </div>
    </div>
  );
}
