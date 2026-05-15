-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PPK', 'PPTK', 'KABID', 'DIREKSI_TEKNIS', 'KONSULTAN_PENGAWAS', 'TIM_PENGAWAS', 'KONSULTAN_PERENCANA', 'TIM_PERENCANA', 'PIMPINAN', 'KONTRAKTOR');

-- CreateEnum
CREATE TYPE "StatusProyek" AS ENUM ('AKTIF', 'SELESAI', 'TERLAMBAT', 'DIHENTIKAN');

-- CreateEnum
CREATE TYPE "StatusMasalah" AS ENUM ('OPEN', 'PROSES', 'SELESAI');

-- CreateEnum
CREATE TYPE "Prioritas" AS ENUM ('RENDAH', 'SEDANG', 'TINGGI', 'KRITIS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'KONTRAKTOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyek" (
    "id" TEXT NOT NULL,
    "kodeProyek" TEXT NOT NULL,
    "namaProyek" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "nilaiKontrak" DOUBLE PRECISION NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3) NOT NULL,
    "status" "StatusProyek" NOT NULL DEFAULT 'AKTIF',
    "progresRencana" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progresRealisasi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaporanHarian" (
    "id" TEXT NOT NULL,
    "proyekId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "cuaca" TEXT NOT NULL,
    "progres" DOUBLE PRECISION NOT NULL,
    "keterangan" TEXT NOT NULL,
    "foto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaporanHarian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaporanMingguan" (
    "id" TEXT NOT NULL,
    "proyekId" TEXT NOT NULL,
    "mingguKe" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3) NOT NULL,
    "progresAwal" DOUBLE PRECISION NOT NULL,
    "progresAkhir" DOUBLE PRECISION NOT NULL,
    "totalProgres" DOUBLE PRECISION NOT NULL,
    "cuacaDominan" TEXT,
    "kendalaMinggu" TEXT,
    "rencanaMinggu" TEXT,
    "realisasiMinggu" TEXT,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaporanMingguan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaporanBulanan" (
    "id" TEXT NOT NULL,
    "proyekId" TEXT NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "progresAwal" DOUBLE PRECISION NOT NULL,
    "progresAkhir" DOUBLE PRECISION NOT NULL,
    "totalProgres" DOUBLE PRECISION NOT NULL,
    "nilaiPrestasi" DOUBLE PRECISION,
    "kendalaUtama" TEXT,
    "tindakLanjut" TEXT,
    "rencanaBulanDepan" TEXT,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaporanBulanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KurvaS" (
    "id" TEXT NOT NULL,
    "proyekId" TEXT NOT NULL,
    "minggu" INTEGER NOT NULL,
    "rencana" DOUBLE PRECISION NOT NULL,
    "realisasi" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KurvaS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Masalah" (
    "id" TEXT NOT NULL,
    "proyekId" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "status" "StatusMasalah" NOT NULL DEFAULT 'OPEN',
    "prioritas" "Prioritas" NOT NULL DEFAULT 'SEDANG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Masalah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "proyekId" TEXT,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "dibaca" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proyekId" TEXT,
    "aksi" TEXT NOT NULL,
    "detail" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Proyek_kodeProyek_key" ON "Proyek"("kodeProyek");

-- AddForeignKey
ALTER TABLE "LaporanHarian" ADD CONSTRAINT "LaporanHarian_proyekId_fkey" FOREIGN KEY ("proyekId") REFERENCES "Proyek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaporanMingguan" ADD CONSTRAINT "LaporanMingguan_proyekId_fkey" FOREIGN KEY ("proyekId") REFERENCES "Proyek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaporanBulanan" ADD CONSTRAINT "LaporanBulanan_proyekId_fkey" FOREIGN KEY ("proyekId") REFERENCES "Proyek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KurvaS" ADD CONSTRAINT "KurvaS_proyekId_fkey" FOREIGN KEY ("proyekId") REFERENCES "Proyek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Masalah" ADD CONSTRAINT "Masalah_proyekId_fkey" FOREIGN KEY ("proyekId") REFERENCES "Proyek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_proyekId_fkey" FOREIGN KEY ("proyekId") REFERENCES "Proyek"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_proyekId_fkey" FOREIGN KEY ("proyekId") REFERENCES "Proyek"("id") ON DELETE SET NULL ON UPDATE CASCADE;
