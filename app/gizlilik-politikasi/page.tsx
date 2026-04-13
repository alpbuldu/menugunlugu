import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Menü Günlüğü",
  description: "Menü Günlüğü kişisel verilerin korunması politikası.",
};

export default function GizlilikPolitikasiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-brand-600 hover:underline">← Ana Sayfa</Link>
      </div>

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8 sm:p-12 prose prose-warm max-w-none">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Kişisel Verilerin Korunması Politikası</h1>
        <p className="text-sm text-warm-400 mb-8">Son güncelleme: Nisan 2025</p>

        <p className="text-warm-700 text-sm leading-relaxed mb-6">
          Menü Günlüğü ("Platform") olarak gizliliğinize değer veriyoruz. Bu politika, verilerinizi nasıl
          topladığımızı, kullandığımızı ve koruduğumuzu açıklar.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">1. Topladığımız Veriler</h2>

        <h3 className="font-semibold text-warm-700 mt-5 mb-2 text-sm">Doğrudan Sağladığınız Veriler</h3>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>Kayıt sırasında: kullanıcı adı, e-posta adresi, şifre (şifreli olarak saklanır)</li>
          <li>Profil bilgileri: biyografi, profil fotoğrafı</li>
          <li>İçerikler: tarif, blog yazısı, görseller</li>
        </ul>

        <h3 className="font-semibold text-warm-700 mt-5 mb-2 text-sm">Otomatik Toplanan Veriler</h3>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>IP adresi ve konum bilgisi (ülke düzeyinde)</li>
          <li>Tarayıcı türü ve işletim sistemi</li>
          <li>Platform kullanım istatistikleri</li>
          <li>Oturum açma/kapama kayıtları</li>
        </ul>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">2. Verilerin Kullanım Amacı</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>Platform hizmetlerinin sunulması ve iyileştirilmesi</li>
          <li>Hesap yönetimi ve güvenlik</li>
          <li>Kullanıcı desteği</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          <li>Açık rıza verilen kullanıcılara pazarlama iletişimi</li>
        </ul>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">3. Çerezler (Cookies)</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Platform, oturum yönetimi için zorunlu çerezler kullanmaktadır. Bu çerezler oturumunuzu
          açık tutmak için gereklidir ve devre dışı bırakılamazlar. Üçüncü taraf reklamcılık çerezi
          kullanılmamaktadır.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">4. Veri Güvenliği</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Kişisel verilerinizi yetkisiz erişime, ifşaya veya değiştirmeye karşı korumak amacıyla
          endüstri standardı güvenlik önlemleri uygulanmaktadır. Şifreler hiçbir zaman düz metin
          olarak saklanmaz; güçlü şifreleme algoritmaları kullanılır.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">5. Üçüncü Taraf Hizmet Sağlayıcılar</h2>
        <p className="text-warm-700 text-sm leading-relaxed mb-2">
          Platform aşağıdaki güvenilir hizmet sağlayıcılarla çalışmaktadır:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>
            <strong>Supabase</strong> – Veritabanı, kimlik doğrulama ve dosya depolama.
            Veriler ABD'deki sunucularda barındırılabilir.
          </li>
          <li>
            <strong>Vercel</strong> – Platform barındırma hizmetleri.
          </li>
        </ul>
        <p className="text-warm-700 text-sm leading-relaxed mt-3">
          Bu sağlayıcılar verilerinizi kendi amaçları için kullanmamaktadır; yalnızca Platform adına
          belirtilen amaçlarla sınırlı olarak işlem yapmaktadırlar.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">6. Veri Saklama</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Kişisel verileriniz hesabınız aktif olduğu sürece saklanır. Hesabınızı silmeniz hâlinde
          verileriniz, yasal saklama yükümlülükleri saklı kalmak kaydıyla silinir veya anonim hale
          getirilir.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">7. Haklarınız</h2>
        <p className="text-warm-700 text-sm leading-relaxed mb-2">KVKK ve ilgili mevzuat kapsamında aşağıdaki haklara sahipsiniz:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-warm-700">
          <li>Verilerinize erişim talep etme</li>
          <li>Yanlış verilerin düzeltilmesini isteme</li>
          <li>Verilerinizin silinmesini talep etme</li>
          <li>Pazarlama iletişiminden vazgeçme (istediğiniz zaman panelinizdeki tercihlerden)</li>
          <li>Veri taşınabilirliği talep etme</li>
        </ul>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">8. İletişim</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Bu politikayla ilgili sorularınız veya talepleriniz için Platform üzerindeki iletişim
          kanallarından bize ulaşabilirsiniz.
        </p>

        <h2 className="text-lg font-semibold text-warm-800 mt-8 mb-3">9. Politika Değişiklikleri</h2>
        <p className="text-warm-700 text-sm leading-relaxed">
          Bu politika zaman zaman güncellenebilir. Önemli değişikliklerde kayıtlı e-posta adresinize
          bildirim gönderilecektir.
        </p>

        <div className="mt-10 pt-6 border-t border-warm-100 flex flex-wrap gap-4 text-xs text-warm-400">
          <Link href="/aydinlatma-metni" className="hover:text-brand-600 hover:underline transition-colors">Aydınlatma Metni</Link>
          <Link href="/kullanim-kosullari" className="hover:text-brand-600 hover:underline transition-colors">Kullanım Koşulları</Link>
        </div>
      </div>
    </div>
  );
}
