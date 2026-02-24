// ================= ELEMENTOS =================

const monthInput     = document.getElementById("month");
const totalIncomeEl  = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");
const balanceEl      = document.getElementById("balance");
const mainTableBody  = document.getElementById("main-table-body");
const tableFooter    = document.getElementById("table-footer");
const downloadPdfBtn = document.getElementById("download-pdf-btn");
const addEntryBtn    = document.getElementById("add-entry-btn");
const tabIncome      = document.getElementById("tab-income");
const tabExpense     = document.getElementById("tab-expense");
const monthDisplay   = document.getElementById("month-display");
const monthPrev      = document.getElementById("month-prev");
const monthNext      = document.getElementById("month-next");

// ================= ESTADO =================

let activeTab    = "income";
let currentMonth = getCurrentMonth();
let incomes      = [];
let expenses     = [];

const MONTHS = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

// ================= INIT =================

function init() {
    loadData();

    const params   = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "income" || tabParam === "expense") {
        activeTab = tabParam;
    }

    monthInput.value = currentMonth;
    updateMonthDisplay();
    setActiveTab(activeTab);
    renderSummary();
}

init();

// ================= FECHA =================

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ================= STORAGE =================

function saveData() {
    localStorage.setItem("incomes",  JSON.stringify(incomes));
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

function loadData() {
    incomes  = JSON.parse(localStorage.getItem("incomes"))  || [];
    expenses = JSON.parse(localStorage.getItem("expenses")) || [];
}

// ================= RESUMEN =================

function filterByMonth(data) {
    return data.filter(item => item.date.startsWith(currentMonth));
}

function calculateTotal(data) {
    return data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
}

function formatAmount(value) {
    const [intPart, decPart] = value.toFixed(2).split(".");
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${intFormatted},${decPart} €`;
}

function renderSummary() {
    const totalIncome  = calculateTotal(filterByMonth(incomes));
    const totalExpense = calculateTotal(filterByMonth(expenses));
    const balance      = totalIncome - totalExpense;

    totalIncomeEl.textContent  = formatAmount(totalIncome);
    totalExpenseEl.textContent = formatAmount(totalExpense);
    balanceEl.textContent      = formatAmount(balance);
}

// ================= TABS =================

function setActiveTab(tab) {
    activeTab = tab;
    tabIncome.classList.toggle("active",  tab === "income");
    tabExpense.classList.toggle("active", tab === "expense");
    renderTable();
}

tabIncome.addEventListener("click",  () => setActiveTab("income"));
tabExpense.addEventListener("click", () => setActiveTab("expense"));

// ================= TABLA =================

function renderTable() {
    mainTableBody.innerHTML = "";

    const data     = activeTab === "income" ? filterByMonth(incomes) : filterByMonth(expenses);
    const emptyMsg = activeTab === "income" ? "No hay ingresos este mes" : "No hay gastos este mes";

    if (data.length === 0) {
        const icon    = activeTab === "income" ? "img/triste.png" : "img/feliz.png";
        const iconAlt = activeTab === "income" ? "Sin ingresos" : "Sin gastos";
        mainTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-row">
                    <img src="${icon}" alt="${iconAlt}" class="empty-icon">
                    ${emptyMsg}
                </td>
            </tr>`;
        tableFooter.style.display = "none";
        return;
    }

    data.forEach(item => {
        const row  = document.createElement("tr");
        const d    = new Date(item.date);
        const dia  = String(d.getDate()).padStart(2, '0');
        const mes  = String(d.getMonth() + 1).padStart(2, '0');
        const anio = d.getFullYear();

        row.innerHTML = `
            <td>${item.concept}</td>
            <td>${dia}/${mes}/${anio}</td>
            <td>${formatAmount(parseFloat(item.amount))}</td>
            <td>
                <button class="action-btn edit">Editar</button>
                <button class="action-btn delete">Borrar</button>
            </td>
        `;

        row.querySelector(".edit").addEventListener("click",   () => goToEdit(activeTab, item.id));
        row.querySelector(".delete").addEventListener("click", () => deleteEntry(activeTab, item.id));

        mainTableBody.appendChild(row);
    });

    tableFooter.style.display = "flex";
}

// ================= NAVEGACIÓN =================

addEntryBtn.addEventListener("click", () => {
    window.location.href = `form.html?type=${activeTab}&month=${currentMonth}`;
});

function goToEdit(type, id) {
    window.location.href = `form.html?type=${type}&id=${id}&month=${currentMonth}`;
}

// ================= BORRAR =================

function deleteEntry(type, id) {
    openDeleteModal(type, id);
}

// ================= MODAL DE CONFIRMACIÓN =================

const deleteModal   = document.getElementById("delete-modal");
const modalConfirm  = document.getElementById("modal-confirm");
const modalCancel   = document.getElementById("modal-cancel");
const modalSubtitle = document.getElementById("modal-subtitle");

let pendingDelete = null;

function openDeleteModal(type, id) {
    const label = type === "income" ? "ingreso" : "gasto";
    modalSubtitle.textContent = `¿Seguro que quieres borrar este ${label}?`;
    pendingDelete = { type, id };
    deleteModal.classList.add("active");
}

function closeDeleteModal() {
    deleteModal.classList.remove("active");
    pendingDelete = null;
}

modalConfirm.addEventListener("click", () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;

    if (type === "income") {
        incomes = incomes.filter(i => i.id !== id);
    } else {
        expenses = expenses.filter(i => i.id !== id);
    }

    saveData();
    renderTable();
    renderSummary();
    closeDeleteModal();
});

modalCancel.addEventListener("click", closeDeleteModal);

deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDeleteModal();
});

// ================= SELECTOR DE MES =================

function updateMonthDisplay() {
    const [year, month] = currentMonth.split("-");
    monthDisplay.textContent = `${MONTHS[parseInt(month) - 1]} de ${year}`;
}

function changeMonth(delta) {
    const [year, month] = currentMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    currentMonth     = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthInput.value = currentMonth;
    updateMonthDisplay();
    renderTable();
    renderSummary();
}

monthInput.addEventListener("change", () => {
    currentMonth = monthInput.value;
    updateMonthDisplay();
    renderTable();
    renderSummary();
});

monthPrev.addEventListener("click", () => changeMonth(-1));
monthNext.addEventListener("click", () => changeMonth(1));

// ================= DESCARGAR PDF (tabla activa) =================

downloadPdfBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const data      = activeTab === "income" ? filterByMonth(incomes) : filterByMonth(expenses);
    const typeLabel = activeTab === "income" ? "Ingresos" : "Gastos";
    const [year, month] = currentMonth.split("-");
    const monthName = MONTHS[parseInt(month) - 1];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(28, 25, 23);
    doc.text(`GastoZero - ${typeLabel}`, 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(120, 113, 108);
    doc.text(`${monthName} de ${year}`, 14, 28);

    const rows = data.map(item => {
        const d    = new Date(item.date);
        const dia  = String(d.getDate()).padStart(2, "0");
        const mes  = String(d.getMonth() + 1).padStart(2, "0");
        const anio = d.getFullYear();
        return [item.concept, `${dia}/${mes}/${anio}`, formatAmount(parseFloat(item.amount))];
    });

    const total = calculateTotal(data);
    rows.push(["Total", "", formatAmount(total)]);

    doc.autoTable({
        startY: 34,
        head: [["Concepto", "Fecha", "Cantidad"]],
        body: rows,
        headStyles: { fillColor: [28, 25, 23], textColor: 255, fontStyle: "bold", halign: "center" },
        bodyStyles: { halign: "center", fontSize: 10 },
        columnStyles: {
            0: { halign: "center", cellWidth: "auto" },
            1: { halign: "center", cellWidth: 40 },
            2: { halign: "center", cellWidth: 45 }
        },
        didParseCell: (hookData) => {
            if (hookData.row.index === rows.length - 1 && hookData.section === "body") {
                hookData.cell.styles.fontStyle = "bold";
                hookData.cell.styles.fillColor = [245, 245, 244];
            }
        },
        margin: { left: 14, right: 14 }
    });

    doc.save(`gastocero_${typeLabel.toLowerCase()}_${currentMonth}.pdf`);
});

// ================= DESCARGAR PDF BALANCE =================

document.getElementById("balance-download-btn").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const [year, month] = currentMonth.split("-");
    const monthName = MONTHS[parseInt(month) - 1];

    const allItems = [
        ...filterByMonth(incomes).map(i => ({ ...i, tipo: "income" })),
        ...filterByMonth(expenses).map(i => ({ ...i, tipo: "expense" }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalIncome  = calculateTotal(filterByMonth(incomes));
    const totalExpense = calculateTotal(filterByMonth(expenses));
    const balance      = totalIncome - totalExpense;
    const balanceSign  = balance >= 0 ? "+" : "-";
    const balanceAbs   = formatAmount(Math.abs(balance));

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(28, 25, 23);
    doc.text(`GastoZero - ${monthName} ${year}`, 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(120, 113, 108);

    const rows = allItems.map(item => {
        const d    = new Date(item.date);
        const dia  = String(d.getDate()).padStart(2, "0");
        const mes  = String(d.getMonth() + 1).padStart(2, "0");
        const anio = d.getFullYear();
        const sign = item.tipo === "income" ? "+" : "-";
        return [item.concept, `${dia}/${mes}/${anio}`, `${sign} ${formatAmount(parseFloat(item.amount))}`, item.tipo];    });

    const balanceRow = ["", "", `${balanceSign} ${balanceAbs}`, "balance"];

    doc.autoTable({
        startY: 34,
        head: [["Concepto", "Fecha", "Cantidad"]],
        body: rows.map(r => [r[0], r[1], r[2]]).concat([[balanceRow[0], balanceRow[1], balanceRow[2]]]),
        headStyles: { fillColor: [28, 25, 23], textColor: 255, fontStyle: "bold", halign: "center" },
        bodyStyles: { halign: "center", fontSize: 10, textColor: [28, 25, 23], fillColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        columnStyles: {
            0: { halign: "center", cellWidth: "auto" },
            1: { halign: "center", cellWidth: 45 },
            2: { halign: "center", cellWidth: 50 }
        },
        didParseCell: (hookData) => {
            if (hookData.section !== "body") return;
            const allRows = [...rows, balanceRow];
            const rowMeta = allRows[hookData.row.index];
            if (!rowMeta) return;
            const tipo = rowMeta[3];

            if (tipo === "balance") {
                hookData.cell.styles.fontStyle = "bold";
                hookData.cell.styles.fillColor = [235, 235, 233];
            }
        },
        didDrawCell: (hookData) => {
            if (hookData.section !== "body") return;
            if (hookData.column.index !== 2) return;
            const allRows = [...rows, balanceRow];
            const rowMeta = allRows[hookData.row.index];
            if (!rowMeta) return;
            const tipo = rowMeta[3];
            if (tipo === "balance") return; // la fila de balance ya va toda en negrita

            const cellText = String(hookData.cell.raw || "");
            if (!cellText) return;

            const sign   = cellText.charAt(0);       // "+" o "-"
            const rest   = cellText.slice(1);         // " 1.234,00 €"
            const x      = hookData.cell.x + hookData.cell.padding("left");
            const y      = hookData.cell.y + hookData.cell.height / 2;
            const fs     = hookData.cell.styles.fontSize || 10;
            const cellW  = hookData.cell.width - hookData.cell.padding("left") - hookData.cell.padding("right");

            // Borrar el texto que autoTable ya dibujó
            hookData.doc.setFillColor(255, 255, 255);
            hookData.doc.rect(hookData.cell.x + 0.2, hookData.cell.y + 0.2, hookData.cell.width - 0.4, hookData.cell.height - 0.4, "F");

            // Medir anchos
            hookData.doc.setFontSize(fs);
            hookData.doc.setFont("helvetica", "bold");
            const signW = hookData.doc.getTextWidth(sign);
            hookData.doc.setFont("helvetica", "normal");
            const restW = hookData.doc.getTextWidth(rest);
            const totalW = signW + restW;
            const startX = x + (cellW - totalW) / 2;

            // Dibujar signo en negrita
            hookData.doc.setFont("helvetica", "bold");
            hookData.doc.setTextColor(28, 25, 23);
            hookData.doc.text(sign, startX, y, { baseline: "middle" });

            // Dibujar número en normal
            hookData.doc.setFont("helvetica", "normal");
            hookData.doc.text(rest, startX + signW, y, { baseline: "middle" });
        },
        margin: { left: 14, right: 14 }
    });

    doc.save(`gastocero_balance_${currentMonth}.pdf`);
});