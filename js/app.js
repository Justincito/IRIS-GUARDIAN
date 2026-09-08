// app.js - Lógica de UI y preparación de Fetch

document.addEventListener('DOMContentLoaded', () => {

    // --- Modo Oscuro / Claro ---

    const themeBtn =
        document.getElementById('theme-toggle');

    const body =
        document.body;


    // Cargar preferencia

    if (
        localStorage.getItem('theme') === 'dark'
    ) {

        body.classList.add('dark-mode');

        themeBtn.innerHTML =
            '<i class="fa-solid fa-sun"></i>';

    }


    themeBtn.addEventListener(
        'click',
        () => {

            body.classList.toggle(
                'dark-mode'
            );


            if (
                body.classList.contains('dark-mode')
            ) {

                localStorage.setItem(
                    'theme',
                    'dark'
                );

                themeBtn.innerHTML =
                    '<i class="fa-solid fa-sun"></i>';

            } else {

                localStorage.setItem(
                    'theme',
                    'light'
                );

                themeBtn.innerHTML =
                    '<i class="fa-solid fa-moon"></i>';

            }

        }
    );


    // --- PREPARACIÓN PARA EXTRACCIÓN DE DATOS ---

    async function fetchServerData() {

        try {

            console.log(
                "Intentando extraer datos... (Vacío por ahora)"
            );

        } catch (error) {

            console.error(
                "Error al obtener los datos de Guardian:",
                error
            );


            document.getElementById(
                'sys-status'
            ).innerText =
                'Error de conexión';

        }

    }


    // fetchServerData();
    // setInterval(fetchServerData, 120000);

});