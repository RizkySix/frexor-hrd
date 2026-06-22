import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const RATING_IDS = [
  "q1","q2","q3","q4","q5",
  "q6","q7","q8","q9",
  "q10","q11","q12","q13",
  "q14","q15","q16","q17",
  "q18","q19","q20","q21",
  "q22","q23","q24","q25",
  "q26",
];

function genAnswers(skew: 1 | 2 | 3 | 4): Record<string, number> {
  // skew = nilai rata-rata yang "diinginkan", jitter ±1
  const out: Record<string, number> = {};
  for (const id of RATING_IDS) {
    const jitter = Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    const v = Math.min(4, Math.max(1, skew + jitter));
    out[id] = v;
  }
  return out;
}

const DUMMY_SUBMISSIONS: {
  skew: 1 | 2 | 3 | 4;
  text: Record<string, string | null>;
}[] = [
  {
    skew: 4,
    text: {
      feedback_1: "Toilet bersih, AC dingin. Lanjutkan!",
      feedback_2: null,
      feedback_3: "Beban kerja kadang berat di musim peak.",
      feedback_4: null,
      feedback_5: "Lebih banyak pelatihan English untuk tour guide.",
      feedback_6: null,
      q27: "Kekeluargaan, lingkungan kerja yang positif.",
      q28: "Tools online masih agak lambat.",
      q29: "Adakan team building rutin per kuartal.",
      q30: "Ya, nyaman dengan tim dan culture-nya.",
    },
  },
  {
    skew: 3,
    text: {
      feedback_1: null,
      feedback_2: "Komunikasi antar divisi perlu lebih jelas.",
      feedback_3: null,
      feedback_4: "Bonus kurang transparan parameternya.",
      feedback_5: null,
      feedback_6: "Lebih sering town hall untuk update arah perusahaan.",
      q27: "Brand yang kuat di pasar Bali.",
      q28: "Promosi kadang lama keputusannya.",
      q29: "Buat career path yang jelas per role.",
      q30: "Mungkin ya, tergantung perkembangan karier.",
    },
  },
  {
    skew: 2,
    text: {
      feedback_1: "Pantry perlu lebih sering dibersihkan.",
      feedback_2: "Atasan kurang responsif terhadap masukan.",
      feedback_3: "Work-life balance susah, sering lembur.",
      feedback_4: "Gaji belum match dengan beban kerja.",
      feedback_5: "Belum ada training program yang terstruktur.",
      feedback_6: null,
      q27: "Tim yang kompak.",
      q28: "Work-life balance & transparansi kompensasi.",
      q29: "Naikkan benefit & buat workload yang realistis.",
      q30: "Belum yakin, sedang explore kesempatan lain.",
    },
  },
  {
    skew: 3,
    text: {
      feedback_1: null,
      feedback_2: null,
      feedback_3: null,
      feedback_4: null,
      feedback_5: "Pelatihan customer service sangat bermanfaat.",
      feedback_6: null,
      q27: "Pengalaman & exposure ke tamu internasional.",
      q28: "Sistem absensi sering error.",
      q29: "Migrasi ke sistem HR yang lebih modern.",
      q30: "Ya, masih banyak yang ingin dipelajari di sini.",
    },
  },
  {
    skew: 4,
    text: {
      feedback_1: "Suasana kantor nyaman & rapi.",
      feedback_2: "Atasan suportif, sering 1-on-1.",
      feedback_3: null,
      feedback_4: null,
      feedback_5: "Boleh ada budget untuk kursus eksternal.",
      feedback_6: "Top management sangat approachable.",
      q27: "Culture yang menghargai inisiatif individu.",
      q28: "Skala bonus belum konsisten antar departemen.",
      q29: "Adakan recognition rutin (employee of the month).",
      q30: "Ya, sangat puas dengan environment-nya.",
    },
  },
];

async function seedHRD() {
  const existing = await prisma.hRDUser.findUnique({
    where: { email: "hrd@company.com" },
  });
  if (existing) {
    console.log("ℹ️  Akun HRD sudah ada, skip seed user.");
    return;
  }
  await prisma.hRDUser.create({
    data: {
      email: "hrd@company.com",
      password: await bcrypt.hash("password123", 10),
      name: "HRD Admin",
    },
  });
  console.log("✅ Akun HRD default dibuat: hrd@company.com / password123");
}

async function seedSurveyDummies() {
  const existing = await prisma.surveySubmission.count();
  if (existing > 0) {
    console.log(`ℹ️  Survey submission sudah ada (${existing}), skip seed dummy.`);
    return;
  }
  for (const d of DUMMY_SUBMISSIONS) {
    await prisma.surveySubmission.create({
      data: {
        answers: genAnswers(d.skew),
        textAnswers: d.text,
        // simulasi: submission lama tersebar dalam 7 hari terakhir
        submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✅ Seed ${DUMMY_SUBMISSIONS.length} dummy survey submissions`);
}

async function main() {
  await seedHRD();
  await seedSurveyDummies();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
