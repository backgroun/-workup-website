const sharp = require('/d/WORK_DATA/2026_workup_website/node_modules/sharp');
const fs = require('fs');
(async () => {
  for (const n of [1, 2]) {
    const src = `thumb_raw_${n}.png`;
    const out = `thumbnail_${n}_960x930.png`;
    await sharp(src)
      .resize(960, 930, { fit: 'cover', position: 'top' })
      .png({ compressionLevel: 9 })
      .toFile(out);
    const meta = await sharp(out).metadata();
    const mb = (fs.statSync(out).size / 1024 / 1024).toFixed(2);
    console.log(`${out} : ${meta.width}x${meta.height}, ${mb}MB`);
  }
})();
