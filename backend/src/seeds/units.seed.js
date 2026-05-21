require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Unit = require("../models/Unit");

const units = [
  { name: "School of Computer Engineering", slug: "computer-engineering" },
  { name: "School of Electronics Engineering", slug: "electronics-engineering" },
  { name: "School of Electrical Engineering", slug: "electrical-engineering" },
  { name: "School of Mechanical Engineering", slug: "mechanical-engineering" },
  { name: "School of Civil Engineering", slug: "civil-engineering" },
  { name: "School of Biotechnology", slug: "biotechnology" },
  { name: "School of Management", slug: "management" },
  { name: "School of Law", slug: "law" },
  { name: "School of Mass Communication", slug: "mass-communication" },
  { name: "School of Fashion Technology", slug: "fashion-technology" },
  { name: "School of Film and Media Sciences", slug: "film-media-sciences" },
  { name: "School of Public Health", slug: "public-health" },
  { name: "School of Rural Management", slug: "rural-management" },
  { name: "School of Humanities", slug: "humanities" },
  { name: "School of Architecture", slug: "architecture" },
  { name: "School of Applied Sciences", slug: "applied-sciences" },
];

const seed = async () => {
  await connectDB();
  await Unit.deleteMany({});
  const inserted = await Unit.insertMany(units);
  console.log(`Seeded ${inserted.length} units successfully.`);
  mongoose.connection.close();
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});