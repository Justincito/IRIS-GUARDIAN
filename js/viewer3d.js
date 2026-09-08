// ============================================================
// viewer3d.js
// Visor 3D IRIS - Acabado Aluminio Claro y Sombras Intensas
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    const viewer = document.getElementById('iris-viewer');

    // ========================================================
    // COMPROBAR QUE EXISTE
    // ========================================================
    if (!viewer) {
        console.error('❌ No se encontró el elemento #iris-viewer');
        return;
    }

    // ========================================================
    // CONFIGURACIÓN E ILUMINACIÓN METÁLICA
    // ========================================================
    viewer.setAttribute('auto-rotate', '');
    viewer.setAttribute('auto-rotate-delay', '0');
    
    /* 3 grados por segundo. Una vuelta completa = 2 minutos por vuelta. */
    viewer.setAttribute('rotation-per-second', '3deg');

    // Entorno de luz para reflejos (Esencial para el metal)
    viewer.setAttribute('environment-image', 'neutral');
    viewer.setAttribute('exposure', '1.0'); 
    
    // 🔥 CLAVE PARA LOS GRABADOS: Forzar sombras intensas y duras
    viewer.setAttribute('shadow-intensity', '1.8'); 
    viewer.setAttribute('shadow-softness', '0.5');

    // ========================================================
    // CARGA CORRECTA Y APLICACIÓN DE MATERIAL
    // ========================================================
    viewer.addEventListener('load', () => {

        console.log('✅ Gafas IRIS cargadas correctamente');

        // Mantener el objetivo en el centro
        viewer.setAttribute('camera-target', 'auto auto auto');

        // Encuadre cercano
        viewer.setAttribute('camera-orbit', '0deg 82deg 68%');

        // Vista cerrada
        viewer.setAttribute('field-of-view', '25deg');

        // Intentar actualizar el encuadre
        if (typeof viewer.updateFraming === 'function') {
            viewer.updateFraming();
        }

        // ========================================================
        // 🎨 MATERIAL: ALUMINIO CEPILLADO CLARO (Para resaltar letras)
        // ========================================================
        try {
            const model = viewer.model;
            if (model && model.materials) {
                for (const material of model.materials) {
                    // 1. Color mucho más claro (Plata / Aluminio con un toque azulado)
                    material.pbrMetallicRoughness.setBaseColorFactor([0.65, 0.68, 0.75, 1]);
                    
                    // 2. Sigue siendo metal para los reflejos del entorno
                    material.pbrMetallicRoughness.setMetallicFactor(0.9);
                    
                    // 3. Rugosidad aumentada (Efecto mate/cepillado). 
                    // Crea sombras oscuras en los grabados para que se puedan leer perfectamente.
                    material.pbrMetallicRoughness.setRoughnessFactor(0.45);
                }
                console.log('✨ Material de aluminio claro aplicado con éxito');
            }
        } catch (error) {
            console.warn('⚠️ No se pudo aplicar el material:', error);
        }

        // Mostrar dimensiones en consola
        try {
            if (typeof viewer.getDimensions === 'function') {
                const dimensions = viewer.getDimensions();
                console.log('📐 Dimensiones:', dimensions.toString());
            }

            if (typeof viewer.getBoundingBoxCenter === 'function') {
                const center = viewer.getBoundingBoxCenter();
                console.log('🎯 Centro:', center.toString());
            }
        } catch (error) {
            console.warn('⚠️ No se pudo obtener información del modelo:', error);
        }
    });

    // ========================================================
    // ERROR
    // ========================================================
    viewer.addEventListener('error', (event) => {
        console.error('❌ ERROR AL CARGAR EL MODELO 3D');
        console.error(event);
        console.error('📁 Ruta utilizada:', viewer.getAttribute('src'));
    });

    // ========================================================
    // LISTENER DE INTERACCIÓN
    // ========================================================
    viewer.addEventListener('camera-change', () => {
        // El evento queda disponible para futuras funciones de IRIS Guardian.
    });

    console.log('🚀 Visor 3D IRIS inicializado');
});