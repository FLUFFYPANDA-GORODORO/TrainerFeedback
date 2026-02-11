const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'public/CollegeLogo');

if (!fs.existsSync(targetDir)) {
    console.log("Directory not found!");
    process.exit(1);
}

const files = fs.readdirSync(targetDir).filter(file => {
    return fs.statSync(path.join(targetDir, file)).isFile() && !file.startsWith('.');
});

console.log(`Found ${files.length} files. Renaming...`);

files.forEach((file, index) => {
    const ext = path.extname(file);
    const oldPath = path.join(targetDir, file);
    const newName = `College${index + 1}${ext}`;
    const newPath = path.join(targetDir, newName);

    // Skip if already named correctly (to avoid overwriting issues if running multiple times, though simple rename might conflict if not careful. 
    // Best to rename to temp first or just be careful. 
    // Given the previous failure, let's just rename directly but with a check.)
    if (file !== newName) {
         try {
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed: ${file} -> ${newName}`);
         } catch (e) {
             console.error(`Error renaming ${file}:`, e);
         }
    }
});

console.log("Done.");
