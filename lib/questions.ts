export type Question = {
  no: number;
  text: string;
  options: { A: string; B: string; C: string };
};

export const QUESTIONS: Question[] = [
  {
    no: 1,
    text: "Ketika mengoperasikan peralatan baru, saya cenderung untuk:",
    options: {
      A: "membaca instruksi terlebih dahulu",
      B: "mendengarkan penjelasan dari orang lain yang sudah menggunakan",
      C: "mengutak-atik sendiri, saya bisa tahu kemudian seiring saya menggunakannya",
    },
  },
  {
    no: 2,
    text: "Ketika saya membutuhkan arahan dalam perjalanan, saya biasanya:",
    options: {
      A: "bertanya kepada orang lain",
      B: "melihat peta",
      C: "mengikuti kata hati dan mungkin menggunakan kompas",
    },
  },
  {
    no: 3,
    text: "Ketika saya memasak menu makanan baru, saya suka:",
    options: {
      A: "meminta teman untuk menjelaskan bagaimana cara memasak menu tersebut",
      B: "mengikuti naluri saya, coba-coba sendiri",
      C: "mengikuti resep yang ada",
    },
  },
  {
    no: 4,
    text: "Jika saya mengajari seseorang sesuatu hal yang baru, saya cenderung untuk:",
    options: {
      A: "menuliskan instruksi untuk mereka",
      B: "memberikan penjelasan secara lisan",
      C: "mendemonstrasikan terlebih dahulu, lalu membiarkan mereka mencoba sendiri",
    },
  },
  {
    no: 5,
    text: "Saya cenderung untuk mengatakan:",
    options: {
      A: "perhatikan bagaimana saya melakukannya",
      B: "kamu coba sendiri dahulu",
      C: "dengarkan penjelasan saya",
    },
  },
  {
    no: 6,
    text: "Saya sangat menikmati waktu luang saya dengan:",
    options: {
      A: "berolahraga atau bermain puzzle",
      B: "pergi ke bioskop dan menonton film",
      C: "mendengarkan musik dan berbincang dengan teman-teman",
    },
  },
  {
    no: 7,
    text: "Ketika saya pergi berbelanja pakaian, saya cenderung untuk:",
    options: {
      A: "membayangkan bagaimana pakaian tersebut akan terlihat ketika saya pakai",
      B: "menanyakan pendapat kepada pelayan toko",
      C: "mencoba pakaian tersebut dan melihat apakah cocok untuk saya",
    },
  },
  {
    no: 8,
    text: "Ketika saya memilih untuk berlibur, biasanya saya akan:",
    options: {
      A: "membaca banyak brosur",
      B: "mendengarkan rekomendasi dari teman",
      C: "membayangkan bagaimana rasanya berada di tempat tersebut",
    },
  },
  {
    no: 9,
    text: "Jika saya membeli mobil baru, saya akan:",
    options: {
      A: "mendiskusikan apa yang saya butuhkan dengan teman-teman",
      B: "membaca review dari koran dan majalah",
      C: "menguji coba berbagai tipe mobil yang berbeda-beda",
    },
  },
  {
    no: 10,
    text: "Ketika saya mempelajari keterampilan baru, saya paling nyaman:",
    options: {
      A: "berbicara langsung dengan ahlinya hal apa saja yang harus saya lakukan",
      B: "mencoba dahulu sendiri dan mempelajarinya seiring berjalannya waktu",
      C: "melihat apa yang dilakukan oleh ahlinya",
    },
  },
  {
    no: 11,
    text: "Ketika akan memilih makanan dari menu, saya cenderung untuk:",
    options: {
      A: "membayangkan makanan tersebut akan terlihat seperti apa",
      B: "mendiskusikan dengan teman saya",
      C: "membayangkan bagaimana rasa makanan tersebut",
    },
  },
  {
    no: 12,
    text: "Ketika saya mendengarkan sebuah band, saya suka:",
    options: {
      A: "mendengarkan lirik dan irama musik",
      B: "melihat para anggota band dan kerumunan penonton",
      C: "terhanyut dalam irama musik",
    },
  },
  {
    no: 13,
    text: "Ketika saya berkonsentrasi, saya paling sering:",
    options: {
      A: "mendiskusikan permasalahan yang ada dan solusi yang memungkinkan di dalam pikiran saya sendiri",
      B: "bergerak mondar-mandir ke sekeliling, bermain-main dengan pensil atau pulpen dan menyentuh barang-barang di sekitar saya",
      C: "fokus dengan kata-kata atau gambar yang ada di depan saya",
    },
  },
  {
    no: 14,
    text: "Dalam memilih perabotan rumah tangga, saya suka:",
    options: {
      A: "warna dan bentuk perabotan tersebut",
      B: "penjelasan yang diberikan bagian penjualan kepada saya",
      C: "tekstur dari perabotan dan bagaimana rasanya menyentuh barang tersebut",
    },
  },
  {
    no: 15,
    text: "Saya lebih mudah mengingat bila:",
    options: {
      A: "melihat sesuatu hal",
      B: "melakukan sesuatu hal",
      C: "berbicara tentang sesuatu hal",
    },
  },
  {
    no: 16,
    text: "Ketika saya merasa cemas, saya:",
    options: {
      A: "tidak bisa duduk diam, berjalan bolak-balik di sekitar terus menerus",
      B: "membayangkan skenario terburuk",
      C: "berbicara pada diri sendiri di dalam kepala hal apa yang paling membuat saya khawatir",
    },
  },
  {
    no: 17,
    text: "Saya merasa sangat terhubung dengan orang lain karena:",
    options: {
      A: "bagaimana mereka terlihat",
      B: "apa yang mereka katakan kepada saya",
      C: "bagaimana mereka membuat saya merasa nyaman",
    },
  },
  {
    no: 18,
    text: "Ketika saya harus merevisi ulang sebuah presentasi, saya biasanya:",
    options: {
      A: "menulis banyak catatan dan diagram untuk revisi",
      B: "membahas catatan saya, sendiri atau dengan orang lain",
      C: "membayangkan bagaimana membuat ide-ide baru",
    },
  },
  {
    no: 19,
    text: "Jika saya menjelaskan sesuatu ke seseorang, saya cenderung untuk:",
    options: {
      A: "menjelaskan kepada mereka dengan berbagai cara sampai mereka mengerti",
      B: "memperlihatkan kepada mereka apa maksud saya",
      C: "mendorong mereka untuk mencoba dan berbicara mengenai ide-ide saya ketika mereka mencoba",
    },
  },
  {
    no: 20,
    text: "Saya sangat suka:",
    options: {
      A: "mendengarkan musik, radio atau berbicara dengan teman-teman",
      B: "mengambil bagian dalam kegiatan olahraga, mencoba restoran baru dan berdansa",
      C: "menonton film, fotografi, melihat seni",
    },
  },
  {
    no: 21,
    text: "Sebagian besar waktu luang saya habiskan dengan:",
    options: {
      A: "menonton film dan youtube",
      B: "mengobrol dengan teman-teman",
      C: "berolahraga seperti berenang atau bersepeda",
    },
  },
  {
    no: 22,
    text: "Ketika saya harus menghubungi teman baru yang sudah pernah saya temui beberapa kali sebelumnya, saya lebih suka berinteraksi dengan:",
    options: {
      A: "berbicara lewat telepon",
      B: "langsung menemuinya",
      C: "melakukan aktivitas bersama",
    },
  },
  {
    no: 23,
    text: "Saya pertama kali melihat orang dari:",
    options: {
      A: "cara mereka berbicara",
      B: "cara mereka berdiri dan bergerak",
      C: "cara mereka berpenampilan",
    },
  },
  {
    no: 24,
    text: "Jika saya marah, saya cenderung untuk:",
    options: {
      A: "terus menerus berpikir hal apa yang membuat saya marah",
      B: "menaikan suara saya dan memberitahukan ke orang-orang apa yang saya rasakan",
      C: "membanting pintu dan secara fisik menunjukan kemarahan saya",
    },
  },
  {
    no: 25,
    text: "Saya merasa lebih mudah untuk mengingat:",
    options: {
      A: "wajah",
      B: "hal-hal yang telah saya lakukan",
      C: "nama",
    },
  },
  {
    no: 26,
    text: "Anda bisa merasakan seseorang sedang berbohong jika:",
    options: {
      A: "mereka membuat lelucon",
      B: "mereka menghindari untuk melihat Anda",
      C: "nada suara mereka berubah",
    },
  },
  {
    no: 27,
    text: "Ketika saya bertemu dengan teman lama:",
    options: {
      A: 'saya mengatakan "Senang bertemu denganmu"',
      B: 'saya mengatakan "Senang mendengar kabarmu"',
      C: "saya memeluk atau berjabat tangan dengan mereka",
    },
  },
  {
    no: 28,
    text: "Saya dapat mengingat secara baik dengan cara:",
    options: {
      A: "menulis catatan atau mencetak secara rinci",
      B: "mengatakan dengan keras-keras atau mengulang kata-kata dan poin di dalam kepala",
      C: "berlatih atau membayangkan hal tersebut sudah dilakukan",
    },
  },
  {
    no: 29,
    text: "Jika saya harus komplain tentang barang yang rusak, saya paling nyaman untuk:",
    options: {
      A: "komplain lewat telepon",
      B: "menulis surat",
      C: "membawa barang tersebut kembali ke toko atau mengirimkan ke kantor pusat",
    },
  },
  {
    no: 30,
    text: "Saya cenderung untuk mengatakan:",
    options: {
      A: "saya mendengar apa yang kamu katakan",
      B: "saya tahu apa yang kamu rasakan",
      C: "saya mengerti apa yang kamu maksud",
    },
  },
];
