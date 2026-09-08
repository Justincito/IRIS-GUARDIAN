/**
 * js/app.js
 * =========
 *
 * Control de la interfaz de IRIS Guardian.
 *
 * Este archivo consume:
 *
 *     ./public/data/iris-state.json
 *
 * y pinta los datos sobre los elementos existentes
 * en index.html.
 */

import {
    GuardianDataSource
} from './data-service.js';


/* ============================================================
   UTILIDADES
   ============================================================ */

const $ = id =>
    document.getElementById(id);


function safeNumber(value) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : null;
}


/* ============================================================
   TIEMPO
   ============================================================ */

function toDate(timestamp) {

    if (
        timestamp === null ||
        timestamp === undefined ||
        timestamp === ''
    ) {

        return null;
    }


    /*
     * Nuestro JSON utiliza Unix timestamp
     * en segundos.
     */
    if (
        typeof timestamp === 'number'
    ) {

        return new Date(
            timestamp * 1000
        );
    }


    const numeric =
        Number(timestamp);


    if (
        Number.isFinite(numeric)
    ) {

        /*
         * Soporta tanto segundos como
         * milisegundos.
         */
        if (
            numeric < 100000000000
        ) {

            return new Date(
                numeric * 1000
            );
        }


        return new Date(
            numeric
        );
    }


    const date =
        new Date(timestamp);


    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}


function formatTime(timestamp) {

    const date =
        toDate(timestamp);


    if (!date) {

        return '--:--';
    }


    return new Intl.DateTimeFormat(
        'es-PE',
        {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }
    ).format(date);
}


function relativeTime(timestamp) {

    const date =
        toDate(timestamp);


    if (!date) {

        return '—';
    }


    const seconds =
        Math.max(
            0,
            Date.now() -
            date.getTime()
        ) / 1000;


    if (
        seconds < 5
    ) {

        return 'ahora';
    }


    if (
        seconds < 60
    ) {

        return `hace ${Math.floor(seconds)} s`;
    }


    const minutes =
        seconds / 60;


    if (
        minutes < 60
    ) {

        return `hace ${Math.floor(minutes)} min`;
    }


    const hours =
        minutes / 60;


    if (
        hours < 24
    ) {

        return `hace ${Math.floor(hours)} h`;
    }


    return `hace ${Math.floor(hours / 24)} d`;
}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHtml(value) {

    return String(
        value ?? ''
    )
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll(
            "'",
            '&#039;'
        );
}


/* ============================================================
   ESTADO PRINCIPAL
   ============================================================ */

function renderConnection(
    state
) {

    const device =
        state.device || {};


    const status =
        device.status;


    const statusElement =
        $('sys-status');


    const syncElement =
        $('last-sync');


    if (!statusElement) {

        console.error(
            '[GUARDIAN] No existe #sys-status'
        );

    } else {

        if (
            status === 'online'
        ) {

            statusElement.textContent =
                'IRIS conectado';

        } else if (
            status === 'syncing'
        ) {

            statusElement.textContent =
                'IRIS sincronizando';

        } else {

            statusElement.textContent =
                'IRIS desconectado';
        }
    }


    if (syncElement) {

        syncElement.textContent =
            device.last_update

                ? formatTime(
                    device.last_update
                )

                : '--:--';
    }
}


/* ============================================================
   HEADER / ESTADO
   ============================================================ */

function decorateConnectionCard(
    state
) {

    const element =
        $('sys-status');


    if (!element) {

        return;
    }


    const indicator =
        element
            .previousElementSibling;


    const dot =
        indicator?.querySelector(
            '.dot'
        );


    if (!dot) {

        return;
    }


    dot.classList.remove(
        'skeleton-pulse'
    );


    const status =
        state.device?.status;


    if (
        status === 'online'
    ) {

        dot.style.background =
            '#22c55e';

    } else if (
        status === 'syncing'
    ) {

        dot.style.background =
            '#f59e0b';

    } else {

        dot.style.background =
            '#ef4444';
    }
}


/* ============================================================
   MÉTRICAS
   ============================================================ */

function renderMetrics(
    state
) {

    const battery =
        state.battery || {};


    const camera =
        state.camera || {};


    const ai =
        state.ai || {};


    const communication =
        state.communication || {};


    const bat =
        $('bat-val');


    const sys =
        $('sys-val');


    const cam =
        $('cam-val');


    const ia =
        $('ia-val');


    /*
     * Batería
     */
    if (bat) {

        const percent =
            safeNumber(
                battery.percent
            );


        bat.classList.remove(
            'skeleton'
        );


        bat.textContent =
            percent === null
                ? '—'
                : `${percent}%`;
    }


    /*
     * Sistema
     */
    if (sys) {

        sys.classList.remove(
            'skeleton'
        );


        sys.textContent =

            state.device?.status === 'online'
                ? 'ONLINE'
                : 'OFFLINE';


        sys.classList.add(
            state.device?.status === 'online'
                ? 'metric-ok'
                : 'metric-error'
        );
    }


    /*
     * Cámara
     */
    if (cam) {

        cam.classList.remove(
            'skeleton'
        );


        const fps =
            safeNumber(
                camera.fps
            );


        cam.textContent =

            camera.status === 'active'

                ? fps !== null
                    ? `${fps.toFixed(1)} FPS`
                    : 'ACTIVA'

                : 'INACTIVA';


        cam.classList.add(

            camera.status === 'active'

                ? 'metric-ok'

                : 'metric-error'
        );
    }


    /*
     * IA
     */
    if (ia) {

        ia.classList.remove(
            'skeleton'
        );


        const count =
            Number(
                ai.detection_count || 0
            );


        ia.textContent =

            ai.status === 'active'

                ? count === 1
                    ? '1 detección'
                    : `${count} detecciones`

                : 'INACTIVA';


        ia.classList.add(

            ai.status === 'active'

                ? 'metric-ok'

                : 'metric-error'
        );
    }
}


/* ============================================================
   DETECCIONES
   ============================================================ */

function renderDetections(
    state
) {

    const container =
        $('detections-list');


    if (!container) {

        console.error(
            '[GUARDIAN] No existe #detections-list'
        );

        return;
    }


    const detections =
        Array.isArray(
            state.ai?.detections
        )
            ? state.ai.detections
            : [];


    if (
        detections.length === 0
    ) {

        container.innerHTML = `

            <li class="list-item">

                <div class="empty-guardian-data">

                    <i class="fa-solid fa-eye-slash"></i>

                    <strong>
                        Sin detecciones
                    </strong>

                    <span>
                        No se han detectado objetos
                        recientemente.
                    </span>

                </div>

            </li>

        `;

        return;
    }


    container.innerHTML =

        detections
            .slice(0, 10)
            .map(
                (
                    detection
                ) => {

                    const label =

                        detection.display_label ||
                        detection.label ||
                        'Objeto';


                    const confidence =
                        safeNumber(
                            detection.confidence
                        );


                    const zone =
                        detection.zone ||
                        'entorno';


                    return `

                        <li class="list-item guardian-detection">

                            <div class="guardian-detection-icon">

                                <i class="fa-solid fa-eye"></i>

                            </div>


                            <div class="guardian-detection-content">

                                <strong>
                                    ${escapeHtml(label)}
                                </strong>


                                <span>
                                    ${escapeHtml(zone)}
                                </span>

                            </div>


                            <div class="guardian-detection-confidence">

                                ${
                                    confidence !== null

                                        ? `${Math.round(
                                            confidence * 100
                                        )}%`

                                        : '—'
                                }

                            </div>

                        </li>

                    `;
                }
            )
            .join('');
}


/* ============================================================
   HISTORIAL
   ============================================================ */

function renderTimeline(
    state
) {

    const container =
        $('timeline-list');


    if (!container) {

        console.error(
            '[GUARDIAN] No existe #timeline-list'
        );

        return;
    }


    const activity =
        Array.isArray(
            state.activity
        )
            ? state.activity
            : [];


    if (
        activity.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-guardian-data">

                <i class="fa-solid fa-clock"></i>

                <strong>
                    Sin actividad reciente
                </strong>

                <span>
                    El historial aparecerá cuando IRIS
                    envíe eventos.
                </span>

            </div>

        `;

        return;
    }


    container.innerHTML =

        activity
            .slice(0, 10)
            .map(
                item => `

                    <div class="timeline-item guardian-timeline-item">

                        <div class="guardian-timeline-dot">
                            <i class="fa-solid fa-eye"></i>
                        </div>


                        <div class="guardian-timeline-content">

                            <strong>
                                ${escapeHtml(
                                    item.title ||
                                    'Evento IRIS'
                                )}
                            </strong>


                            <span>

                                ${formatTime(
                                    item.timestamp
                                )}

                                ·

                                ${relativeTime(
                                    item.timestamp
                                )}

                                ${
                                    item.detail
                                        ? ` · ${escapeHtml(
                                            item.detail
                                        )}`
                                        : ''
                                }

                            </span>

                        </div>

                    </div>

                `
            )
            .join('');
}


/* ============================================================
   GPS
   ============================================================ */

function renderGPS(
    state
) {

    const gps =
        state.gps || {};


    const map =
        document.querySelector(
            '.map-placeholder'
        );


    if (!map) {

        return;
    }


    const available =
        gps.available === true &&
        gps.latitude !== null &&
        gps.longitude !== null;


    if (!available) {

        map.innerHTML = `

            <div class="map-message">

                <i class="fa-solid fa-satellite-dish pulse-icon"></i>

                <p>
                    Esperando coordenadas GPS...
                </p>

                <div class="coords">

                    <span>
                        GPS no disponible
                    </span>

                </div>

            </div>

        `;

        return;
    }


    map.innerHTML = `

        <div class="map-message">

            <i class="fa-solid fa-location-dot pulse-icon"></i>

            <p>
                IRIS localizado
            </p>

            <div class="coords">

                <span>
                    Latitud: ${Number(
                        gps.latitude
                    ).toFixed(6)}
                </span>

                <span>
                    Longitud: ${Number(
                        gps.longitude
                    ).toFixed(6)}
                </span>

                ${
                    gps.accuracy != null

                        ? `<span>
                            Precisión: ±${gps.accuracy} m
                           </span>`

                        : ''
                }

            </div>

        </div>

    `;
}


/* ============================================================
   LOG DE DIAGNÓSTICO
   ============================================================ */

function logStateSummary(
    state
) {

    console.group(
        '[GUARDIAN] Estado IRIS'
    );


    console.log(
        'Device:',
        state.device
    );


    console.log(
        'Camera:',
        state.camera
    );


    console.log(
        'AI:',
        state.ai
    );


    console.log(
        'Sensors:',
        state.sensors
    );


    console.log(
        'Battery:',
        state.battery
    );


    console.log(
        'GPS:',
        state.gps
    );


    console.groupEnd();
}


/* ============================================================
   RENDER GENERAL
   ============================================================ */

function render(
    state
) {

    console.log(
        '[GUARDIAN] Renderizando estado...'
    );


    renderConnection(
        state
    );


    decorateConnectionCard(
        state
    );


    renderMetrics(
        state
    );


    renderDetections(
        state
    );


    renderTimeline(
        state
    );


    renderGPS(
        state
    );


    logStateSummary(
        state
    );
}


/* ============================================================
   ERROR VISUAL
   ============================================================ */

function renderError(
    error
) {

    console.error(
        '[GUARDIAN] Error:',
        error
    );


    const status =
        $('sys-status');


    const lastSync =
        $('last-sync');


    if (status) {

        status.textContent =
            'Error de conexión';
    }


    if (lastSync) {

        lastSync.textContent =
            'Sin sincronización';
    }


    const bat =
        $('bat-val');


    const sys =
        $('sys-val');


    const cam =
        $('cam-val');


    const ia =
        $('ia-val');


    [
        bat,
        sys,
        cam,
        ia
    ]
        .filter(Boolean)
        .forEach(
            element => {

                element.classList.remove(
                    'skeleton'
                );

                element.textContent =
                    '—';
            }
        );
}


/* ============================================================
   REFRESH
   ============================================================ */

async function refresh() {

    console.log(
        '[GUARDIAN] Consultando iris-state.json...'
    );


    try {

        const state =
            await GuardianDataSource.getState();


        render(
            state
        );


        console.log(
            '[GUARDIAN] ✅ Estado actualizado.'
        );


    } catch (error) {

        renderError(
            error
        );
    }
}


/* ============================================================
   TEMA
   ============================================================ */

function initTheme() {

    const button =
        $('theme-toggle');


    if (!button) {

        return;
    }


    const saved =
        localStorage.getItem(
            'iris-guardian-theme'
        );


    if (
        saved === 'dark'
    ) {

        document.body.classList.add(
            'dark-mode'
        );
    }


    updateThemeIcon(
        button
    );


    button.addEventListener(
        'click',
        () => {

            document.body.classList.toggle(
                'dark-mode'
            );


            localStorage.setItem(

                'iris-guardian-theme',

                document.body.classList.contains(
                    'dark-mode'
                )
                    ? 'dark'
                    : 'light'
            );


            updateThemeIcon(
                button
            );
        }
    );
}


function updateThemeIcon(
    button
) {

    button.innerHTML =

        document.body.classList.contains(
            'dark-mode'
        )

            ? '<i class="fa-solid fa-sun"></i>'

            : '<i class="fa-solid fa-moon"></i>';
}


/* ============================================================
   INICIO
   ============================================================ */

function initGuardian() {

    console.log(
        '=========================================='
    );


    console.log(
        '🛡️ IRIS GUARDIAN'
    );


    console.log(
        '[GUARDIAN] Inicializando frontend...'
    );


    console.log(
        '[GUARDIAN] Endpoint:',
        './public/data/iris-state.json'
    );


    console.log(
        '[GUARDIAN] Poll:',
        GuardianDataSource.getPollMs(),
        'ms'
    );


    initTheme();


    /*
     * Primera lectura inmediata.
     */
    refresh();


    /*
     * Lecturas periódicas.
     */
    setInterval(
        refresh,
        GuardianDataSource.getPollMs()
    );
}


/* ============================================================
   DOM READY
   ============================================================ */

if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initGuardian,
        {
            once: true
        }
    );

} else {

    initGuardian();
}