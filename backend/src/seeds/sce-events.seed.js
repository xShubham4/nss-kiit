/**
 * Seed script for School of Computer Engineering (SCE) events.
 * 
 * Uploads photos to Cloudinary and creates events in MongoDB.
 * 
 * Usage:  node src/seeds/sce-events.seed.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const connectDB = require("../config/db");
const { cloudinary } = require("../config/cloudinary");
const Event = require("../models/Event");

// ── Configuration ───────────────────────────────────────────────
const SCE_UNIT_ID = "6a21ccd6157554fc38d930ac";
const ADMIN_USER_ID = "6a20863240fb919b2c7bac1a";

const EVENTS_DIR = path.resolve(__dirname, "../../../extracted_sce/NSS SCE KIIT/Events");

// ── Event Data ──────────────────────────────────────────────────
// Summaries extracted from .docx files, dates parsed from content
const eventsData = [
  {
    folderName: "Animal feeding drive",
    title: "Animal Feeding Drive",
    summary:
      "NSS SCE KIIT organized a food drive for stray animals to promote empathy and responsible coexistence. Volunteers distributed nutritional meals across campus, addressing the immediate needs of stray dogs and other animals. Supported by university leadership, the initiative successfully raised awareness for animal welfare and demonstrated how small acts of service can foster a kinder, more inclusive community.",
    date: new Date("2026-03-08"),
  },
  {
    folderName: "Daan Mahotsav",
    title: "Daan Mahotsav",
    summary:
      "NSS SCE KIIT organized Daan Mahotsav 2025, a flagship event promoting social responsibility through diverse initiatives. Key activities included Ann Daan for stray animals, Shiksha Daan for government school students, and Sneh Daan celebrations with specially-abled children. Volunteers also conducted Vastra Daan to provide clothing to underprivileged families, alongside Sadbhavna and Arogya Daan, which supported orphans and the elderly through yoga, music, and health awareness. These efforts collectively fostered a spirit of empathy and community service across the KIIT campus and beyond.",
    date: new Date("2025-10-17"),
  },
  {
    folderName: "Ideathon 2K26",
    title: 'Ideathon 2K26 — "Innovate. Create. Achieve."',
    summary:
      "The NSS unit of KIIT School of Computer Engineering hosted an Ideathon at the Campus 3 Auditorium, drawing 170 volunteers focused on real-world problem-solving. Students pitched creative solutions, including an emergency medical card app, a cigarette waste recycling method and many more. A panel featuring Mr. Sudhir Kumar Jha, Dr. Prachet Bhuyan, and Dr. Ananya Mitra, alongside NSS officers Dr. Smruti Ranjan Das and Dr. Raghunath Dey, provided practical feedback to refine student concepts. The event concluded with winners receiving mementos, successfully sparking a culture of innovation across the campus.",
    date: new Date("2026-03-15"),
  },
  {
    folderName: "National science day",
    title: "National Science Day & Rare Disease Day",
    summary:
      "NSS SCE KIIT visited Jeevan Jyoti Ashram to raise awareness about rare diseases and inspire scientific curiosity. Volunteers performed skits addressing social taboos and menstruation, while educating children on conditions like hemophilia and muscular dystrophy. To make learning interactive, the team demonstrated science experiments, including DNA extraction and volcanic eruptions. The visit concluded with joyful Holi celebrations and heart-to-heart interactions, successfully fostering a spirit of compassion and service while leaving a lasting, positive impact on the children at the ashram.",
    date: new Date("2026-03-01"),
  },
  {
    folderName: "Orphanage Visit",
    title: "Orphanage Visit — Adruta Children Home",
    summary:
      "NSS SCE KIIT visited Adruta Children Home to promote sustainable living and celebrate pre-Holi festivities. Volunteers engaged with children through an inspiring art gallery tour and educational sessions covering safe housing, hygiene, and public transportation. The event featured interactive activities, including a traffic light game, stencil art, and Rangoli making, alongside discussions on Holi safety. Concluding with the distribution of chocolates and crayons, the initiative successfully combined practical life lessons with creative joy, reinforcing the values of community responsibility and empathy.",
    date: new Date("2026-03-01"),
  },
  {
    folderName: "Special Camp",
    title: "Special Camp 2K25 — Mega Plantation Drive",
    summary:
      'NSS SCE KIIT, in collaboration with the Government of Odisha, conducted a week-long Mega Plantation Drive across various locations, including Dutee Chand Athletic Stadium and local schools. Volunteers planted saplings like neem and jamun to enhance green cover and promote climate conservation. A highlight of the camp was the "Ek Ped Maa Ke Naam" initiative, held on the Prime Minister\'s birthday to emphasize environmental sustainability. This drive successfully fostered teamwork and civic responsibility among volunteers while contributing to a greener future through active social service.',
    date: new Date("2025-09-13"),
  },
  {
    folderName: "Women_s day appreciation",
    title: "Women's Day Appreciation",
    summary:
      "To mark International Women's Day, NSS SCE KIIT organized an outreach initiative honoring female support staff, including housekeeping, security, and transport personnel. Volunteers distributed hand-crafted cards and flowers to recognize the vital contributions these women make to campus operations. The event emphasized the dignity of labor and inclusivity, fostering mutual respect between students and staff. Supported by university leadership, the initiative successfully promoted a culture of gratitude, highlighting that the institution's success relies on the dedication of every individual within the community.",
    date: new Date("2026-03-08"),
  },
  {
    folderName: "World syndrome day special school visit",
    title: "World Down Syndrome Day — Special School Visit",
    summary:
      "In observance of World Down Syndrome Day, NSS SCE visited Open Learning Systems, a special school in Bhubaneswar dedicated to children with intellectual disabilities and specific needs. The event focused on social inclusion through artistic activities, interactive hygiene lessons, and games like building paper cup pyramids. The visit concluded with an educational session where teachers explained the biological causes of Down Syndrome and ways society can better support these children.",
    date: new Date("2026-03-21"),
  },
  {
    folderName: "_Nari_ The goddess within_",
    title: '"Nari: The Goddess Within"',
    summary:
      'The program aimed to honor the resilience of women and promote a more inclusive society. The event kicked off with the NSS Anthem, followed by the felicitation of the Chief Guest, Dr. Namrata Misra, who received a sapling as a token of respect. After insightful speeches from Dr. Misra and Programme Officer Dr. Raghunath Dey, volunteers showcased an appreciation video and performed a powerful dance themed around empowerment. The session also included an interactive quiz and a "myth busters" segment to challenge gender stereotypes, rewarding top performers with goodies. It was a vibrant, meaningful tribute to the spirit of womanhood.',
    date: new Date("2026-03-10"),
  },
];

// ── Upload a single photo to Cloudinary ─────────────────────────
async function uploadPhoto(filePath, eventFolder) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const publicId = `nss-kiit/events/sce/${eventFolder}/${fileName}`;

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      folder: "", // public_id already has the full path
      transformation: [{ width: 1200, crop: "limit", quality: "auto" }],
      resource_type: "image",
      overwrite: true,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      caption: "",
    };
  } catch (err) {
    console.error(`  ✗ Failed to upload ${fileName}: ${err.message}`);
    return null;
  }
}

// ── Main Seed Function ──────────────────────────────────────────
async function seedSCEEvents() {
  await connectDB();

  console.log("\n🌱 Starting SCE Events Seed...\n");
  console.log(`  Events directory: ${EVENTS_DIR}`);
  console.log(`  Unit ID: ${SCE_UNIT_ID}`);
  console.log(`  Admin ID: ${ADMIN_USER_ID}\n`);

  // Delete existing events for this unit first
  const deleted = await Event.deleteMany({ unit: SCE_UNIT_ID });
  console.log(`  🗑  Cleared ${deleted.deletedCount} existing SCE events.\n`);

  let successCount = 0;

  for (const eventData of eventsData) {
    console.log(`📌 ${eventData.title}`);

    const photosDir = path.join(EVENTS_DIR, eventData.folderName, "Photographs");

    if (!fs.existsSync(photosDir)) {
      console.log(`  ⚠ No Photographs folder found, skipping.\n`);
      continue;
    }

    const photoFiles = fs
      .readdirSync(photosDir)
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map((f) => path.join(photosDir, f));

    console.log(`  📷 Uploading ${photoFiles.length} photos to Cloudinary...`);

    const photos = [];
    for (const filePath of photoFiles) {
      const photo = await uploadPhoto(filePath, eventData.folderName.replace(/\s+/g, "_"));
      if (photo) {
        photos.push(photo);
        process.stdout.write(`  ✓ `);
      }
    }
    console.log(""); // newline after dots

    if (photos.length === 0) {
      console.log(`  ⚠ No photos uploaded, skipping event.\n`);
      continue;
    }

    const event = await Event.create({
      title: eventData.title,
      summary: eventData.summary,
      date: eventData.date,
      unit: SCE_UNIT_ID,
      photos,
      createdBy: ADMIN_USER_ID,
      isPublished: true,
    });

    console.log(`  ✅ Created event: ${event.title} (${photos.length} photos)\n`);
    successCount++;
  }

  console.log(`\n🎉 Seed complete! ${successCount}/${eventsData.length} events created.\n`);
  mongoose.connection.close();
}

seedSCEEvents().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
