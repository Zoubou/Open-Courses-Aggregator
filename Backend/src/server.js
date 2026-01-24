import app from "./app.js";
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// Συνάρτηση για αυτόματο τρέξιμο του harvester
function autoRunHarvester() {
    const sources = ['kaggle', 'kaggle2'];
    
    console.log("Starting automatic harvester sync...");
    
    sources.forEach((source) => {
        const harvesterDir = path.resolve(__dirname, '../../harvester');
        const harvesterFile = path.resolve(harvesterDir, 'index.js');
        
        console.log(`Triggering sync for source: ${source}`);
        exec(`node "${harvesterFile}" --source=${source}`, { cwd: harvesterDir }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[${source}] EXEC ERROR:`, error.message);
            }
            if (stderr) {
                console.error(`[${source}] STDERR:`, stderr);
            }
            if (stdout) {
                console.log(`[${source}] STDOUT:`, stdout);
            }
        });
    });
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Τρέξε τον harvester αυτόματα μετά από λίγο καιρό
    setTimeout(() => {
        autoRunHarvester();
    }, 2000); // Περίμενε 2 δευτερόλεπτα ώστε η σύνδεση με τη ΒΔ να γίνει
});