// ================= CONSTANTES =================

const incomeConcepts  = ["Ayuntamiento", "Subsidio", "Aportación"];
const expenseConcepts = ["Hipoteca", "Defunción", "Adeslas", "Luz", "Movistar+", "Orange", "Uñas", "Google", "Gas", "Moto", "Agua", "Horno", "Gasolina", "Tabaco", "Pilates", "Mercadona", "Ropa", "Nespresso"];

// ================= ELEMENTOS =================

const entryForm         = document.getElementById("entry-form");
const entryIdInput      = document.getElementById("entry-id");
const entryTypeInput    = document.getElementById("entry-type");
const entryConcept      = document.getElementById("entry-concept");
const entryConceptOther = document.getElementById("entry-concept-other");
const entryAmount       = document.getElementById("entry-amount");
const entryDate         = document.getElementById("entry-date");
const formPageTitle     = document.getElementById("form-page-title");
const saveBtnText       = document.getElementById("save-btn-text");

// ================= ESTADO =================

let currentType = "income";
let isEditing   = false;
let fp          = null; // instancia de flatpickr

// ================= INIT =================

(function init() {
    const params = new URLSearchParams(window.location.search);
    const type   = params.get("type") || "income";
    const editId = params.get("id")   || null;

    currentType          = type;
    entryTypeInput.value = type;

    populateConcepts(type);

    // Calcular minDate y maxDate a partir del mes activo pasado por URL
    const monthParam = params.get("month"); // formato "YYYY-MM"
    let minDate = null;
    let maxDate = null;
    let defaultDate = "today";

    if (monthParam) {
        const [y, m] = monthParam.split("-").map(Number);
        minDate = new Date(y, m - 1, 1);                  // primer día del mes
        maxDate = new Date(y, m, 0);                      // último día del mes
        // Si "hoy" no está en ese mes, usar el primer día como fecha por defecto
        const today = new Date();
        const inRange = today >= minDate && today <= maxDate;
        defaultDate = inRange ? "today" : minDate;
    }

    // Inicializar Flatpickr
    fp = flatpickr("#entry-date", {
        locale: "es",
        dateFormat: "Y-m-d",          // formato interno (compatible con el resto del código)
        altInput: true,               // muestra un input de texto amigable al usuario
        altFormat: "d/m/Y",           // ej: "21/02/2026"
        defaultDate: editId ? null : defaultDate,
        minDate,
        maxDate,
        disableMobile: true,          // fuerza flatpickr también en móvil
        allowInput: false
    });

    if (editId) {
        isEditing = true;
        loadForEdit(type, editId);
    }

    // Actualizar el enlace de cancelar para volver al tab correcto
    document.querySelector(".btn.secondary").href = `index.html?tab=${type}`;

    updateLabels();
})();

// ================= CONCEPTOS =================

function populateConcepts(type) {
    const concepts = type === "income" ? incomeConcepts : expenseConcepts;

    entryConcept.innerHTML = "";
    concepts.forEach(c => {
        const opt = document.createElement("option");
        opt.value       = c;
        opt.textContent = c;
        entryConcept.appendChild(opt);
    });

    const otherOpt       = document.createElement("option");
    otherOpt.value       = "Otro";
    otherOpt.textContent = "Añadir otro...";
    entryConcept.appendChild(otherOpt);

    toggleOtherInput();
}

entryConcept.addEventListener("change", toggleOtherInput);

function toggleOtherInput() {
    const show = entryConcept.value === "Otro";
    entryConceptOther.style.display = show ? "block" : "none";
    if (show) entryConceptOther.focus();
    else entryConceptOther.value = "";
}

// ================= LABELS =================

function updateLabels() {
    const typeLabel = currentType === "income" ? "ingreso" : "gasto";

    if (isEditing) {
        formPageTitle.textContent = `Editar ${typeLabel}`;
        saveBtnText.textContent   = "Guardar cambios";
    } else {
        formPageTitle.textContent = `Añadir ${typeLabel}`;
        saveBtnText.textContent   = "Guardar entrada";
    }
}

// ================= CARGAR PARA EDITAR =================

function loadForEdit(type, id) {
    const key  = type === "income" ? "incomes" : "expenses";
    const data = JSON.parse(localStorage.getItem(key)) || [];
    const item = data.find(i => i.id === id);

    if (!item) {
        window.location.href = "index.html";
        return;
    }

    entryIdInput.value = id;
    entryAmount.value  = item.amount;

    // Establecer la fecha en flatpickr
    fp.setDate(item.date, true);

    const concepts = type === "income" ? incomeConcepts : expenseConcepts;
    if (concepts.includes(item.concept)) {
        entryConcept.value              = item.concept;
        entryConceptOther.style.display = "none";
    } else {
        entryConcept.value              = "Otro";
        entryConceptOther.value         = item.concept;
        entryConceptOther.style.display = "block";
    }
}

// ================= IMPORTE: solo números =================

entryAmount.addEventListener("keydown", (e) => {
    const allowed = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End","."];
    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
        e.preventDefault();
    }
});

// ================= GUARDAR =================

entryForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const conceptValue = entryConcept.value === "Otro"
        ? entryConceptOther.value.trim()
        : entryConcept.value;

    const amountValue = entryAmount.valueAsNumber;

    // Obtener la fecha desde flatpickr (formato Y-m-d)
    const dateValue = fp.selectedDates.length > 0
        ? fp.formatDate(fp.selectedDates[0], "Y-m-d")
        : null;

    if (!conceptValue || isNaN(amountValue) || amountValue <= 0 || !dateValue) return;

    const key    = currentType === "income" ? "incomes" : "expenses";
    const data   = JSON.parse(localStorage.getItem(key)) || [];
    const editId = entryIdInput.value;

    if (editId) {
        const item = data.find(i => i.id === editId);
        if (item) {
            item.concept = conceptValue;
            item.amount  = amountValue;
            item.date    = dateValue;
        }
    } else {
        data.push({
            id:      Date.now().toString(),
            concept: conceptValue,
            amount:  amountValue,
            date:    dateValue
        });
    }

    localStorage.setItem(key, JSON.stringify(data));
    window.location.href = `index.html?tab=${currentType}`;
});