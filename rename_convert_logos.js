const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const targetDir = path.join(__dirname, "public/CollegeLogo");

console.log(`Scanning ${targetDir}...`);

// Ensure directory exists
if (!fs.existsSync(targetDir)) {
  console.error(`Directory not found: ${targetDir}`);
  process.exit(1);
}

/* -------------------------------------------------
   CONVERT/OPTIMIZE IMAGES TO WEBP AND RENAME
   Handles: PNG, JPEG, JPG, AVIF, and WebP files
------------------------------------------------- */
const imageFiles = fs
  .readdirSync(targetDir)
  .filter((file) => {
    const fullPath = path.join(targetDir, file);
    return (
      fs.existsSync(fullPath) &&
      fs.statSync(fullPath).isFile() &&
      /\.(png|jpe?g|webp|avif)$/i.test(fullPath)
    );
  })
  // Sort naturally to handle numbered files if any, though user wants generic renaming
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

console.log(`Found ${imageFiles.length} images.`);

let completed = 0;

// Create a temporary directory to store new files
const tempDir = path.join(targetDir, "temp_processed");
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

async function processImages() {
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fullPath = path.join(targetDir, file);
        const newFileName = `College${i + 1}.webp`;
        const destination = path.join(tempDir, newFileName);

        try {
            await sharp(fullPath)
                .rotate()
                .resize({
                    width: 1280,
                    height: 1280,
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .webp({ quality: 80, effort: 4 }) // Increased quality slightly, reduced effort for speed
                .toFile(destination);
            
            console.log(`✅ Processed: ${file} -> ${newFileName}`);
            completed++;
        } catch (err) {
            console.error(`❌ Error converting ${file}:`, err);
        }
    }

    if (completed === imageFiles.length) {
        console.log(`\n✨ All ${completed} images converted successfully!`);
        console.log('Replacing old files with new files...');
        
        // Remove old files
        imageFiles.forEach(file => {
             // Avoid deleting processed files if something went wrong, but here we used a temp dir
             fs.unlinkSync(path.join(targetDir, file));
        });

        // Move new files from temp to target
        const newFiles = fs.readdirSync(tempDir);
        newFiles.forEach(file => {
            fs.renameSync(path.join(tempDir, file), path.join(targetDir, file));
        });

        // Remove temp dir
        fs.rmdirSync(tempDir);
        console.log('Cleanup complete.');
    } else {
        console.warn(`Processed ${completed}/${imageFiles.length}. Check errors.`);
    }
}

processImages();
