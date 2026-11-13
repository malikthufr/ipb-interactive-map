# 🗺️ Peta Interaktif Kampus IPB Dramaga

Aplikasi web peta digital interaktif berbasis GIS untuk eksplorasi dan navigasi fasilitas di lingkungan Kampus IPB University Dramaga, Bogor. Terinspirasi dari antarmuka modern **Teyvat Interactive Map (HoYoLab)** dan **Peta Comifuro (Mikira)** dengan integrasi data spasial nyata **Google Maps**.

---

## 🌟 Fitur Utama

- **Peta Google Maps Asli & Layer Switcher:**
  - 🛰️ Google Satelit + Label (Hybrid)
  - 🗺️ Google Maps Jalan (Roadmap)
  - 📷 Google Satelit Murni
  - 🌍 OpenStreetMap
- **Denah Kawasan & Poligon Gedung:**
  - Garis batas hijau teritorial kampus IPB Dramaga (267 Ha) dan denah poligon gedung-gedung utama (GWW, AHN Rektorat, Masjid Al-Hurriyyah, Perpustakaan LSI, danau, dan fakultas).
- **58 Titik Lokasi Presisi (GPS):**
  - Posisi akurat seluruh fakultas, CCR, kantin, tempat ibadah, sarana olahraga, ATM, dan gerbang masuk.
- **Filter 12 Kategori Interaktif:**
  - Fakultas, Administrasi, Kantin & Café, Ibadah, Perpustakaan, Parkir, Gerbang, Asrama, Olahraga, Laboratorium, ATM, dan Pin Saya.
- **Navigasi Rute Antar Gedung (Algoritma A\* Pathfinding):**
  - Menghitung jalur terpendek melintasi jalan kampus dengan estimasi jarak (meter) dan waktu tempuh jalan kaki.
- **Pencarian Cepat (Fuzzy Search):**
  - Pencarian instan nama gedung, fakultas, atau alias dengan highlight kata kunci.
- **Pin Pribadi (Custom Markers):**
  - Buat penanda kustom sendiri (draggable) yang tersimpan otomatis di `localStorage`.
- **Tema Gelap & Desain Responsif:**
  - Nuansa gelap elegan dengan warna khas hijau IPB (`#00723F`) dan aksen emas (`#D4A843`), nyaman dibuka di laptop maupun ponsel cerdas.

---

## 📁 Struktur Berkas

```
├── index.html                   # Halaman utama aplikasi
├── css/
│   ├── style.css                # Layout dasar, tema warna gelap, Leaflet override, FAB
│   ├── sidebar.css              # Styling panel filter, pencarian, dan kartu detail gedung
│   └── popup.css                # Styling custom marker popup dengan badge kategori
├── js/
│   ├── map-config.js            # Konfigurasi Google Maps tile layer & denah GeoJSON
│   ├── markers.js               # Pengelolaan marker lokasi, layer group, dan animasi
│   ├── sidebar.js               # Logika filter kategori dan panel detail lokasi
│   ├── search.js                # Algoritma fuzzy search dengan highlight match
│   ├── routing.js               # Mesin navigasi rute berbasis algoritma A*
│   ├── custom-pins.js           # Pengelolaan penanda kustom dan localStorage
│   └── app.js                   # Inisialisasi utama aplikasi
├── data/
│   ├── locations.json           # Database 58 lokasi kampus IPB (koordinat GPS akurat)
│   ├── categories.json          # 12 definisi kategori dengan warna & ikon
│   ├── waypoints.json           # Graf simpul jalan & bobot jarak untuk navigasi rute
│   └── campus-layout.json       # Poligon GeoJSON kawasan & denah gedung
└── assets/
    └── icons/                   # 12 berkas ikon SVG kategori
```

---

## 🚀 Cara Menjalankan Secara Lokal

Aplikasi ini menggunakan Vanilla HTML/CSS/JavaScript tanpa build tool, cukup jalankan server lokal:

```bash
# Menggunakan Python
python -m http.server 8080

# Atau menggunakan Node.js
npx serve .
```

Buka peramban di [http://localhost:8080](http://localhost:8080).

---

## 🛠️ Teknologi

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+ Modular)
- **GIS Mapping:** Leaflet.js 1.9.4
- **Base Map Tiles:** Google Maps API Tiles & OpenStreetMap
- **Data:** GeoJSON & JSON

---

## 📄 Lisensi

Projek ini dibuat untuk keperluan edukasi dan pengenalan kampus IPB University.
