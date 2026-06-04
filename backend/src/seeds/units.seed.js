require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Unit = require("../models/Unit");

const units = [
  { name: "School of Computer Engineering", slug: "computer-engineering" },
  { name: "School of Nursing Sciences", slug: "nursing-sciences" },
  { name: "School of Management", slug: "management" },
  { name: "School of Computer Applications", slug: "computer-applications" },
  { name: "School of Biotechnology", slug: "biotechnology" },
  { name: "School of Economics & Commerce", slug: "economics-commerce" },
  { name: "School of Mechanical and Aerospace", slug: "mechanical-aerospace" },
  { name: "School of Mass Communication", slug: "mass-communication" },
  { name: "School of Law", slug: "law" },
  { name: "School of Electronics", slug: "electronics" },
  { name: "School of Infrontof Everyone", slug: "infrontof-everyone" },
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