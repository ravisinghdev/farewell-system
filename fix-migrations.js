const fs = require('fs');
const path = require('path');

const dir = 'supabase/migrations';
const prefix = '20260103_';

const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix));

let counter = 0;
files.forEach(file => {
    const rest = file.substring(prefix.length);
    const seq = String(counter).padStart(6, '0'); // 000000, 000001
    const newName = `20260103${seq}_${rest}`;

    fs.renameSync(path.join(dir, file), path.join(dir, newName));
    console.log(`Renamed ${file} -> ${newName}`);
    counter++;
});
