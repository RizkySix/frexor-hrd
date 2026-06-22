export type RatingQuestion = {
  id: string;
  text: string;
};

export type FreeTextQuestion = {
  id: string;
  text: string;
};

export type Section = {
  id: string;
  title: string;
  ratingQuestions: RatingQuestion[];
  feedbackId?: string;
  feedbackLabel?: string;
};

export const SECTIONS: Section[] = [
  {
    id: "s1",
    title: "Lingkungan Kerja (Fisik)",
    ratingQuestions: [
      { id: "q1", text: "Kebersihan dan kerapian lingkungan kerja" },
      { id: "q2", text: "Pencahayaan, ventilasi dan suhu udara di ruang kerja" },
      { id: "q3", text: "Fasilitas (toilet, pantry, ruang istirahat)" },
      { id: "q4", text: "Kondisi peralatan dan teknologi yang disediakan" },
      { id: "q5", text: "Rasa aman dan keselamatan saat bekerja" },
    ],
    feedbackId: "feedback_1",
    feedbackLabel: "Saran dan masukan untuk lingkungan kerja (fisik)",
  },
  {
    id: "s2",
    title: "Hubungan & Komunikasi di Tempat Kerja",
    ratingQuestions: [
      { id: "q6", text: "Hubungan antar rekan kerja" },
      { id: "q7", text: "Dukungan dan keterbukaan dari atasan langsung" },
      { id: "q8", text: "Kemampuan manajemen menyampaikan informasi penting" },
      { id: "q9", text: "Keterbukaan perusahaan terhadap masukan dari karyawan" },
    ],
    feedbackId: "feedback_2",
    feedbackLabel: "Saran dan masukan untuk Hubungan dan Komunikasi",
  },
  {
    id: "s3",
    title: "Pekerjaan & Tanggung Jawab",
    ratingQuestions: [
      { id: "q10", text: "Kejelasan tentang Job Description" },
      { id: "q11", text: "Kesesuaian antara kemampuan dan pekerjaan yang diberikan" },
      { id: "q12", text: "Keseimbangan beban kerja dan waktu pribadi (work-life balance)" },
      { id: "q13", text: "Kesempatan untuk berkontribusi dalam pengambilan keputusan terkait pekerjaan" },
    ],
    feedbackId: "feedback_3",
    feedbackLabel: "Saran dan masukan untuk Pekerjaan dan Tanggung Jawab",
  },
  {
    id: "s4",
    title: "Kepuasan Kompensasi dan Tunjangan",
    ratingQuestions: [
      { id: "q14", text: "Kesesuaian gaji dengan tanggung jawab" },
      { id: "q15", text: "Ketepatan waktu pembayaran gaji" },
      { id: "q16", text: "Keadilan dalam pemberian bonus, tunjangan, insentif" },
      { id: "q17", text: "Kepuasan terhadap tunjangan (BPJS Kesehatan, BPJS TK, dll)" },
    ],
    feedbackId: "feedback_4",
    feedbackLabel: "Saran dan masukan untuk Kompensasi dan Tunjangan",
  },
  {
    id: "s5",
    title: "Pengembangan Karier & Pelatihan",
    ratingQuestions: [
      { id: "q18", text: "Akses terhadap pelatihan dan pengembangan keterampilan" },
      { id: "q19", text: "Kejelasan jalur karier dan promosi" },
      { id: "q20", text: "Adanya evaluasi kinerja yang objektif dan berkala" },
      { id: "q21", text: "Kepedulian perusahaan terhadap pengembangan pribadi" },
    ],
    feedbackId: "feedback_5",
    feedbackLabel: "Saran dan masukan untuk Pengembangan Karir dan Pelatihan",
  },
  {
    id: "s6",
    title: "Kepemimpinan, Budaya dan Kebijakan Perusahaan",
    ratingQuestions: [
      { id: "q22", text: "Kemampuan Top Manajemen dalam membina dan menjadi teladan untuk menciptakan Budaya Perusahaan yang positif" },
      { id: "q23", text: "Perusahaan mendorong kerja sama tim dan kolaborasi" },
      { id: "q24", text: "Usaha pimpinan/manajemen untuk bersikap adil dan menciptakan lingkungan kerja yang sehat" },
      { id: "q25", text: "Kemampuan manajemen untuk terbuka dan merespon kritik yang membangun" },
    ],
    feedbackId: "feedback_6",
    feedbackLabel: "Saran dan masukan untuk Kepemimpinan dan Budaya Perusahaan",
  },
];

export const CLOSING_RATING: RatingQuestion = {
  id: "q26",
  text: "Seberapa puas anda secara keseluruhan bekerja di perusahaan ini",
};

export const CLOSING_TEXT: FreeTextQuestion[] = [
  { id: "q27", text: "Apa yang menurut anda menjadi kelebihan utama perusahaan ini?" },
  { id: "q28", text: "Hal apa yang menurut anda paling perlu diperbaiki atau ditingkatkan?" },
  { id: "q29", text: "Apakah ada saran atau ide untuk meningkatkan kepuasan kerja karyawan?" },
  {
    id: "q30",
    text: "Apakah anda berencana tetap bekerja di perusahaan dalam 1–2 tahun ke depan? Mengapa?",
  },
];

export const RATING_IDS: string[] = [
  ...SECTIONS.flatMap((s) => s.ratingQuestions.map((q) => q.id)),
  CLOSING_RATING.id,
];

export const RATING_TEXT_BY_ID: Record<string, string> = Object.fromEntries(
  [
    ...SECTIONS.flatMap((s) => s.ratingQuestions),
    CLOSING_RATING,
  ].map((q) => [q.id, q.text]),
);

export const SECTION_OF_QUESTION: Record<string, string> = Object.fromEntries(
  SECTIONS.flatMap((s) => s.ratingQuestions.map((q) => [q.id, s.id])),
);

export const RATING_SCALE_LABELS: Record<number, string> = {
  1: "Sangat Tidak Puas",
  2: "Kurang Puas",
  3: "Puas",
  4: "Sangat Puas",
};
