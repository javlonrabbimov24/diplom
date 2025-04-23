# CyberShield - Web Sayt Xavfsizlik Skaneri

CyberShield - web saytlar xavfsizligini tekshirish uchun o'zbek tilidagi skanerdir. Bu tizim ZAP va Nmap kabi mashhur xavfsizlik vositalaridan foydalanib, web saytlardagi zaifliklarni aniqlab, ularni o'zbek tilida tahlil qilib beradi.

## Imkoniyatlari

- Web saytlarni avtomatik skanerlash
- OWASP Top 10 zaifliklarni aniqlash
- O'zbek tilidagi interfeys va hisobotlar
- Real-time skanerlash jarayonini kuzatish
- Gemini AI yordamida zaifliklarni tahlil qilish
- PDF formatida hisobotlarni yuklab olish
- Ilgari o'tkazilgan skanerlashlar tarixini saqlash
- Xavfsizlik ballarini hisoblash
- Aniqlangan zaifliklarni bartaraf etish bo'yicha tavsiyalar

## O'rnatish

### Talablar

- Docker va Docker Compose o'rnatilgan bo'lishi kerak
- Internet aloqasi (ZAP va Nmap skanerlari uchun)
- Google Cloud Gemini API kaliti (AI tahlili uchun)

### O'rnatish Qadamlari

1. Repositoriyani klonlash:
```bash
git clone https://github.com/yourusername/cybershield.git
cd cybershield
```

2. Kerakli sozlashlarni o'rnatish:

`.env` faylini yarating va quyidagi o'zgaruvchilarni sozlang:
```
GEMINI_API_KEY=your-gemini-api-key-here
JWT_SECRET=your-jwt-secret-key-here
TARGET_URL=example.com
```

3. Setup skriptini ishga tushiring:
```bash
chmod +x setup.sh
./setup.sh
```

4. Brauzeringizda quyidagi URL ga o'ting:
```
http://localhost:3001
```

## Foydalanish

1. Bosh sahifada skanerlash uchun URL manzilini kiriting
2. Tekshirishni boshlash tugmasini bosing
3. Skanerlash jarayoni tugatilgandan so'ng, natijalar ko'rsatiladi
4. Aniqlangan zaifliklarni, xavfsizlik ballini va tavsiyalarni ko'rish mumkin
5. Hisobotni PDF formatida yuklab olish uchun "Yuklab olish" tugmasini bosing

## Tizim Arxitekturasi

CyberShield quyidagi komponentlardan iborat:

- **Frontend**: React-based web interfeysi
- **Backend**: Flask API serveri
- **Skanerlar**: ZAP va Nmap xavfsizlik skanerlari
- **AI tahlil**: Gemini AI tahlili
- **Ma'lumotlar bazasi**: MongoDB (skanerlash tarixi uchun)
- **Job queue**: Redis (asinxron vazifalar uchun)

## Xavfsizlik Skaner Komponentlari

- **ZAP (Zed Attack Proxy)**: Web zaifliklarni aniqlash uchun
- **Nmap**: Port va servis aniqlash uchun
- **Gemini AI**: Natijalarni tahlil qilish va tavsiyalar berish uchun

## API Reference

### Skanerlash API

- `POST /api/scan/start` - Yangi skanerlashni boshlash
- `GET /api/scan/status/{scan_id}` - Skanerlash statusini tekshirish
- `GET /api/scan/{scan_id}` - Skanerlash tafsilotlarini olish
- `GET /api/scan/{scan_id}/vulnerabilities` - Aniqlangan zaifliklarni olish
- `POST /api/scan/{scan_id}/cancel` - Skanerlashni bekor qilish

### Hisobot API

- `GET /api/report/{report_id}` - Hisobotni olish
- `GET /api/report/export/{report_id}?format=pdf` - Hisobotni eksport qilish (PDF)
- `POST /api/report/generate/{report_id}` - Hisobotni yaratish
- `GET /api/report/summary/{report_id}` - Hisobot qisqacha ma'lumotlarini olish

## Kontakt

Savollar va takliflar uchun: [your-email@example.com](mailto:your-email@example.com)

## Litsenziya

MIT License 