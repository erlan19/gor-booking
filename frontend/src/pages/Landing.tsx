import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, type Court } from "../lib/api";

export default function Landing() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .courts()
      .then((res) => setCourts(res.courts.slice(0, 4)))
      .catch(() => setError("Gagal memuat data lapangan"));
  }, []);

  return (
    <div>
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="max-w-[1280px] mx-auto px-6 md:px-10 py-16 md:py-24"
      >
        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-5">
          Performance Minimalism · GOR Booking
        </p>
        <h1 className="text-[42px] md:text-[68px] font-bold leading-[1.05] tracking-[-0.02em] max-w-3xl">
          Booking lapangan.
          <br />
          Tanpa drama.
        </h1>
        <p className="mt-6 max-w-lg text-on-surface-variant text-base leading-[1.6]">
          Cek ketersediaan real-time, booking dalam hitungan detik, bayar online. Untuk atlet dan
          organizer yang menghargai efisiensi.
        </p>
        <div className="mt-10 flex gap-4">
          <motion.div whileHover={{ translateY: -1 }} whileTap={{ scale: 0.97 }}>
            <Link to="/courts" className="px-6 py-3 text-sm font-semibold bg-primary text-on-primary hover:bg-secondary block">
              Lihat Lapangan
            </Link>
          </motion.div>
          <motion.div whileHover={{ translateY: -1 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/register"
              className="px-6 py-3 text-sm font-semibold border border-primary hover:bg-primary hover:text-on-primary block transition-all duration-200"
            >
              Daftar Akun
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <section className="border-t border-outline-variant">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl font-semibold">Lapangan Populer</h2>
            <Link to="/courts" className="text-sm text-on-surface-variant hover:text-primary transition-colors duration-200">
              Semua lapangan →
            </Link>
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {courts.map((c) => (
              <motion.div
                key={c.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
                }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={`/courts?highlight=${c.id}`}
                  className="border border-outline-variant bg-surface-container p-6 hover:bg-primary hover:text-on-primary group transition-all duration-200 block h-full"
                >
                  <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant group-hover:text-on-primary/60 mb-3 transition-colors duration-200">
                    {c.type}
                  </p>
                  <p className="font-semibold text-lg mb-1">{c.name}</p>
                  <p className="text-sm text-on-surface-variant group-hover:text-on-primary/70 transition-colors duration-200">{c.location}</p>
                  <p className="mt-5 font-bold">Rp {c.pricePerHour.toLocaleString("id-ID")}/jam</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-t border-outline-variant">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "search", title: "Cari & Pilih", desc: "Pilih lapangan, tanggal, dan jam yang tersedia." },
            { icon: "event_available", title: "Konfirmasi", desc: "Isi data & konfirmasi booking dalam sekejap." },
            { icon: "payments", title: "Bayar Online", desc: "QRIS, transfer, atau kartu — langsung terkonfirmasi." },
          ].map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="border border-outline-variant p-6 hover:border-primary transition-colors duration-300"
            >
              <span className="material-symbols-outlined text-3xl text-primary mb-4 block">{s.icon}</span>
              <p className="font-semibold mb-2">{s.title}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
