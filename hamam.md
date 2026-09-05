1\. Web Uygulaması mı, Masaüstü Uygulama mı?

Kesinlikle Web Uygulaması (Cloud-based / SaaS) olarak geliştirmen çok daha mantıklıdır.



Erişilebilirlik: Resepsiyondaki masaüstü bilgisayardan, yöneticinin evdeki tabletinden veya hamam müdürünün telefonundan anlık doluluk ve personel takibi yapılabilir. Masaüstü uygulamada bu senkronizasyonu sağlamak oldukça zahmetlidir.



Cihaz Bağımsızlığı: İşletmenin bilgisayarı bozulsa dahi yeni bir cihaza tarayıcı açıp giriş yaparak kaldıkları yerden devam edebilirler.



Güncelleme Kolaylığı: Sistemde bir hata düzelttiğinde veya yeni bir paket/özellik eklediğinde tüm müşterilerin anında güncellenir. Masaüstü uygulamalarda her bilgisayara tek tek güncel sürümü yükletmek ciddi bir destektir.



Çoklu Şube / Çoklu İşletme Desteği: Web altyapısı, ileride ürünü birden fazla hamam veya SPA merkezine satmanı çocuk oyuncağı hâline getirir.



2\. İleride Birden Fazla İşletmeye Satıldığında Çıkabilecek Sorunlar

Uygulamayı birden fazla hamama satmaya başladığında (SaaS aşaması) teknik ve operasyonel bazı zorluklarla karşılaşırsın:



Veri İzolasyonu ve Güvenliği: Bir hamamın, başka bir hamamın Müşteri Verilerini, Gelir/Gider veya Doluluk Oranlarını kesinlikle görmemesi gerekir. Yanlış tasarlanmış bir veritabanı mimarisi (Multi-tenancy) veri sızıntılarına yol açabilir.



KVKK ve Müşteri Gizliliği: Hamama gelen misafirlerin adı, telefonu, hatta opsiyonel kişisel bilgileri (alerjiler, özel sağlık durumları vb.) saklanacağından Kişisel Verileri Koruma Kanunu'na (KVKK) tam uyum şarttır.



Özel İstekler ve Özelleştirme Baskısı: Her işletme kendi çalışma saatini, paket türlerini, komisyon oranlarını veya fiş/fatura şablonunu özelleştirmek isteyecektir. Kod yapısının esnek (konfigüre edilebilir) tasarlanması gerekir.



İnternet Kesintileri: Hamamlar genelde bodrum veya alt katlarda yer alabilir ve internet kesildiğinde resepsiyonun durmaması gerekir. Web uygulamasının PWA (Progressive Web App) desteğiyle çevrimdışı (offline) modda da temel işlevleri yürütmesi sağlanmalıdır.



Eşzamanlı Randevu Çakışmaları: Aynı masör/tellak veya aynı sauna/odaya aynı saat diliminde iki farklı resepsiyonist tarafından randevu girilmesini engelleyen güçlü bir kilit (locking) mekanizması tasarlanmalıdır.



3\. İşletmelere Kurulum ve Dağıtım Süreçleri Nasıl Olmalı?

Web tabanlı bir model seçtiğin için geleneksel "dosya indir, setup.exe çalıştır" gibi fiziksel kurulum süreçlerine ihtiyacın kalmaz.



Merkezi Bulut Sunucu (Cloud SaaS Model):

Uygulamanı AWS, Google Cloud veya DigitalOcean gibi güvenilir bir bulut sunucuda barındırırsın.



Domain / Subdomain Yapısı:

Her işletmeye özel bir giriş adresi tanımlayabilirsin. Örneğin: ahmethamam.seninuygulaman.com veya tüm işletmeler app.seninuygulaman.com adresinden kendi kullanıcı adı/şifresiyle giriş yapar.



Gelişmiş Rol ve Yetkilendirme (RBAC):



Süper Admin (Sen): Tüm işletmeleri, abonelik durumlarını ve ödemelerini yönettiğin panel.



İşletme Yöneticisi: Kendi çalışanlarını, seans saatlerini, paket fiyatlarını ve raporları görür.



Resepsiyon / Kasa: Sadece randevu oluşturur, müşteri kaydeder ve ödeme alır.



Personel (Tellak/Masör): Sadece kendi günlük seans programını görür.



Donanım Entegrasyonları (Opsiyonel Kurulum):

İşletmeye gittiğinde kurulacak tek şey yerel donanımlardır:



Adisyon / Fiş Yazıcısı (Termal yazıcı entegrasyonu)



Müşteri Kartı / Bileklik Okuyucuları (NFC / RFID sistemleri)





























sence her işletmenin ayrı datası olması gerekmez mi?







Haklısın, mantıken düşünüldüğünde "Her işletmenin verisi tamamen ayrı olmalı" düşüncesi çok doğru. Ancak yazılım mimarisinde bu "ayrılık" fiziki (ayrı veritabanları) veya mantıksal (aynı veritabanı içinde izolasyon) olarak iki farklı yöntemle sağlanır.



SaaS (Software as a Service) dünyasında işletmelerin verilerini ayırmak için kullanılan 3 ana veritabanı mimarisi vardır. Senin projen için hangisinin mantıklı olduğuna birlikte bakalım:



1\. Mantıksal İzolasyon (Shared Database, Shared Schema)

Önceki cevabımda önerdiğim yöntemdir.



Nasıl Çalışır? Tüm işletmeler (Hamam A, Hamam B, Hamam C) tek bir büyük veritabanını kullanır. Ancak her tabloda tenant\_id (işletme kodu) alanı bulunur.



Veri Güvenliği: Backend kod seviyesinde atılan her sorguya WHERE tenant\_id = 'hamam\_a' şartı otomatik eklenir. Hamam A kesinlikle Hamam B'nin verisine erişemez.



Avantajları:



Çok Ucuzdur: 100 farklı işletmen olsa bile tek bir sunucu/veritabanı maliyetin olur.



Bakımı ve Güncellemesi Çok Kolaydır: Veritabanına yeni bir kolon/özellik ekleyeceğinde tek bir sorgu ile tüm işletmeler anında güncellenir.



Dezavantajı: Kod tarafında bir hata yapılırsa (örneğin WHERE tenant\_id yazılması unutulursa) veri sızıntısı riski doğabilir. (Bu risk modern ORM kütüphaneleri ve yetkilendirme katmanları ile sıfıra indirilir).



2\. Şema Seviyesinde İzolasyon (Shared Database, Separate Schema)

Nasıl Çalışır? Yine tek bir veritabanı sunucusu vardır ancak veritabanının içinde her işletme için ayrı bir "Schema" (Klasör gibi düşünebilirsin) açılır (tenant\_hamam\_a, tenant\_hamam\_b).



Veri Güvenliği: Veriler fiziksel olarak aynı veritabanı motorunda ama farklı klasörlerde durur. Güvenlik seviyesi daha yüksektir.



Avantajları:



İşletmelerin verisi birbirinden daha net ayrılır.



Tek bir sunucu kullanıldığı için maliyet hâlâ makuldür.



Dezavantajı: İşletme sayısı arttıkça (örneğin 500 hamama ulaştığında) veritabanı yönetimi ve yedek alması zorlaşabilir.



3\. Fiziksel İzolasyon (Separate Database per Tenant)

Tam olarak senin bahsettiğin yöntem.



Nasıl Çalışır? Sisteme kaydolan her yeni hamam için tamamen ayrı, bağımsız bir veritabanı oluşturulur (db\_hamam\_a, db\_hamam\_b).



Veri Güvenliği: Maksimum güvenliktir. Hamam A'nın veritabanı çökse veya silinse bile Hamam B bundan hiç etkilenmez.



Avantajları:



Mükemmel İzolasyon: Yanlışlıkla başka işletmenin verisini çekme ihtimali %0'dır.



Özel İstekler: Çok büyük bir VIP hamam zinciri geldiğinde, onun veritabanını ayrı bir sunucuya taşıyıp ona özel optimize edebilirsin.



Dezavantajları:



Yüksek Maliyet: 100 işletme için 100 ayrı veritabanı çalıştırmak ciddi bir sunucu maliyeti yaratır.



Güncelleme Çilesi: Veritabanında küçük bir değişiklik yapacağında 100 ayrı veritabanında tek tek script çalıştırman gerekir.



Hangisini Tercih Etmelisin?

Büyüme hedeflerine ve işletmelerin profiline göre karar verebilirsin:



Başlangıç ve Hızlı Büyüme İçin (Önerilen): 1. Yöntem (Shared Database) ile başlamaktır. Maliyetleri düşük tutar, sistemi hızlıca yaymanı sağlar. Zaten PostgreSQL gibi gelişmiş veritabanlarında Row Level Security (RLS) kullanarak veritabanı seviyesinde bile verilerin karışmasını kesin olarak engelleyebilirsin.



Kurumsal / Prestijli Müşteriler İçin: Eğer çok büyük bir SPA zinciriyle anlaşırsan ve adamlar "Biz verimizin başka hiçbir firmayla aynı veritabanında durmasını istemiyoruz" derse, onlar için 3. Yöntemi (Ayrı Veritabanı) uygulayabilir ve onlara daha yüksek bir abonelik fiyatı (Enterprise Plan) çıkarabilirsin.









DB Yapısı



&#x09;		\[ company ] (Şirket)

&#x20;                 		│

&#x20;           \[ branches ] (Hamam 1, Hamam 2, Hamam 3)

&#x20;          		        │

&#x20;┌────────────────┼────────────────┬────────────────┐

&#x20;│                │                │                │

\[ users ]    \[ staff ]    \[ customers ]    \[ packages ]

(Kullanıcılar) (Çalışanlar) (Müşteriler)   (Paketler)

&#x20;│                │                │                │

&#x20;└────────────────┴───────┬────────┴────────────────┘

&#x20;                         ▼

&#x20;                 \[ appointments ] (Seanslar)













branches (Yeni Tablo: Hamamlar / Şubeler)

Şirkete bağlı her bir fiziksel hamamı ifade eder.



id (UUID, PK)



name (VARCHAR): Hamam/Şube adı (ör. "Kaleiçi Şubesi", "Lara Şubesi").



address (TEXT): Adres bilgisi.



phone (VARCHAR): Şube telefon numarası.



is\_active (BOOLEAN)











users (Kullanıcılar ve Şube Yetkilendirmesi)

Kullanıcının hangi hamam(lar)a erişebileceğini belirlemek için Şube Yetki Tablosu ekliyoruz.



users Tablosu:



id (UUID, PK)



full\_name, email, password\_hash



role (ENUM):



'COMPANY\_ADMIN' (Tüm hamamları/şubeleri gören yetkili)



'BRANCH\_USER' (Sadece yetkili olduğu hamamı gören resepsiyonist/personel)



user\_branches (Yeni Tablo: Kullanıcı-Şube Yetki Eşleşmesi):

Bir kullanıcının (örneğin gezici bir müdürün) birden fazla hamama yetkisi olması durumunu yönetmek için.



user\_id (UUID, FK -> users.id)



branch\_id (UUID, FK -> branches.id)



(Bileşik Birincil Anahtar: PRIMARY KEY (user\_id, branch\_id))









customers (Müşteriler ve Ayrıştırma)

Müşterileri şube bazlı ayırmanın en esnek yolu: Müşterinin ilk kayıt olduğu/bağlı olduğu ana şubeyi tutmaktır.



id (UUID, PK)



branch\_id (UUID, FK -> branches.id): Müşterinin kayıtlı olduğu hamam.



full\_name (VARCHAR)



phone (VARCHAR, UNIQUE)



gender (ENUM)



notes (TEXT)



Esneklik İpucu: Müşteri A Hamamı'nda kayıtlı olsa bile B Hamamı'na gittiğinde telefon numarasından aratılıp bulunabilir ve B Hamamı'nda da randevu oluşturulabilir.











staff (Çalışanlar / Tellak, Masör)

Çalışanlar belirli bir şubeye bağlıdır.



id (UUID, PK)



branch\_id (UUID, FK -> branches.id): Çalışanın görev yaptığı hamam.



full\_name (VARCHAR)



gender (ENUM)



commission\_rate (DECIMAL)









packages (Paketler / Hizmetler)

Şubelerin fiyatları ve sunduğu hizmetler farklı olabilir (örneğin VIP şubede kese-köpük fiyatı daha yüksek olabilir).



id (UUID, PK)



branch\_id (UUID, FK -> branches.id): Paketin geçerli olduğu hamam.



title (VARCHAR)



duration\_minutes (INT)



price (DECIMAL)











appointments (Seanslar / Randevular)

Randevunun hangi hamamda gerçekleştiğini tutar.



id (UUID, PK)



branch\_id (UUID, FK -> branches.id): (Çok Önemli) Seansın yapıldığı hamam.



customer\_id (UUID, FK -> customers.id)



staff\_id (UUID, FK -> staff.id)



package\_id (UUID, FK -> packages.id)



appointment\_date (DATE)



start\_time (TIME)



end\_time (TIME)



status (ENUM)









Sistem Yazılım Tarafında Nasıl Çalışacak?

Giriş Anı (Login): Resepsiyonist sisteme giriş yaptığında, sistem onun user\_branches tablosundaki yetkilerine bakar. Sadece yetkili olduğu hamamın takvimi ve müşterileri ekrana gelir.



Şube Değiştirici (Branch Switcher): Eğer kullanıcı 'COMPANY\_ADMIN' ise, panelin üst kısmında bir açılır menü (dropdown) belirir:



\[ Tüm Şubeler ] / \[ Kaleiçi Şubesi ] / \[ Lara Şubesi ]

Bu sayede genel müdür tek tıkla şubeler arası geçiş yapabilir veya tüm hamamların toplam cirosunu ve doluluğunu tek ekranda görebilir.









tamam mantıken oluşturduk database kısmını. Sence bu durumdan sonrasında ben yazılıma nasıl geçmeliyim?

Veritabanı mimarisini netleştirdikten sonra doğrudan kod yazmaya başlamak yerine, projeyi adımlara bölerek ilerlemek hem zaman kazandırır hem de yolun ortasında tıkanmanı engeller.



Aşağıdaki 5 adımlı yol haritasını takip ederek yazılım sürecini adım adım hayata geçirebilirsin:



Adım 1: Teknoloji Yığınını (Tech Stack) Seç

Uygulamanın hızlı, güvenilir ve sürdürülebilir olması için güncel ve topluluk desteği güçlü teknolojiler seçmelisin:



Backend (Arka Plan): Node.js (NestJS / Express) veya C# (.NET Core). Önerim: NestJS veya Express.js (Hızlı prototipleme için).



Database (Veritabanı): PostgreSQL. (İlişkisel yapısı, UUID desteği ve hızı sebebiyle hamam/randevu yönetimine mükemmel uyar).



Frontend (Arayüz): React.js veya Next.js + TailWind CSS + Shadcn UI veya Ant Design. (Arayüzde takvim ve sürükle-bırak bileşenleri kullanacağımız için React ekosistemi çok güçlüdür).



Takvim Bileşeni (UI için): FullCalendar.js veya React-Big-Calendar. (Seans saatlerini, dolulukları ve personel atamalarını görselleştirmek için en kritik kütüphanedir).



Adım 2: Backend API Endpoints (Servisleri) Tasarla

Önce veritabanına veri yazıp okuyacak olan arka plan servislerini tanımla. CRUD (Oluştur, Oku, Güncelle, Sil) işlemlerini şu modüller için yazmalısın:



Auth \& Branch: Login, şube seçimi ve kullanıcı yetkileri.



Staff \& Packages: Çalışan ekleme, vardiya saatleri, hizmet/paket tanımları.



Customers: Müşteri arama, yeni müşteri kaydı, geçmiş seansları.



Appointments (Çekirdek Modül):



GET /appointments?branch\_id=X\&date=2026-09-05 (Günün seanslarını getir)



POST /appointments (Yeni seans/randevu oluştur)



Backend'deki En Kritik İş Mantığı (Business Logic):

Randevu oluştururken veritabanına yazmadan önce şu 2 kontrolü yapmalısın:



Seçilen personel o saat diliminde başka bir seansta mı?



Müşterinin o saatte başka bir şubede veya aynı şubede randevusu var mı?



Adım 3: Frontend (Resepsiyonist Ekranı) UI Tasarımı

Resepsiyonistin gün içinde en çok bakacağı ekran Günlük Takvim / Doluluk Ekranı olacaktır. Bu ekranın tasarımı karmaşık olmamalı, tek bakışta anlaşılmalıdır:



Yatay Eksende: Çalışanlar (Ahmet Tellak, Mehmet Masör vb.).



Dikey Eksende: Saat dilimleri (09:00, 10:00, 11:00...).



Kutucuklar (Seanslar): Paket adı, Müşteri adı ve Durum Rengi (Örn: Yeşil = Onaylı/Ödendi, Sarı = Bekliyor, Kırmızı = İptal).



Adım 4: Minimum Uygulanabilir Ürün (MVP) Kapsamını Belirle

İlk günden uygulamanın tüm özelliklerini bitirmeye çalışma. Sadece resmin çekirdeğini kapsayan MVP sürümünü çıkarıp hamamda test etmelisin:



\[x] Giriş yapma ve Şube seçimi



\[x] Müşteri kaydı



\[x] Çalışan ve Paket ekleme



\[x] Takvim üzerinden seans/randevu oluşturma ve personel atama



\[x] Basit Günlük Ciro/Ödeme alma ekranı



(SMS hatırlatma, ayrıntılı ciro raporları, patron mobil uygulaması gibi özellikleri 2. versiyona bırak).



Adım 5: Sahada Test ve Geri Bildirim (Pilot Kullanım)

MVP hazır olduğunda yazılımı anlaşacağın ilk hamamın resepsiyonuna kur. Resepsiyonistin uygulamayı kullanırken nerede takıldığını, hangi düğmenin küçük geldiğini veya hangi adımı yavaş attığını izle. Gerçek saha geri bildirimiyle sistemi mükemmelleştir.







ben biraz html vss ve node.js c# c++ biliyorum ayrıca vs code yüklü. Sence benim bu projem için hangi dilleri kullanmalıyız backend ve frntend için?



Mevcut bilgi birikimin ve elindeki araçlar (VS Code, HTML/CSS, Node.js, C#) bu projeyi baştan sona eksiksiz geliştirmek için fazlasıyla yeterli.



Masaüstü tarafında C++ veya C# ile vakit kaybetmeden, tamamen web odaklı ve JavaScript/TypeScript ekosistemine dayalı bir teknoloji yığını (Tech Stack) seçmek senin için en hızlı ve en verili yol olacaktır.



Önerilen Teknoloji Yığını (Tech Stack)

1\. Backend (Arka Plan): Node.js (Express.js)

Neden? Zaten Node.js temelin var ve VS Code ile mükemmel uyumlu. Randevu çakışma kontrolleri, kullanıcı yetkilendirmeleri ve JSON formatında API yanıtları üretmek için Node.js + Express çok hafiftir ve hızlı yazılır.



Veritabanı Sürücüsü: Node.js içinde PostgreSQL ile haberleşmek için pg veya Prisma ORM kütüphanesini kullanabilirsin.



2\. Veritabanı: PostgreSQL

Neden? Saatlik randevu aralıklarını tutmak, şube (branch) ve personel ilişkilerini yönetmek için ilişkisel veritabanı şarttır. PostgreSQL ücretsiz, çok hızlı ve SQL yapısını öğrenmesi çok kolaydır.



3\. Frontend (Kullanıcı Arayüzü): React.js (Vite ile)

Neden? Düz HTML/CSS bilgin var, üzerine JavaScript (ES6+) ve React eklemek hiç zor olmayacaktır.



Resepsiyonist ekranında sayfa yenilenmeden dinamik olarak güncellenen takvimler, doluluk oranları ve açılır pencereler (modal) yapmak için React gibi bir UI kütüphanesi şarttır.



Tasarım / UI Kütüphanesi: Sıfırdan CSS yazmakla zaman kaybetmemek için Tailwind CSS ve Shadcn UI veya Ant Design kullanabilirsin.



4\. Takvim Bileşeni (En Kritik Parça): FullCalendar.js (React)

Neden? Hamamın günlük seanslarını, saat dilimlerini ve çalışan atamalarını göstermek için sıfırdan takvim yazmak aylarını alabilir. FullCalendar hazır kütüphanesini React projesine ekleyerek sürükle-bırak destekli harika bir doluluk takvimini birkaç günde çıkarabilirsin.



Neden C# veya C++ Tercih Etmemelisin?

C++: Sistem seviyesinde bir dil olduğu için web/resepsiyon uygulamaları geliştirmek inanılmaz zor ve gereksiz zaman kaybıdır.



C# (.NET Core): C# harika bir dildir; ancak hem Node.js hem C# öğrenmek yerine bildiğin JavaScript diliyle hem frontend (React) hem backend (Node.js) yazmak sana 2 kat hız kazandırır. Tek bir dil bilerek uygulamanın her iki tarafını da yönetebilirsin (Full-stack JavaScript).



Çalışma Alanı / Araç Kurulumları (VS Code)

VS Code üzerinde hemen başlamak için şu eklentileri (Extensions) kurman yeterlidir:



ES7+ React/Redux/React-Native snippets (Hızlı React kodu yazmak için)



Prettier - Code formatter (Kodları otomatik düzenlemek için)



Thunder Client veya Postman (Yazdığın Node.js API'lerini test etmek için)













tamam şimdi proje yapısı olarak kullanacağımız dilleri seçtik Backend (Arka Plan): Node.js (Express.js) -  Veritabanı: PostgreSQL - Frontend (Kullanıcı Arayüzü): React.js (Vite ile) - Takvim Bileşeni (En Kritik Parça): FullCalendar.js (React) bundan sonrası için bilgisayarıma gerekli uygulaa klasörelerini kuralım, ayrıca vs code'uma gerekli yüklemeleri yapmamı sağla.



1\. Bilgisayara Kurulması Gereken Programlar

Bilgisayarında aşağıdaki araçların kurulu olduğundan emin olmalısın:



Node.js (LTS Sürümü): JavaScript kodlarını bilgisayarında çalıştırabilmek ve paket yöneticisi npm'e sahip olmak için gereklidir.



nodejs.org adresinden LTS sürümünü indirip kur.





PostgreSQL ve pgAdmin 4: Veritabanını bilgisayarında çalıştırmak ve görsel olarak yönetmek için.



postgresql.org adresinden bilgisayarına uygun sürümü indir.



Kurulum sırasında veritabanı ana kullanıcısı olan postgres için bir şifre belirlemen istenecek. Bu şifreyi bir yere not et!



###### **\*3310/89.Oo\***







Git: Kod yedeklemesi ve versiyon kontrolü için.



git-scm.com adresinden indirebilirsin.









2\. VS Code Eklentileri (Extensions)

VS Code'u aç, sol menüdeki Extensions simgesine (Ctrl+Shift+X / Cmd+Shift+X) tıkla ve şu eklentileri aratıp yükle:



Prettier - Code formatter: Kodlarını kaydettiğinde otomatik düzeltir ve hizalar.



ESLint: Hatalı JavaScript/React kodlarını anında uyarır.



ES7+ React/Redux/React-Native snippets: rafce gibi kısayollarla hızlı React bileşenleri oluşturmanı sağlar.



Thunder Client: VS Code dışına çıkmadan yazdığın Node.js API'lerini test etmeni sağlar (Postman alternatifi hafif eklenti).



Tailwind CSS IntelliSense: Arayüz yazarken CSS sınıflarını otomatik tamamlar.









3\. Proje Klasörlerini ve Prototipi Oluşturma

Eklentileri kurduktan sonra terminal üzerinden projemizi kurmaya geçiyoruz.



cmd veya VS Code içindeki terminali (Ctrl + ") aç.



Projeyi kaydetmek istediğin dizine git (örneğin Masaüstü için: cd Desktop).



Sırayla şu komutları çalıştırarak projenin ana klasörünü ve backend / frontend yapısını kur:



mkdir backend

cd backend

npm init -y

npm install express pg cors dotenv

npm install --save-dev nodemon (Bu yükleme bittikten sonra geliştirme modunda sunucuyu otomatik yeniden başlatacak olan paketi yükle)





2\. Frontend (React + Vite) Projesini Oluştur

Backend paketleri yüklendikten sonra ana klasöre geri dönüp frontend uygulamasını oluşturacağız. Terminale sırayla şu komutları yaz:

ana klasöre geldik cd.. ile aşağıdaki komutu yazdık.

npm create vite@latest frontend -- --template react AŞAĞIDAKİ İŞLEMLER OLDU:

C:\\Users\\ozlem\\OneDrive\\Masaüstü\\Hamam\\backend>cd ..



C:\\Users\\ozlem\\OneDrive\\Masaüstü\\Hamam>npm create vite@latest frontend -- --template react

Need to install the following packages:

create-vite@9.2.0

Ok to proceed? (y) y



> npx

> create-vite frontend --template react



│

◇  Which linter to use?

│  ESLint

│

◇  Install with npm and start now?

│  Yes

│

◇  Scaffolding project in C:\\Users\\ozlem\\OneDrive\\Masaüstü\\Hamam\\frontend...

│

◇  Installing dependencies with npm...



Daha sonra

cd frontend

npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction lucide-react axios



BU İŞLEMLERDEN SONRA BACKEND VE FRONTEND KLASÖRLERİMİZ VE KURULUMLARIMIZ BİTTİ. 





ARTIK SQL'E BAĞLANMA İŞLEMLERİNİ YAPACAĞIZ.





Adım 1:

VS Code'da backend klasöründe .env adında bir dosya oluşturuldu içerisinde aşağıdaki bilgiler yazıldı:

PORT=5000

DB\_USER=postgres

DB\_PASSWORD=\*3310/89.Oo\*

DB\_HOST=localhost

DB\_PORT=5432

DB\_NAME=hamam\_db







Adım 2:

daha sonra backend klasörüme config adında bir dosya oluşturuldu. içerisinde aşağıdaki kodlar yazıldı.

const { Pool } = require('pg');

require('dotenv').config();



const pool = new Pool({

&#x20; user: process.env.DB\_USER,

&#x20; password: process.env.DB\_PASSWORD,

&#x20; host: process.env.DB\_HOST,

&#x20; port: process.env.DB\_PORT,

&#x20; database: process.env.DB\_NAME,

});



pool.on('connect', () => {

&#x20; console.log('PostgreSQL veritabanına başarıyla bağlandı.');

});



module.exports = {

&#x20; query: (text, params) => pool.query(text, params),

};









Adım 3: Ana Sunucu Dosyasını (index.js) Oluşturup içerisine aşağıdaki test kodu yazıldı.

const express = require('express');

const cors = require('cors');

require('dotenv').config();

const db = require('./config/db');



const app = express();



app.use(cors());

app.use(express.json());



// Test API Endpoint

app.get('/api/health', (req, res) => {

&#x20; res.json({ status: 'OK', message: 'Hamam Takip Sistemi API Çalışıyor!' });

});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

&#x20; console.log(`Sunucu ${PORT} portunda çalışıyor...`);

});







Adım 4: Veritabanını pgAdmin Üzerinde Oluştur

Sunucuyu çalıştırmadan önce PostgreSQL'de hamam\_db adında boş bir veritabanı açmamız gerekiyor:



Bilgisayarından pgAdmin 4 uygulamasını aç.



Sol menüden Servers > PostgreSQL 18 üzerine sağ tıkla ve Create > Database... seçeneğini seç.



Database adına hamam\_db yazıp Save de.



Dosyaları oluşturup pgAdmin'de veritabanını açtığında haber ver; terminalden sunucumuzu başlatıp ilk bağlantı testimizi yapalım!











Şimdiye Kadar Yapılan Adımlar



Geliştirme Ortamı \& Proje İskeleti:



Node.js, Git ve VS Code geliştirme ortamı doğrulandı.



Ana Hamam klasörü altında backend (Node.js/Express) ve frontend (React/Vite) yapıları ayrıştırıldı.



Backend Kurulumu:



Bağımlılıklar (express, pg, cors, dotenv, nodemon) yüklendi.



.env dosyası ile hassas veritabanı bilgileri güvenli hale getirildi.



PostgreSQL bağlantı havuzu (db.js) oluşturuldu ve index.js üzerinden Express sunucusu 5000 portunda başarıyla çalıştırıldı.



Sağlık kontrolü API'si (/api/health) yazılarak veri akışı doğrulandı.



Veritabanı Kurulumu:



pgAdmin 4 üzerinde PostgreSQL bağlantısı sağlandı ve dedicated hamam\_db veritabanı oluşturuldu.



Frontend Hazırlığı:



Vite ile React tabanlı ön yüz scaffold edildi.



Arayüz için gerekli temel kütüphaneler (FullCalendar, lucide-react, axios) projeye dahil edildi.



Sıradaki Adımlar (Mola Dönüşü)



Veritabanı Şemasını Tasarlama (pgAdmin):



Müşteriler (customers), Çalışanlar (employees), Hizmetler (services) ve Randevular (appointments) tablolarının SQL sorgularını çalıştırıp ilişkilerini (Foreign Key) kuracağız.



Backend API Endpoint'lerini Yazma:



Müşteri ekleme/listeleme (/api/customers)



Hizmet ve personel yönetimi (/api/services, /api/employees)



Takvim için randevu alma ve çakışma kontrolü (/api/appointments)



Frontend Arayüz Geliştirme (React):



Tailwind CSS entegrasyonu.



FullCalendar ile interaktif randevu takvimi paneli.



Müşteri ve hizmet seçim formları ile API entegrasyonu.







Veritabanı Tablo Yapımız (hamam\_db)

Mola dönüşü pgAdmin üzerinde çalıştıracağımız SQL Query script'inin mimarisi şu 6 temel tablodan oluşacak:



1\. Müşteriler (customers)

&#x09;id (PK)



&#x09;first\_name, last\_name



&#x09;phone (Benzersiz / Randevu aramalarda hızlı bulmak için)



&#x09;gender (Kadın / Erkek)



&#x09;notes (Örn: "Sırt bölgesinde fıtık var, sert masaj istemiyor" gibi müşteri notları)



&#x09;created\_at



2\. Hizmetler (services)

&#x09;id (PK)



&#x09;name (Örn: Klasik Kese Köpük, Bali Masajı, Sultan Bakımı)



&#x09;duration\_minutes (Hizmet süresi: 30 dk, 60 dk, 90 dk - Randevu takvimi bloklaması için kritik)



&#x09;price (Ücret)



&#x09;gender\_type (Tüm müşteriler / Sadece Kadın / Sadece Erkek)



&#x09;is\_active (Satışta mı?)



&#x09;3. Çalışanlar / Terapistler (employees)

&#x09;id (PK)



&#x09;first\_name, last\_name



&#x09;phone



&#x09;role (Tellak, Masöz, Masör, Resepsiyonist)



&#x09;commission\_rate (Yaptığı bakımdan alacağı prim yüzdesi, örn: %10)



&#x09;is\_active



4\. Odalar / Alanlar (rooms)

&#x09;id (PK)



&#x09;name (Örn: VIP Masaj Odası 1, Göbek Taşı, Sauna 2)



&#x09;capacity (Aynı anda kaç kişi alabilir?)



5\. Randevular (appointments) - Ana İşlem Tablosu

&#x09;id (PK)



&#x09;customer\_id (FK -> customers)



&#x09;employee\_id (FK -> employees)



&#x09;service\_id (FK -> services)



&#x09;room\_id (FK -> rooms)



&#x09;start\_time (Başlangıç Tarih/Saat)



&#x09;end\_time (Bitiş Tarih/Saat - start\_time + duration\_minutes ile otomatik hesaplanacak)



&#x09;status (Bekliyor, Onaylandı, Tamamlandı, İptal Edildi)



&#x09;total\_price (Randevu anındaki fiyat)



&#x09;notes



6\. Ödemeler / Adisyon (payments)

&#x09;id (PK)



&#x09;appointment\_id (FK -> appointments)



&#x09;amount (Ödenen Tutar)



&#x09;payment\_method (Nakit, Kredi Kartı, Havale)



&#x09;paid\_at (Ödeme Tarihi)









\-- 1. MÜŞTERİLER TABLOSU

CREATE TABLE IF NOT EXISTS customers (

&#x20;   id SERIAL PRIMARY KEY,

&#x20;   first\_name VARCHAR(50) NOT NULL,

&#x20;   last\_name VARCHAR(50) NOT NULL,

&#x20;   phone VARCHAR(20) UNIQUE NOT NULL,

&#x20;   gender VARCHAR(10) CHECK (gender IN ('Kadin', 'Erkek', 'Diger')),

&#x20;   notes TEXT,

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- 2. HİZMETLER TABLOSU

CREATE TABLE IF NOT EXISTS services (

&#x20;   id SERIAL PRIMARY KEY,

&#x20;   name VARCHAR(100) NOT NULL,

&#x20;   duration\_minutes INT NOT NULL CHECK (duration\_minutes > 0),

&#x20;   price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),

&#x20;   gender\_type VARCHAR(10) DEFAULT 'Tumu' CHECK (gender\_type IN ('Kadin', 'Erkek', 'Tumu')),

&#x20;   is\_active BOOLEAN DEFAULT TRUE,

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- 3. ÇALIŞANLAR / TERAPİSTLER TABLOSU

CREATE TABLE IF NOT EXISTS employees (

&#x20;   id SERIAL PRIMARY KEY,

&#x20;   first\_name VARCHAR(50) NOT NULL,

&#x20;   last\_name VARCHAR(50) NOT NULL,

&#x20;   phone VARCHAR(20),

&#x20;   role VARCHAR(50) NOT NULL, -- Örn: Tellak, Masöz, Masör, Resepsiyon

&#x20;   commission\_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (commission\_rate >= 0),

&#x20;   is\_active BOOLEAN DEFAULT TRUE,

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- 4. ODALAR / ALANLAR TABLOSU

CREATE TABLE IF NOT EXISTS rooms (

&#x20;   id SERIAL PRIMARY KEY,

&#x20;   name VARCHAR(50) NOT NULL,

&#x20;   capacity INT DEFAULT 1 CHECK (capacity > 0),

&#x20;   is\_active BOOLEAN DEFAULT TRUE

);



\-- 5. RANDEVULAR TABLOSU (Ana İşlem Tablosu)

CREATE TABLE IF NOT EXISTS appointments (

&#x20;   id SERIAL PRIMARY KEY,

&#x20;   customer\_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

&#x20;   employee\_id INT REFERENCES employees(id) ON DELETE SET NULL,

&#x20;   service\_id INT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,

&#x20;   room\_id INT REFERENCES rooms(id) ON DELETE SET NULL,

&#x20;   start\_time TIMESTAMP NOT NULL,

&#x20;   end\_time TIMESTAMP NOT NULL,

&#x20;   status VARCHAR(20) DEFAULT 'Bekliyor' CHECK (status IN ('Bekliyor', 'Onaylandi', 'Tamamlandi', 'Iptal')),

&#x20;   total\_price DECIMAL(10, 2) NOT NULL,

&#x20;   notes TEXT,

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

&#x20;   CONSTRAINT check\_times CHECK (end\_time > start\_time)

);



\-- 6. ÖDEMELER / ADİSYON TABLOSU

CREATE TABLE IF NOT EXISTS payments (

&#x20;   id SERIAL PRIMARY KEY,

&#x20;   appointment\_id INT UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

&#x20;   amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),

&#x20;   payment\_method VARCHAR(20) NOT NULL CHECK (payment\_method IN ('Nakit', 'Kredi Karti', 'Havale')),

&#x20;   paid\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- PERFORMANS İÇİN İNDEKS HIZLANDIRICILARI

CREATE INDEX IF NOT EXISTS idx\_appointments\_start\_time ON appointments(start\_time);

CREATE INDEX IF NOT EXISTS idx\_appointments\_customer ON appointments(customer\_id);

CREATE INDEX IF NOT EXISTS idx\_appointments\_employee ON appointments(employee\_id);









&#x09;

