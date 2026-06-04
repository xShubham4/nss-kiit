require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Event = require("../models/Event");
const Unit = require("../models/Unit");
const { cloudinary } = require("../config/cloudinary");
const AdmZip = require("adm-zip");
const pdfParse = require("pdf-parse");

const SCHOOLS_DIR = "c:\\nss-kiit\\extracted_schools";

const SCHOOL_MAPPING = {
  CIVIL: "School of Civil Engineering",
  KINS: "School of Nursing Sciences",
  KSBT: "School of Biotechnology",
  KSCA: "School of Computer Applications",
  KSEC: "School of Economics & Commerce",
  KSMAE: "School of Mechanical and Aerospace",
  KSMC: "School of Mass Communication",
  KSOL: "School of Law",
  KSOM: "School of Management",
  SOEE: "School of Electronics",
};

const extractTextFromDocx = (filePath) => {
  try {
    const zip = new AdmZip(filePath);
    const docEntry = zip.getEntry("word/document.xml");
    if (!docEntry) return "";
    const xml = docEntry.getData().toString("utf8");
    let text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 500) text = text.substring(0, 500) + "...";
    return text;
  } catch (err) {
    return "[Summary extraction failed]";
  }
};

const extractTextFromPdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    let text = data.text.replace(/\s+/g, " ").trim();
    if (text.length > 500) text = text.substring(0, 500) + "...";
    return text;
  } catch (err) {
    return "[Summary extraction failed]";
  }
};

const getEventsDir = (schoolPath) => {
  const possibleDirs = ["Events", "EVENTS", "EVENT Details"];
  const subdirs = fs.readdirSync(schoolPath, { withFileTypes: true })
    .filter(d => d.isDirectory());
    
  for (const subdir of subdirs) {
    for (const d of possibleDirs) {
        if (subdir.name.toLowerCase() === d.toLowerCase()) {
            return path.join(schoolPath, subdir.name);
        }
    }
    // Check nested once
    const nestedSubdirs = fs.readdirSync(path.join(schoolPath, subdir.name), { withFileTypes: true }).filter(d => d.isDirectory());
    for (const nested of nestedSubdirs) {
        for (const d of possibleDirs) {
            if (nested.name.toLowerCase() === d.toLowerCase()) {
                return path.join(schoolPath, subdir.name, nested.name);
            }
        }
    }
  }
  return null;
};

const findPhotos = (dirPath) => {
  let photos = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      photos = photos.concat(findPhotos(path.join(dirPath, entry.name)));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".pdf"].includes(ext)) {
        photos.push(path.join(dirPath, entry.name));
      }
    }
  }
  return photos;
};

const processSchool = async (schoolKey, schoolName, adminId) => {
  console.log(`\n==================================================`);
  console.log(`PROCESSING SCHOOL: ${schoolKey} -> ${schoolName}`);
  console.log(`==================================================`);
  
  const unit = await Unit.findOne({ name: schoolName });
  if (!unit) {
    console.log(`❌ Unit not found for ${schoolName}. Skipping.`);
    return;
  }
  
  await Event.deleteMany({ unit: unit._id });
  console.log(`🗑  Cleared existing events for ${schoolName}`);

  const schoolPath = path.join(SCHOOLS_DIR, schoolKey);
  const eventsDir = getEventsDir(schoolPath);
  
  if (!eventsDir) {
    console.log(`❌ No Events directory found in ${schoolPath}`);
    return;
  }
  
  console.log(`Found Events directory: ${eventsDir}`);
  const eventEntries = fs.readdirSync(eventsDir, { withFileTypes: true });
  
  for (const entry of eventEntries) {
    let title, summary = "", photoPaths = [];
    
    if (entry.isDirectory()) {
        title = entry.name;
        const eventPath = path.join(eventsDir, entry.name);
        
        // Find docx or txt for summary
        const files = fs.readdirSync(eventPath);
        const docx = files.find(f => f.toLowerCase().endsWith(".docx"));
        if (docx) {
            summary = extractTextFromDocx(path.join(eventPath, docx));
        }
        
        // Find photos
        photoPaths = findPhotos(eventPath).filter(f => !f.toLowerCase().endsWith(".pdf") || docx === undefined);
    } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        title = entry.name.replace(ext, "");
        const filePath = path.join(eventsDir, entry.name);
        
        if (ext === ".pdf") {
            summary = await extractTextFromPdf(filePath);
            photoPaths = [filePath]; // We will upload PDF as image
        } else if ([".jpg", ".jpeg", ".png"].includes(ext)) {
            // KSMC style - random photos
            continue; // We'll handle KSMC special case later if needed
        } else if (ext === ".docx") {
            // KSMC Event Details.docx
            title = "KSMC Event Details";
            summary = extractTextFromDocx(filePath);
            photoPaths = findPhotos(eventsDir).filter(f => [".jpg", ".jpeg", ".png"].includes(path.extname(f).toLowerCase()));
        }
    }
    
    if (!title || photoPaths.length === 0) continue;
    
    // For KSMC, if we found the docx we already got all photos, so we break after one event
    if (schoolKey === "KSMC" && entry.isFile() && !entry.name.endsWith(".docx")) {
        continue;
    }
    
    // Date generation (random recent date if not parsable)
    let date = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
    
    console.log(`\n📌 ${title}`);
    console.log(`  Summary: ${summary.substring(0, 50)}...`);
    
    // Upload photos (limit to 4 for speed)
    const uploadedPhotos = [];
    const uploadPaths = photoPaths.slice(0, 4);
    
    if (uploadPaths.length > 0) {
        process.stdout.write(`  📷 Uploading ${uploadPaths.length} photos... `);
    }
    
    for (const p of uploadPaths) {
        try {
            const stats = fs.statSync(p);
            if (stats.size > 10 * 1024 * 1024) {
                console.log(`\n  ✗ Failed to upload ${path.basename(p)}: File > 10MB`);
                continue;
            }
            
            // For PDF, append .jpg to tell Cloudinary to rasterize the first page
            let publicId = path.basename(p).replace(/\.[^/.]+$/, "");
            let format = path.extname(p).toLowerCase().replace(".", "");
            if (format === "pdf") {
                format = "jpg";
            }
            
            const result = await cloudinary.uploader.upload(p, {
                folder: `nss-kiit/events/${unit.slug}`,
                format: format === "pdf" ? "jpg" : undefined
            });
            uploadedPhotos.push({
                url: result.secure_url,
                publicId: result.public_id
            });
            process.stdout.write("✓ ");
        } catch (err) {
            console.log(`\n  ✗ Error uploading ${path.basename(p)}: ${err.message}`);
        }
    }
    
    if (uploadedPhotos.length === 0) {
        console.log(`\n  ⚠️ Skipping event due to no successful photo uploads.`);
        continue;
    }
    
    const newEvent = new Event({
        title,
        summary: summary || "No summary provided.",
        date,
        photos: uploadedPhotos,
        unit: unit._id,
        createdBy: adminId
    });
    
    await newEvent.save();
    console.log(`\n  ✅ Created event: ${title} (${uploadedPhotos.length} photos)`);
    
    if (schoolKey === "KSMC") break; // Only one event for KSMC
  }
};

const run = async () => {
  await connectDB();
  
  // Ensure Civil Engineering unit exists
  let civil = await Unit.findOne({ slug: "civil-engineering" });
  if (!civil) {
      civil = new Unit({ name: "School of Civil Engineering", slug: "civil-engineering" });
      await civil.save();
      console.log("Added School of Civil Engineering to units.");
  }

  // Find an admin user
  const adminId = "6a20863240fb919b2c7bac1a"; 

  for (const [key, name] of Object.entries(SCHOOL_MAPPING)) {
      await processSchool(key, name, adminId);
  }
  
  console.log("\n🎉 All schools processed!");
  mongoose.connection.close();
};

run();
