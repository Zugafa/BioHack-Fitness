// Variabilă globală pentru ordinea inițială
let ordinaInitiala = [];

window.onload = function () {
    // Salvez ordinea inițială a protocoalelor
    let protocoaleInitiale = document.getElementsByClassName("protocol");
    for (let prot of protocoaleInitiale) {
        ordinaInitiala.push(prot.cloneNode(true));
    }

    function updateRangeInfo() {
        document.getElementById("infoRange").innerHTML = `(${document.getElementById("inp-durata").value.trim()})`;
        document.getElementById("infoRangePrice").innerHTML = `(${document.getElementById("inp-pret").value.trim()})`;
    }

    // Validare inputuri text și textarea
    function valideazaInputuri(afiseazaAlert = true) {
        let inNume = document.getElementById("inp-nume").value.trim();
        let inDescriere = document.getElementById("inp-descriere").value.trim();
        let textareaElement = document.getElementById("inp-descriere");
        
        let valid = true;

        // Verifică dacă nu conțin doar numere (dacă nu sunt goale)
        if (inNume && /^\d+$/.test(inNume)) {
            if (afiseazaAlert) {
                alert("Eroare: Câmpul 'Nume Protocol' nu poate conține doar cifre!");
            }
            valid = false;
        }

        if (inDescriere && /^\d+$/.test(inDescriere)) {
            if (afiseazaAlert) {
                alert("Eroare: Câmpul 'Cuvinte cheie' nu poate conține doar cifre!");
            }
            textareaElement.classList.add("is-invalid");
            valid = false;
        } else {
            textareaElement.classList.remove("is-invalid");
        }

        return valid;
    }

    // Listener pentru a scoate is-invalid la typing
    document.getElementById("inp-descriere").addEventListener("input", function() {
        if (this.value.trim() && !/^\d+$/.test(this.value.trim())) {
            this.classList.remove("is-invalid");
        }
    });

    function aplicaFiltrare(afiseazaAlert = false) {
        if (!valideazaInputuri(afiseazaAlert)) return;

        // Preluare valori din filtre
        let inNume = document.getElementById("inp-nume").value.trim().toLowerCase();
        let inDurata = parseFloat(document.getElementById("inp-durata").value.trim());
        let inPret = parseFloat(document.getElementById("inp-pret").value.trim());
        let inDepartament = document.getElementById("inp-departament").value.trim();
        let inDescriere = document.getElementById("inp-descriere").value.trim().toLowerCase();
        let inRecurent = document.getElementById("inp-recurent").checked;
        let inSesiuni = document.getElementById("inp-sesiuni").value.trim() !== "" ? 
            parseInt(document.getElementById("inp-sesiuni").value.trim()) : 0;

        // Tehnologii selectate
        let selectTehnologii = document.getElementById("inp-tehnologii");
        let tehnologiiSelectate = [];
        for (let option of selectTehnologii.selectedOptions) {
            tehnologiiSelectate.push(option.value);
        }

        // Necesita Analize radio button
        let grupRadio = document.getElementsByName("gr_analize");
        let analizeFilter = "toate";
        for (let rad of grupRadio) {
            if (rad.checked) {
                analizeFilter = rad.value;
                break;
            }
        }

        let protocoale = document.getElementsByClassName("protocol");
        let productCount = 0;

        for (let prot of protocoale) {
            prot.style.display = "none";

            // Condiție 1: Nume (căutare parțială)
            let nume = prot.getElementsByClassName("nume-protocol")[0].innerHTML.trim().toLowerCase();
            let cond1 = nume.includes(inNume);

            // Condiție 2: Durata (range - mai mare sau egal)
            let durata = parseInt(prot.getElementsByClassName("val-durata")[0].innerHTML.trim());
            let cond2 = durata >= inDurata;

            // Condiție 2b: Preț (range - mai mic sau egal, ignorând "La cerere")
            let pretText = prot.getElementsByClassName("val-pret")[0].innerHTML.trim();
            let pret = 0;
            if (pretText.includes("La cerere")) {
                pret = Infinity;
            } else {
                pret = parseFloat(pretText.split(" ")[0]);
            }
            let cond2b = pret <= inPret || pret === Infinity;

            // Condiție 3: Departament
            let categorie = prot.className;
            let cond3 = inDepartament === "toate" || categorie.includes(inDepartament.replace(/[- ]/g, '_'));

            // Condiție 4: Descriere (căutare parțială)
            let descriere = prot.getElementsByClassName("descriere-produs")[0].innerHTML.trim().toLowerCase();
            let cond4 = descriere.includes(inDescriere);

            // Condiție 5: Recurent (dacă e bifat checkbox, afișează doar recurente)
            let valRecurent = prot.getElementsByClassName("val-recurent")[0].innerHTML.trim();
            let isRecurent = valRecurent === "Da";
            let cond5 = !inRecurent || isRecurent;

            // Condiție 6: Sesiuni antrenor (mai mare sau egal)
            let sesiuni = parseInt(prot.getElementsByClassName("val-sesiuni")[0].innerHTML.trim());
            let cond6 = sesiuni >= inSesiuni;

            // Condiție 7: Necesita Analize (radio buttons)
            let valAnalize = prot.getElementsByClassName("val-analize")[0].innerHTML.trim();
            let isAnalize = valAnalize === "Da";
            let cond7 = analizeFilter === "toate" || 
                       (analizeFilter === "da" && isAnalize) || 
                       (analizeFilter === "nu" && !isAnalize);

            // Condiție 8: Tehnologii (select multiplu - trebuie să conțină cel puțin una din selectate)
            let valTehnologii = prot.getElementsByClassName("val-tehnologii")[0].innerHTML.trim();
            let cond8 = true;
            if (tehnologiiSelectate.length > 0) {
                cond8 = false;
                for (let tech of tehnologiiSelectate) {
                    if (valTehnologii.includes(tech)) {
                        cond8 = true;
                        break;
                    }
                }
            }

            if (cond1 && cond2 && cond2b && cond3 && cond4 && cond5 && cond6 && cond7 && cond8) {
                prot.style.display = "block";
                productCount++;
            }
        }

        let noProductsMessage = document.getElementById("no-products-message");
        if (noProductsMessage) {
            noProductsMessage.style.display = productCount === 0 ? "block" : "none";
        }
    }

    // Filtrare manuală
    document.getElementById("filtrare").onclick = function () {
        aplicaFiltrare(true);
    }

    // Bonus 4: aplicare imediată la schimbarea valorii fiecărui filtru
    document.getElementById("inp-nume").addEventListener("input", function () {
        aplicaFiltrare();
    });
    document.getElementById("inp-durata").addEventListener("input", function () {
        updateRangeInfo();
        aplicaFiltrare();
    });
    document.getElementById("inp-pret").addEventListener("input", function () {
        updateRangeInfo();
        aplicaFiltrare();
    });
    document.getElementById("inp-departament").addEventListener("change", function () {
        aplicaFiltrare();
    });
    document.getElementById("inp-tehnologii").addEventListener("change", function () {
        aplicaFiltrare();
    });
    document.getElementsByName("gr_analize").forEach(function (radio) {
        radio.addEventListener("change", function () {
            aplicaFiltrare();
        });
    });
    document.getElementById("inp-sesiuni").addEventListener("input", function () {
        aplicaFiltrare();
    });
    document.getElementById("inp-recurent").addEventListener("change", function () {
        aplicaFiltrare();
    });
    document.getElementById("inp-descriere").addEventListener("input", function () {
        aplicaFiltrare();
    });

    // Sortare ascendentă
    document.getElementById("sortare-asc").onclick = function () {
        let protocoale = Array.from(document.getElementsByClassName("protocol"));
        
        protocoale.sort(function (a, b) {
            // Cheia 1: raportul durata/pret
            let durataA = parseInt(a.getElementsByClassName("val-durata")[0].innerHTML.trim());
            let pretA = parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML.trim().split(" ")[0]);
            let pretAValabil = !isNaN(pretA) && pretA > 0 ? pretA : Infinity;
            let ratioA = durataA / pretAValabil;

            let durataB = parseInt(b.getElementsByClassName("val-durata")[0].innerHTML.trim());
            let pretB = parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML.trim().split(" ")[0]);
            let pretBValabil = !isNaN(pretB) && pretB > 0 ? pretB : Infinity;
            let ratioB = durataB / pretBValabil;

            let compareRatio = ratioA - ratioB;
            if (compareRatio !== 0) return compareRatio;

            // Cheia 2: departament (alfabetic)
            let deptA = a.className.split(" ")[1] || "";
            let deptB = b.className.split(" ")[1] || "";
            return deptA.localeCompare(deptB);
        });

        // Reordonez în DOM
        let container = document.querySelector(".grid-produse");
        protocoale.forEach(prot => container.appendChild(prot));
    }

    // Sortare descendentă
    document.getElementById("sortare-desc").onclick = function () {
        let protocoale = Array.from(document.getElementsByClassName("protocol"));
        
        protocoale.sort(function (a, b) {
            // Cheia 1: raportul durata/pret
            let durataA = parseInt(a.getElementsByClassName("val-durata")[0].innerHTML.trim());
            let pretA = parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML.trim().split(" ")[0]);
            let pretAValabil = !isNaN(pretA) && pretA > 0 ? pretA : Infinity;
            let ratioA = durataA / pretAValabil;

            let durataB = parseInt(b.getElementsByClassName("val-durata")[0].innerHTML.trim());
            let pretB = parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML.trim().split(" ")[0]);
            let pretBValabil = !isNaN(pretB) && pretB > 0 ? pretB : Infinity;
            let ratioB = durataB / pretBValabil;

            let compareRatio = ratioB - ratioA;
            if (compareRatio !== 0) return compareRatio;

            // Cheia 2: departament (invers alfabetic)
            let deptA = a.className.split(" ")[1] || "";
            let deptB = b.className.split(" ")[1] || "";
            return deptB.localeCompare(deptA);
        });

        // Reordonez în DOM
        let container = document.querySelector(".grid-produse");
        protocoale.forEach(prot => container.appendChild(prot));
    }

    // Calculeaza
    document.getElementById("calculeaza").onclick = function () {
        if (!valideazaInputuri()) return;

        let protocoale = Array.from(document.getElementsByClassName("protocol"));
        let preturi = [];

        for (let prot of protocoale) {
            if (prot.style.display !== "none") {
                let pretText = prot.getElementsByClassName("val-pret")[0].innerHTML.trim();
                // Extrag doar cifra din "xxx RON"
                let pret = parseFloat(pretText.split(" ")[0]);
                if (!isNaN(pret)) {
                    preturi.push(pret);
                }
            }
        }

        if (preturi.length === 0) {
            alert("Nu sunt protocoale visibile pentru calcul!");
            return;
        }

        // Calcul
        let suma = preturi.reduce((a, b) => a + b, 0);
        let media = suma / preturi.length;
        let minim = Math.min(...preturi);
        let maxim = Math.max(...preturi);

        // Creare și afișare notificare
        let notificare = document.createElement("div");
        notificare.id = "notification-calc";
        notificare.innerHTML = `
            <h3>Calcule Preț</h3>
            <p><strong>Suma:</strong> ${suma.toFixed(2)} RON</p>
            <p><strong>Media:</strong> ${media.toFixed(2)} RON</p>
            <p><strong>Minim:</strong> ${minim.toFixed(2)} RON</p>
            <p><strong>Maxim:</strong> ${maxim.toFixed(2)} RON</p>
        `;
        document.body.appendChild(notificare);

        // Dispariție după 2 secunde
        setTimeout(function () {
            notificare.remove();
        }, 2000);
    }

    // Resetare filtre (cu confirm pentru anul 2 CTI)
    document.getElementById("resetare").onclick = function () {
        if (!confirm("Doriți cu adevărat să resetați filtrele?")) {
            return;
        }

        // Resetare inputuri text
        document.getElementById("inp-nume").value = "";
        document.getElementById("inp-descriere").value = "";

        // Resetare range
        document.getElementById("inp-durata").value = "0";
        document.getElementById("infoRange").innerHTML = "(0)";

        // Resetare range preț la maximul disponibil, astfel încât toate produsele să fie vizibile implicit
        document.getElementById("inp-pret").value = document.getElementById("inp-pret").max;
        document.getElementById("infoRangePrice").innerHTML = "(" + document.getElementById("inp-pret").max + ")";

        // Resetare select-uri
        document.getElementById("inp-departament").value = "toate";
        
        // Resetare select multiplu
        let selectTehnologii = document.getElementById("inp-tehnologii");
        for (let option of selectTehnologii.options) {
            option.selected = false;
        }

        // Resetare datalist
        document.getElementById("inp-sesiuni").value = "";

        // Resetare checkbox
        document.getElementById("inp-recurent").checked = false;

        // Resetare radio buttons
        document.querySelector('input[name="gr_analize"][value="toate"]').checked = true;

        // Afișare toate protocoalele în ordinea inițială
        let container = document.querySelector(".grid-produse");
        ordinaInitiala.forEach(prot => {
            let existing = document.getElementById(prot.id);
            if (existing) {
                container.removeChild(existing);
            }
        });

        ordinaInitiala.forEach(prot => {
            let clone = prot.cloneNode(true);
            container.appendChild(clone);
        });

        document.getElementById("no-products-message").style.display = "none";

        updateRangeInfo();
        aplicaFiltrare();
    }

    updateRangeInfo();
    aplicaFiltrare();
}