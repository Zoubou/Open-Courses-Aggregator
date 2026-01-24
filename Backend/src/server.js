import app from "./app.js";
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Τρέξε τον harvester αυτόματα μετά από λίγο καιρό
    setTimeout(() => {
        autoRunHarvester();
    }, 2000); // Περίμενε 2 δευτερόλεπτα ώστε η σύνδεση με τη ΒΔ να γίνει
});