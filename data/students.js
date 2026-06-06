// Bloque: Datos de Estudiantes
// Edita esta lista (STUDENTS) para cambiar rápidamente los estudiantes que aparecen en el juego.

const STUDENTS = [
    "Guest",
    "Guest 1",
    "Guest 2",
    "Guest 3",
    "Guest 4",
    "Guest 5",
    "Guest 6",
    "Guest 7",
    "Guest 8",
    "Guest 9",
    "Guest 10",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
];

function populateStudentsDropdown() {
    const select = document.getElementById('player-name-input');
    if (!select) return;

    // Limpiar todas las opciones existentes excepto la primera ("Select your name...")
    while (select.options.length > 1) {
        select.remove(1);
    }

    // Agregar estudiantes de la lista plana
    STUDENTS.forEach(studentName => {
        const option = document.createElement('option');
        option.value = studentName;
        option.textContent = studentName;
        select.appendChild(option);
    });
}

// Ejecutar al cargar el documento
document.addEventListener('DOMContentLoaded', populateStudentsDropdown);
