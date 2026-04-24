const express = require("express");
const path = require("path");
const fs = require("fs");
const sharp = require('sharp');
const sass = require("sass");
const pg = require("pg");
const { get } = require("http");
app = express();
app.set("view engine", "ejs")



obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
}

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

client = new pg.Client({
    database: "biohack_2026",
    user: "andrei",
    password: "andrei",
    host: "localhost",
    port: 5432
})

client.connect(); //transmite date de conectare la bd


// la pornirea serverului, verific daca exista folderele temp, logs, backup, 
// fisiere_uploadate, daca nu exista, le creez
let vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"]
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder, { recursive: true });
    }
}

// setez folderul "resurse" ca folder static, adica pot accesa fisierele din el direct prin url
// de exemplu, daca am un fisier resurse/imagini/logo.png, pot accesa acest fisier
// prin url-ul http://localhost:8080/resurse/imagini/logo.png
// acest lucru este util pentru a putea accesa fisierele css, js, imagini, video, etc. din folderul 
// resurse
app.use("/resurse", express.static(path.join(__dirname, "resurse")));


app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
});


function getGalerieData() {
    return getGalerieDataCuOptiuni({
        sortareEchipe: true,
        maxImagini: 10
    });
}
// functie care primeste un array de imagini, calea absoluta 
// a galeriei si niste optiuni, si proceseaza imaginile din array,
// adica le redimensioneaza si le salveaza in folderele "mediu" si "mic"
//  din galerie
function proceseazaImaginiGalerie(imagini, caleAbsolutaGalerie, optiuni = {}) {
    const { logGenerare = false } = optiuni;

    imagini.forEach(img => {
        const numeBaza = path.parse(img.cale_imagine).name;
        const caleOriginala = path.join(caleAbsolutaGalerie, img.cale_imagine);

        [
            { nume: "mediu", w: 450, q: 95 },
            { nume: "mic", w: 250, q: 90 }
        ].forEach(dim => {
            const folderDest = path.join(caleAbsolutaGalerie, dim.nume);
            const caleNoua = path.join(folderDest, `${numeBaza}.png`);

            if (!fs.existsSync(folderDest)) {
                fs.mkdirSync(folderDest, { recursive: true });
            }

            if (!fs.existsSync(caleNoua)) {
                sharp(caleOriginala)
                    .resize({
                        width: dim.w,
                        kernel: sharp.kernel.lanczos3
                    })
                    .sharpen()
                    .withMetadata()
                    .png({ quality: dim.q })
                    .toFile(caleNoua)
                    .then(() => {
                        if (logGenerare) {
                            console.log(`Generat: ${dim.nume}/${numeBaza}`);
                        }
                    })
                    .catch(err => console.error(`Eroare Sharp la ${numeBaza}:`, err));
            }
        });
    });
}
// functie care citeste datele din fisierul galerie.json,
// filtreaza imaginile care corespund sfertului de ora curent,
// le sorteaza dupa echipa daca optiunea sortareEchipe e true,
// le limiteaza la numarul maxImagini, si apoi le proceseaza
// cu functia proceseazaImaginiGalerie, si returneaza un obiect cu 
// imaginile filtrate
function getGalerieDataCuOptiuni(optiuni = {}) {
    const {
        dataReferinta = new Date(),
        sortareEchipe = false,
        maxImagini = 10,
        logGenerare = false
    } = optiuni;

    const dataJson = fs.readFileSync(path.join(__dirname, "resurse/json/galerie.json"), "utf8");
    const galerie = JSON.parse(dataJson);

    const minut = dataReferinta.getMinutes();
    const sfertCurent = Math.floor(minut / 15) + 1;

    let imaginiFiltrate = galerie.imagini
        .filter(img => img.sfert_ora == sfertCurent);

    if (sortareEchipe) {
        const ordineEchipe = { "cyber-coaches": 1, "bio-analysts": 2, "heart-boosters": 3 };
        imaginiFiltrate = imaginiFiltrate
            .sort((a, b) => (ordineEchipe[a.echipa] || 99) - (ordineEchipe[b.echipa] || 99));
    }

    imaginiFiltrate = imaginiFiltrate.slice(0, maxImagini);

    const caleAbsolutaGalerie = path.join(__dirname, galerie.cale_galerie);
    proceseazaImaginiGalerie(imaginiFiltrate, caleAbsolutaGalerie, { logGenerare });

    return {
        imagini: imaginiFiltrate,
        caleBaza: galerie.cale_galerie
    };
}

function getGalerieAnimataData() {
    // Încărcare date din JSON
    const caleJson = path.join(__dirname, 'resurse/json/galerie.json');
    let dateGalerie;
    try {
        dateGalerie = JSON.parse(fs.readFileSync(caleJson, 'utf8'));
    } catch (err) {
        console.error("[EROARE] Eșec la citirea galerie.json:", err);
        return { imagini: [], cale: "" };
    }

    // Filtrare imagini cu galerie-animata: true
    const imaginiEligibile = dateGalerie.imagini.filter(img => img["galerie-animata"] === true);

    // Număr aleator
    const optiuni = [9, 12, 15];
    const nrImagini = optiuni[Math.floor(Math.random() * optiuni.length)];
    const selectieImagini = imaginiEligibile.slice(0, nrImagini);

    // Compilare SCSS
    const caleScss = path.join(__dirname, 'resurse/scss_ejs/galerie_animata.scss');
    const caleCss = path.join(__dirname, 'resurse/css/galerie_animata.css');
    const variabilaSass = `$nr-imagini: ${nrImagini};\n`;

    try {
        const continutScss = fs.readFileSync(caleScss, 'utf8');
        // Compilare prin injectare de variabilă înaintea codului SCSS
        const rezultat = sass.compileString(variabilaSass + continutScss, {
            style: "compressed",
            loadPaths: [path.join(__dirname, 'resurse/sass')],
            quietDeps: true
        });
        fs.writeFileSync(caleCss, rezultat.css);
    } catch (err) {
        console.error("[SASS_COMPILER_ERROR]:", err.message);
    }

    // Returnăm obiectul cu datele necesare pentru randarea EJS
    return {
        imagini: selectieImagini,
        caleBaza: dateGalerie.cale_galerie
    };
}

// rutele pentru paginile statice
// daca se acceseaza /, /index sau /home, se afiseaza pagina index.ejs
app.get(["/", "/index", "/home"], function (req, res) {
    const dateGalerie = getGalerieData();
    const dateGalerieAnimata = getGalerieAnimataData();
    res.render("pagini/index", {
        ip: req.ip,
        imagini: dateGalerie.imagini,
        caleBaza: dateGalerie.caleBaza,
        imaginiAnimata: dateGalerieAnimata.imagini,
        caleBazaAnimata: dateGalerieAnimata.caleBaza
    });
});

// daca se acceseaza /despre, se afiseaza pagina despre.ejs
// la momentul actual, aceasta pagina nu exista, 
// |deci se va afisa o pagina de eroare generica, 
// dar daca se creeaza pagina despre.ejs in folderul pagini, 
// atunci ea va fi afisata
app.get("/despre", function (req, res) {
    res.render("pagini/despre");
});

// daca se acceseaza /lab, se afiseaza pagina lab.ejs
// aceasta pagina va afisa o galerie de imagini, care se vor incarca din fisierul galerie.json
app.get("/lab", function (req, res) {
    const dateGalerie = getGalerieDataCuOptiuni({
        maxImagini: 10,
        logGenerare: true
    });

    res.render("pagini/lab", {
        ip: req.ip,
        imagini: dateGalerie.imagini,
        caleBaza: dateGalerie.caleBaza
    });
});

app.get("/protocols", function (req, res) {
    clauzaWhere = "";
    if (req.query.tip) {
        clauzaWhere = ` where tip_produs='${req.query.tip}'`
    }
    client.query(`select * from prajituri ${clauzaWhere}`, function (err, rez) { //asta e o
        //  filtrare la nivel server
        if (err) {
            console.error("Eroare la interogare", err);
            afisareEroare(res, 2);
        }
        else {
            res.render("pagini/protocols", {
                prajituri: rez.rows
            });
        }
    }
    )
})

app.get("/protocols/:id", function (req, res) {
    client.query(`select * from prajituri where id=${req.params.id}`, function (err, rez) { //asta e o
        //  filtrare la nivel server
        if (err) {
            console.error("Eroare la interogare", err);
            afisareEroare(res, 2);
        }
        else {
            if (rez.rowCount == 0) {
                afisareEroare(res, 404, "Protocol inexistent", `Nu exista protocol cu id-ul ${req.params.id}`);
            }
            res.render("pagini/protocols", {
                prod: rez.rows[0]
            });
        }
    }
    )
})

// bonus erori
function validareEroriFisierJSON() {
    const caleFisierErori = path.join(__dirname, "resurse/json/erori.json");

    // 1. Verificare existență fisier erori.json
    if (!fs.existsSync(caleFisierErori)) {
        console.error(
            "EROARE: Fișierul 'erori.json' nu a fost găsit!\n" +
            `   Cale căutată: ${caleFisierErori}\n` +
            "   Acțiune necesară: Asigură-te că fișierul erori.json există în folderul 'resurse/json/'.\n" +
            "   Aplicația va fi închisă."
        );
        process.exit(1);
    }

    // Citire și parsare JSON
    let continutRaw, erori;
    try {
        continutRaw = fs.readFileSync(caleFisierErori, "utf-8");
        erori = JSON.parse(continutRaw);
    } catch (err) {
        console.error(
            "   EROARE DE PARSARE: Fișierul erori.json conține JSON invalid!\n" +
            `   Detalii: ${err.message}\n` +
            "   Acțiune necesară: Verifică sintaxa JSON a fișierului erori.json."
        );
        process.exit(1);
    }

    // 2. Verificare proprietăți info_erori, cale_baza, eroare_default
    const propietatiBaza = ["info_erori", "cale_baza", "eroare_default"];
    const propietatilipsete = propietatiBaza.filter(prop => !(prop in erori));

    if (propietatilipsete.length > 0) {
        console.error(
            "   EROARE: Lipsesc proprietăți obligatorii la nivel de rădăcină!\n" +
            `   Proprietăți lipsă: ${propietatilipsete.join(", ")}\n` +
            `   Proprietăți existente: ${Object.keys(erori).join(", ")}\n` +
            `   Proprietăți obligatorii: ${propietatiBaza.join(", ")}\n` +
            "   Acțiune necesară: Adaugă proprietățile lipsă în fișierul erori.json."
        );
        process.exit(1);
    }

    // 3. Verificare proprietăți eroare_default
    const propietatiEroareDefault = ["titlu", "text", "imagine"];
    const propietatiLipsaDefault = propietatiEroareDefault.filter(
        prop => !(prop in erori.eroare_default)
    );

    if (propietatiLipsaDefault.length > 0) {
        console.error(
            "   EROARE: Eroarea default nu are toate proprietățile obligatorii!\n" +
            `   Proprietăți lipsă: ${propietatiLipsaDefault.join(", ")}\n` +
            `   Proprietăți existente: ${Object.keys(erori.eroare_default).join(", ")}\n` +
            `   Proprietăți obligatorii: ${propietatiEroareDefault.join(", ")}\n` +
            "   Acțiune necesară: Asigură-te că eroarea default are proprietățile: titlu, text, imagine."
        );
        process.exit(1);
    }

    // 4. Verificare existență folder cale_baza
    const caleBasaAbsoluta = path.join(__dirname, erori.cale_baza);
    if (!fs.existsSync(caleBasaAbsoluta)) {
        console.error(
            "   EROARE: Folderul specificat în 'cale_baza' nu există!\n" +
            `   Cale de bază (din JSON): ${erori.cale_baza}\n` +
            `   Cale absolută: ${caleBasaAbsoluta}\n` +
            "   Acțiune necesară: Creează folderul sau corectează calea în erori.json."
        );
        process.exit(1);
    }

    // Colectare imagini referențiate
    const imaginiReferentiate = new Set();
    imaginiReferentiate.add(erori.eroare_default.imagine);

    for (let eroare of erori.info_erori) {
        if (eroare.imagine) {
            imaginiReferentiate.add(eroare.imagine);
        }
    }

    // 5. Verificare existență fișiere imagine
    const imaginiLipsa = [];
    for (let numeFisier of imaginiReferentiate) {
        const caleAbsoluta = path.join(caleBasaAbsoluta, numeFisier);
        if (!fs.existsSync(caleAbsoluta)) {
            imaginiLipsa.push({
                numeFisier: numeFisier,
                caleAbsoluta: caleAbsoluta
            });
        }
    }

    if (imaginiLipsa.length > 0) {
        let mesajEroriImagei = "EROARE: Lipsesc fișierele imagine referențiate!\n";
        for (let img of imaginiLipsa) {
            mesajEroriImagei +=
                `   - ${img.numeFisier}\n` +
                `     Cale: ${img.caleAbsoluta}\n`;
        }
        mesajEroriImagei +=
            "   Acțiune necesară: Adaugă fișierele imagine în folderul 'resurse/imagini/erori/' sau " +
            "modifică numele imaginilorîn erori.json pentru a folosi imagini existente.";
        console.error(mesajEroriImagei);
        process.exit(1);
    }

    // 6. Verificare proprietăți duplicate în același obiect, direct pe string-ul JSON brut
    const propDuplicata = continutRaw.match(/\{[^{}]*"([^"]+)"\s*:[^{}]*"\1"\s*:/s);
    if (propDuplicata) {
        console.error(`EROARE: Proprietatea "${propDuplicata[1]}" este specificată de mai multe ori în același obiect din erori.json.`);
        process.exit(1);
    }

    // 7. Verificare identificatori duplicați + afișare proprietăți fără "identificator"
    const grupId = erori.info_erori.reduce((acc, e) => ((acc[e.identificator] ??= []).push(e), acc), {});
    const dubluri = Object.entries(grupId).filter(([, v]) => v.length > 1);
    if (dubluri.length) {
        console.error("EROARE: Există mai multe erori cu același identificator!\n" + dubluri.map(([id, v]) => `   Identificator ${id}:\n` + v.map(e => `     - ${JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k]) => k !== "identificator")))}`).join("\n")).join("\n") + "\n   Acțiune necesară: Fiecare eroare din info_erori trebuie să aibă identificator unic.");
        process.exit(1);
    }

    //toate verificările au trecut
    console.log("Validarea datelor din erori.json: OK");
    return true;
}

// funcție care inițializează obGlobal.obErori cu datele din erori.json,
//  după ce apelează funcția de validare. Dacă validarea eșuează, 
// procesul va fi oprit și nu se va ajunge la această inițializare.
function initErori() {
    // Executare validare - dacă ceva nu e în regulă, funcția va apela process.exit()
    validareEroriFisierJSON();

    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    let erori = obGlobal.obErori = JSON.parse(continut)
    let err_default = erori.eroare_default
    err_default.imagine = path.join(erori.cale_baza, err_default.imagine)
    for (let eroare of erori.info_erori) {
        eroare.imagine = path.join(erori.cale_baza, eroare.imagine)
    }

}
initErori()

// funcție care primește un răspuns și un identificator de eroare, 
// caută eroarea în obGlobal.obErori.info_erori după identificator și 
// afișează pagina de eroare cu datele din fișierul JSON pentru acea eroare, 
// dacă nu o găsește, afișează eroarea default
function afisareEroare(res, identificator, titlu, text, imagine) {
    //TO DO cautam eroarea dupa identificator
    //daca sunt setate titlu, text, imagine, le folosim, 
    //altfel folosim cele din fisierul json pentru eroarea gasita
    //daca nu o gasim, afisam eroarea default
    let eroare = obGlobal.obErori.info_erori.find(elem => elem.identificator == identificator)
    if (eroare?.status) {
        res.status(eroare.status)
    }
    let errDefault = obGlobal.obErori.eroare_default
    res.render("pagini/eroare", {
        imagine: imagine || eroare?.imagine || errDefault.imagine,
        titlu: titlu || eroare?.titlu || errDefault.titlu,
        text: text || eroare?.text || errDefault.text,
    });
}

app.get("/eroare", function (req, res) {
    afisareEroare(res, 404, "Pagina nu a fost gasita");
});

// functie care primeste calea unui fisier scss 
// si o cale optionala pentru css, daca nu e data,
// se pune in acelasi loc cu acelasi nume
function compileazaScss(caleScss, caleCss) {
    // Înainte de compilare, verificăm dacă fișierul CSS există deja pentru a-i face backup
    if (fs.existsSync(caleCss)) {
        // Extrag numele fișierului fără extensie (ex: "stil" din "stil.css")
        const numeFisier = path.basename(caleCss, ".css");

        // Timestamp-ul curent (nr ms)
        const timestamp = Date.now();

        // Noul nume pentru backup: nume_timestamp.css
        const numeBackup = `${numeFisier}_${timestamp}.css`;
        const caleBackup = path.join(obGlobal.folderBackup, numeBackup);

        // Copiez fișierul vechi în folderul backup cu nume cu timestamp
        try {
            fs.copyFileSync(caleCss, caleBackup);
            console.log(`[BACKUP] S-a creat o versiune nouă: ${numeBackup}`);
        } catch (err) {
            console.error(`[EROARE BACKUP] Nu s-a putut crea backup-ul: ${err.message}`);
        }
    }

    try {
        const rezultat = sass.compile(caleScss, {
            style: "expanded",
            quietDeps: true
        });
        fs.writeFileSync(caleCss, rezultat.css);
        console.log(`[SASS] Compilare reușită: ${path.basename(caleScss)} -> ${path.basename(caleCss)}`);
    } catch (err) {
        console.error(`[EROARE SASS] Eroare la compilare pentru ${caleScss}:`, err.message);
    }
}


//la pornirea serverului
// compilez toate fisierele scss din folderul scss
const fisiere = fs.readdirSync(obGlobal.folderScss);

for (let fisier of fisiere) {
    // Verificăm dacă extensia este .scss
    if (path.extname(fisier).toLowerCase() === ".scss") {

        // Ignorăm fișierele parțiale (cele care încep cu underscore, ex: _variabile.scss)
        // deoarece acestea sunt importate, nu compilate individual
        if (!fisier.startsWith("_")) {
            const caleScss = path.join(obGlobal.folderScss, fisier);
            const caleCss = path.join(obGlobal.folderCss, fisier.replace(".scss", ".css"));

            compileazaScss(caleScss, caleCss);
        }
    } else {
        // Opțional: logăm ce ignorăm pentru debugging
        console.log(`[SKIP] Fișierul ${fisier} a fost ignorat (nu este sursă SCSS).`);
    }
}

//ascultam modificarile din folderul scss, daca se modifica un fisier scss, il recompilez
fs.watch(obGlobal.folderScss, (eveniment, numeFis) => {
    // Verificăm dacă fișierul are extensia .scss
    if (numeFis && path.extname(numeFis) === ".scss") {

        let caleAbsolutaScss = path.join(obGlobal.folderScss, numeFis);

        // Verificăm dacă fișierul chiar există (să nu fie o ștergere)
        if (fs.existsSync(caleAbsolutaScss)) {

            // Generăm calea pentru CSS-ul corespondent
            let numeFisCss = numeFis.replace(".scss", ".css");
            let caleAbsolutaCss = path.join(obGlobal.folderCss, numeFisCss);

            console.log(`[WATCH] Detectat: ${numeFis}. Recompilare în curs...`);

            // Apelăm funcția cu sursă și destinație
            compileazaScss(caleAbsolutaScss, caleAbsolutaCss);
        }
    }
});
// la fiecare cerere pentru o pagina (exceptand celelalte rute definite mai sus)
// verificam daca pagina exista, daca nu, afisam o pagina de eroare generica
// este ultima functie app.get deoarece ea va fi apelata doar daca nu s-a potrivit
// niciuna din rutele de mai sus
app.get("/*pagina", function (req, res) {
    console.log("Cale pagina", req.url);
    if (req.url.startsWith("/resurse") && path.extname(req.url) == "") {
        afisareEroare(res, 403);
        return;
    }
    if (path.extname(req.url) == ".ejs") {
        afisareEroare(res, 400);
        return;
    }
    try {
        res.render("pagini" + req.url, function (err, rezRandare) {
            if (err) {
                if (err.message.includes("Failed to lookup view")) {
                    afisareEroare(res, 404, "Pagina nu a fost gasita");
                    return;
                }
                else afisareEroare(res);
                return;
            }
            res.send(rezRandare);
            console.log("Randare", rezRandare);
        });
    } catch (err) {
        if (err.message.includes("Cannot find module")) {
            afisareEroare(res, 404);
        } else afisareEroare(res);
        return;
    }
});


function verificaImagini() {
    const fs = require("fs");
    const path = require("path");

    const caleJson = path.join(__dirname, "resurse/json/galerie.json");

    // Verificăm dacă fișierul de configurare există
    if (!fs.existsSync(caleJson)) {
        console.error(`\x1b[31m[CRITICAL]\x1b[0m Fișierul de configurare '${caleJson}' lipsește.`);
        return;
    }

    try {
        const date = JSON.parse(fs.readFileSync(caleJson, "utf8"));

        // 1. Validare Folder Galerie (cale_galerie)
        // Rezolvăm calea: dacă e relativă, o raportăm la directorul curent
        const caleFolderGalerie = path.isAbsolute(date.cale_galerie)
            ? date.cale_galerie
            : path.join(__dirname, date.cale_galerie);

        if (!fs.existsSync(caleFolderGalerie)) {
            console.error(
                `\x1b[31m[EROARE CONFIGURARE]\x1b[0m\n` +
                `Proprietatea "cale_galerie" indică spre un folder inexistent.\n` +
                `➜ Calea căutată: ${caleFolderGalerie}\n` +
                `➜ Sursă: galerie.json\n` +
                `➜ Remediere: Creați folderul sau corectați calea în fișierul JSON.\n`
            );
            return; // Nu putem verifica imaginile dacă folderul părinte nu există
        }

        // 2. Validare Fișiere Imagine
        let imaginiLipsa = [];

        date.imagini.forEach((img, index) => {
            // Folosim 'cale_imagine' conform structurii din proiectul tău
            const numeFisier = img.cale_imagine;
            const caleAbsolutaImg = path.join(caleFolderGalerie, numeFisier);

            if (!fs.existsSync(caleAbsolutaImg)) {
                imaginiLipsa.push({
                    index: index,
                    fisier: numeFisier,
                    caleCompleta: caleAbsolutaImg
                });
            }
        });

        // Afișare rezultate
        if (imaginiLipsa.length > 0) {
            console.warn(`\x1b[33m[EROARE DATE GALERIE]\x1b[0m S-au găsit ${imaginiLipsa.length} fișiere lipsă:`);

            imaginiLipsa.forEach(err => {
                console.warn(
                    `  • Imaginea [${err.index}] ("${err.fisier}") nu a fost găsită.\n` +
                    `    Cale verificată: ${err.caleCompleta}`
                );
            });
            console.warn(`\x1b[33m[SFAT]\x1b[0m Asigurați-vă că numele fișierelor din JSON corespund exact cu cele de pe disc (case-sensitive pe Linux).\n`);
        } else {
            console.log("\x1b[32m[VALIDARE GALERIE]\x1b[0m Toate resursele grafice din galerie au fost validate cu succes.");
        }

    } catch (err) {
        console.error(`\x1b[31m[EROARE PARSARE]\x1b[0m galerie.json nu este un JSON valid: ${err.message}`);
    }
}
verificaImagini()
app.listen(8080);
console.log("Serverul a pornit!");