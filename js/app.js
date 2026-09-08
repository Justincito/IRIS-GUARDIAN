import { GuardianDataSource } from './data-service.js';


/* ============================================================
   UTILIDADES
   ============================================================ */

const $ = id =>
    document.getElementById(id);


/* ============================================================
   ESTADOS
   ============================================================ */

const STATUS = {

    ok: [
        'Funcionando',
        'ok'
    ],

    warning: [
        'Revisar',
        'warning'
    ],

    error: [
        'No disponible',
        'error'
    ],

    offline: [
        'Desconectado',
        'error'
    ],

    syncing: [
        'Sincronizando',
        'warning'
    ],

    unknown: [
        'Sin confirmar',
        'neutral'
    ]
};


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function esc(value) {

    return String(
        value ?? ''
    )
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


/* ============================================================
   TIEMPO RELATIVO
   ============================================================ */

function rel(timestamp) {

    if (!timestamp) {

        return '—';
    }


    const source =
        typeof timestamp === 'number'
            ? timestamp * 1000
            : timestamp;


    const date =
        new Date(source);


    const time =
        date.getTime();


    if (
        !Number.isFinite(time)
    ) {

        return '—';
    }


    const seconds =
        Math.max(
            0,
            Date.now() - time
        ) / 1000;


    if (seconds < 10) {

        return 'ahora';
    }


    if (seconds < 60) {

        return `hace ${Math.floor(seconds)} s`;
    }


    const minutes =
        seconds / 60;


    if (minutes < 60) {

        return `hace ${Math.floor(minutes)} min`;
    }


    const hours =
        minutes / 60;


    if (hours < 24) {

        return `hace ${Math.floor(hours)} h`;
    }


    return `hace ${Math.floor(hours / 24)} d`;
}


/* ============================================================
   HORA
   ============================================================ */

function clock(timestamp) {

    if (!timestamp) {

        return '—';
    }


    const source =
        typeof timestamp === 'number'
            ? timestamp * 1000
            : timestamp;


    const date =
        new Date(source);


    if (
        !Number.isFinite(
            date.getTime()
        )
    ) {

        return '—';
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


/* ============================================================
   ESTADO GLOBAL
   ============================================================ */

function globalStatus(device) {

    const status =
        device?.status;


    const dot =
        $('global-status-dot');


    const text =
        $('global-status-text');


    if (!dot || !text) {

        return;
    }


    let cls =
        'error';

    let label =
        'IRIS sin conexión';


    if (status === 'online') {

        cls =
            'success';

        label =
            'IRIS conectado';

    } else if (
        status === 'syncing'
    ) {

        cls =
            'warning';

        label =
            'IRIS sincronizando';
    }


    dot.className =
        `status-dot status-dot--${cls}`;


    text.textContent =
        label;
}


/* ============================================================
   DISPOSITIVO
   ============================================================ */

function renderDevice(deviceData) {

    const d =
        deviceData || {};


    const name =
        $('device-name');


    const id =
        $('device-id');


    const lastSync =
        $('device-last-sync');


    const badge =
        $('device-status-badge');


    if (name) {

        name.textContent =
            d.name ||
            'IRIS Horizon 001';
    }


    if (id) {

        id.textContent =
            d.id ||
            'IRIS-HORIZON-001';
    }


    if (lastSync) {

        lastSync.textContent =
            `Actualizado ${rel(
                d.last_update
            )}`;
    }


    if (badge) {

        const map = {

            online: [
                'Conectado',
                'success'
            ],

            syncing: [
                'Sincronizando',
                'warning'
            ],

            offline: [
                'Desconectado',
                'error'
            ]

        };


        const [
            label,
            cls
        ] =
            map[d.status] ||
            [
                'Sin confirmar',
                'neutral'
            ];


        badge.className =
            `status-badge status-badge--${cls}`;


        badge.innerHTML =
            `<span class="status-dot status-dot--${cls}"></span>${label}`;
    }


    const networkState =
        $('network-state');


    if (networkState) {

        networkState.textContent =

            d.status === 'online'
                ? 'Estable'

                : d.status === 'syncing'
                    ? 'Sincronizando'

                    : 'Sin conexión';
    }


    const networkDetail =
        $('network-detail');


    if (networkDetail) {

        networkDetail.textContent =
            d.ip
                ? `Enlace activo · ${esc(d.ip)}`
                : 'Estado de conexión del dispositivo';
    }


    const syncStatus =
        $('sync-status');


    if (syncStatus) {

        syncStatus.textContent =

            d.status === 'online'
                ? 'Estable'

                : d.status === 'syncing'
                    ? 'Sincronizando'

                    : 'Sin conexión';
    }


    const uptime =
        $('uptime-value');


    if (uptime) {

        uptime.textContent =
            d.status === 'online'
                ? 'Sesión activa'
                : 'Fuera de línea';
    }
}


/* ============================================================
   BATERÍA
   ============================================================ */

function battery(data) {

    const b =
        data || {};


    const value =
        $('battery-value');


    const bar =
        $('battery-bar');


    const state =
        $('battery-state');


    const icon =
        $('battery-icon');


    if (!value || !bar) {

        return;
    }


    const p =
        b.percent;


    value.textContent =
        p == null
            ? '—'
            : `${p}%`;


    bar.style.width =
        p == null
            ? '0%'
            : `${Math.max(
                0,
                Math.min(
                    100,
                    p
                )
            )}%`;


    let iconClass =
        'fa-battery-empty';


    let text =
        'Sin lectura';


    let cls =
        'neutral';


    if (p != null) {

        if (p >= 60) {

            iconClass =
                'fa-battery-three-quarters';


            text =
                b.mode === 'demo_timer'

                    ? `Estimación · ${
                        b.remaining_text || '—'
                    }`

                    : 'Estado normal';


            cls =
                'success';


        } else if (p >= 30) {

            iconClass =
                'fa-battery-half';


            text =
                b.remaining_text
                    ? `Quedan ${b.remaining_text}`
                    : 'Batería media';


            cls =
                'warning';


        } else if (p >= 15) {

            iconClass =
                'fa-battery-quarter';


            text =
                b.remaining_text
                    ? `Quedan ${b.remaining_text}`
                    : 'Batería baja';


            cls =
                'warning';


        } else {

            iconClass =
                'fa-battery-empty';


            text =
                b.remaining_text
                    ? `Quedan ${b.remaining_text}`
                    : 'Batería crítica';


            cls =
                'error';
        }
    }


    if (icon) {

        icon.className =
            `fa-solid ${iconClass} battery-icon battery-icon--${cls}`;
    }


    if (state) {

        state.textContent =
            b.mode === 'demo_timer'
                ? `${text} · modo demostración`
                : text;
    }
}


/* ============================================================
   ESTADO DEL SISTEMA
   ============================================================ */

function system(systemData) {

    const s =
        systemData || {};


    const list =
        $('system-list');


    if (!list) {

        return;
    }


    const items = [

        [
            'os',
            'Sistema',
            'fa-microchip'
        ],

        [
            'camera',
            'Cámara',
            'fa-camera'
        ],

        [
            'ai',
            'IA Vision',
            'fa-brain'
        ],

        [
            'sensors',
            'Sensores',
            'fa-radar'
        ],

        [
            'haptic',
            'Motores hápticos',
            'fa-wave-square'
        ],

        [
            'communication',
            'Comunicación',
            'fa-signal'
        ]

    ];


    list.innerHTML =
        items.map(
            (
                [
                    key,
                    label,
                    icon
                ]
            ) => {

                const [
                    text,
                    cls
                ] =
                    STATUS[
                        s[key]
                    ] ||
                    STATUS.unknown;


                return `
                    <div class="system-row">

                        <span>
                            <i class="fa-solid ${icon}"></i>
                            ${label}
                        </span>

                        <strong class="status-text status-text--${cls}">
                            ${text}
                        </strong>

                    </div>
                `;
            }
        ).join('');


    const values =
        items.map(
            ([key]) =>
                s[key]
        );


    const hasError =
        values.some(
            value =>
                [
                    'error',
                    'offline'
                ].includes(value)
        );


    const hasWarning =
        values.some(
            value =>
                [
                    'warning',
                    'syncing'
                ].includes(value)
        );


    const [
        overall,
        cls
    ] =
        hasError

            ? [
                'Atención',
                'error'
            ]

            : hasWarning

                ? [
                    'Revisar',
                    'warning'
                ]

                : [
                    'Normal',
                    'success'
                ];


    const badge =
        $('system-overall-badge');


    if (badge) {

        badge.className =
            `status-badge status-badge--${cls}`;


        badge.innerHTML =
            `<span class="status-dot status-dot--${cls}"></span>${overall}`;
    }
}


/* ============================================================
   GPS
   ============================================================ */

function gps(data) {

    const g =
        data || {};


    const available =
        g.available === true &&
        g.latitude != null &&
        g.longitude != null;


    const state =
        $('gps-state');


    const detail =
        $('gps-detail');


    const badge =
        $('location-badge');


    const latitude =
        $('latitude');


    const longitude =
        $('longitude');


    const accuracy =
        $('gps-accuracy');


    const timestamp =
        $('gps-timestamp');


    if (state) {

        state.textContent =
            available
                ? 'Disponible'
                : 'No disponible';
    }


    if (detail) {

        detail.textContent =
            available

                ? `Precisión ±${g.accuracy ?? '—'} m`

                : 'Módulo GPS pendiente de integración';
    }


    if (badge) {

        badge.className =
            `soft-badge ${
                available
                    ? ''
                    : 'soft-badge--muted'
            }`;


        badge.innerHTML =
            available

                ? '<i class="fa-solid fa-location-dot"></i> Señal disponible'

                : '<i class="fa-solid fa-location-dot"></i> GPS pendiente';
    }


    if (latitude) {

        latitude.textContent =
            available
                ? Number(
                    g.latitude
                ).toFixed(6)
                : '—';
    }


    if (longitude) {

        longitude.textContent =
            available
                ? Number(
                    g.longitude
                ).toFixed(6)
                : '—';
    }


    if (accuracy) {

        accuracy.textContent =
            available &&
            g.accuracy != null

                ? `±${g.accuracy} m`

                : '—';
    }


    if (timestamp) {

        timestamp.textContent =
            available
                ? rel(g.timestamp)
                : '—';
    }
}


/* ============================================================
   ICONO DE DETECCIÓN
   ============================================================ */

function detectionIcon(label) {

    const value =
        String(
            label || ''
        ).toLowerCase();


    if (
        value.includes('persona') ||
        value.includes('person')
    ) {

        return 'fa-person';
    }


    if (
        value.includes('veh') ||
        value.includes('car')
    ) {

        return 'fa-car-side';
    }


    if (
        value.includes('obst')
    ) {

        return 'fa-triangle-exclamation';
    }


    if (
        value.includes('silla') ||
        value.includes('chair')
    ) {

        return 'fa-chair';
    }


    if (
        value.includes('semáforo') ||
        value.includes('traffic')
    ) {

        return 'fa-traffic-light';
    }


    return 'fa-eye';
}


/* ============================================================
   DETECCIONES
   ============================================================ */

function detections(items, aiState) {

    const list =
        Array.isArray(items)
            ? items
            : [];


    const count =
        Number(
            aiState?.detection_count ??
            list.length
        );


    const countElement =
        $('detections-count');


    const badge =
        $('detections-badge');


    const window =
        $('detections-window');


    const container =
        $('detections-list');


    if (countElement) {

        countElement.textContent =
            count;
    }


    if (badge) {

        badge.textContent =
            `${count} ${
                count === 1
                    ? 'detección'
                    : 'detecciones'
            }`;
    }


    if (window) {

        window.textContent =
            'enviado por IRIS';
    }


    if (!container) {

        return;
    }


    if (!list.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span>
                    <i class="fa-solid fa-eye-slash"></i>
                </span>

                <strong>
                    Sin detecciones
                </strong>

                <p>
                    Guardian mostrará aquí los eventos enviados por IRIS.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        list
            .slice(0, 8)
            .map(item => {

                const confidence =
                    Math.round(
                        Number(
                            item.confidence || 0
                        ) * 100
                    );


                return `

                    <div class="detection-item">

                        <div class="detection-item__icon">

                            <i class="fa-solid ${
                                detectionIcon(
                                    item.label
                                )
                            }"></i>

                        </div>


                        <div class="detection-item__body">

                            <strong>
                                ${esc(
                                    item.label
                                )}
                            </strong>

                            <span>
                                ${esc(
                                    item.zone ||
                                    'entorno'
                                )}
                                ·
                                ${rel(
                                    item.timestamp
                                )}
                            </span>

                        </div>


                        <div class="confidence">

                            <strong>
                                ${confidence}%
                            </strong>

                            <span>
                                confianza
                            </span>

                        </div>

                    </div>

                `;
            })
            .join('');
}


/* ============================================================
   HISTORIAL
   ============================================================ */

function timeline(activity) {

    const items =
        Array.isArray(activity)
            ? activity
            : [];


    const container =
        $('timeline-list');


    if (!container) {

        return;
    }


    if (!items.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span>
                    <i class="fa-solid fa-clock"></i>
                </span>

                <strong>
                    Aún no hay actividad
                </strong>

                <p>
                    El historial aparecerá cuando lleguen eventos.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        items
            .slice(0, 10)
            .map(item => {

                const icon =
                    item.type === 'connection'

                        ? 'fa-link'

                        : item.type === 'proximity'

                            ? 'fa-triangle-exclamation'

                            : 'fa-eye';


                const title =
                    item.title ||
                    item.label ||
                    'Actividad IRIS';


                const detail =
                    item.detail
                        ? ` · ${esc(item.detail)}`
                        : '';


                return `

                    <div class="timeline-item">

                        <div class="timeline-item__marker">

                            <i class="fa-solid ${icon}"></i>

                        </div>


                        <div class="timeline-item__content">

                            <strong>
                                ${esc(title)}
                            </strong>

                            <span>
                                ${clock(
                                    item.timestamp
                                )}
                                ·
                                ${rel(
                                    item.timestamp
                                )}
                                ${detail}
                            </span>

                        </div>

                    </div>

                `;
            })
            .join('');
}


/* ============================================================
   ALERTAS
   ============================================================ */

function alerts(items) {

    const list =
        Array.isArray(items)
            ? items
            : [];


    const count =
        $('alert-count');


    const container =
        $('alerts-list');


    if (count) {

        count.textContent =
            list.length;
    }


    if (!container) {

        return;
    }


    if (!list.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span>
                    <i class="fa-solid fa-circle-check"></i>
                </span>

                <strong>
                    Todo tranquilo
                </strong>

                <p>
                    No hay alertas importantes en este momento.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        list
            .map(item => `

                <div class="alert-item alert-item--${
                    esc(
                        item.severity ||
                        'warning'
                    )
                }">

                    <span class="alert-item__icon">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                    </span>


                    <div>

                        <strong>
                            ${esc(
                                item.title ||
                                'Atención'
                            )}
                        </strong>

                        <p>
                            ${esc(
                                item.message ||
                                ''
                            )}
                        </p>

                    </div>

                </div>

            `)
            .join('');
}


/* ============================================================
   SENSORES / HÁPTICOS
   ============================================================ */

function hapticAndSensors(state) {

    /*
     * Los datos permanecen disponibles en el objeto state.
     *
     * La interfaz actual no necesita manipularlos directamente
     * aquí porque las tarjetas detalladas pueden incorporarse
     * posteriormente sin modificar el origen de datos.
     */

    void state;
}


/* ============================================================
   RENDER PRINCIPAL
   ============================================================ */

function render(state) {

    console.log(
        '[GUARDIAN] Estado recibido:',
        state
    );


    globalStatus(
        state.device
    );


    renderDevice(
        state.device
    );


    battery(
        state.battery
    );


    system(
        state.system
    );


    gps(
        state.gps
    );


    detections(
        state.detections,
        state.ai
    );


    timeline(
        state.activity
    );


    alerts(
        state.alerts
    );


    hapticAndSensors(
        state
    );


    const footer =
        $('footer-mode');


    if (footer) {

        footer.textContent =
            state.battery?.mode === 'demo_timer'

                ? 'IRIS conectado · batería en modo demostración'

                : 'Datos remotos · IRIS Guardian';
    }
}


/* ============================================================
   REFRESH
   ============================================================ */

async function refresh() {

    console.log(
        '[GUARDIAN] Consultando estado remoto...'
    );


    try {

        const state =
            await GuardianDataSource.getState();


        render(
            state
        );


        console.log(
            '[GUARDIAN] Estado actualizado correctamente.'
        );


    } catch (error) {

        console.error(
            '[GUARDIAN] Error obteniendo estado:',
            error
        );


        const dot =
            $('global-status-dot');


        const text =
            $('global-status-text');


        const syncStatus =
            $('sync-status');


        const footer =
            $('footer-mode');


        if (dot) {

            dot.className =
                'status-dot status-dot--error';
        }


        if (text) {

            text.textContent =
                'No se pudo sincronizar';
        }


        if (syncStatus) {

            syncStatus.textContent =
                'Error de conexión';
        }


        if (footer) {

            footer.textContent =
                'Guardian · esperando datos';
        }
    }
}


/* ============================================================
   TEMA
   ============================================================ */

function theme() {

    const button =
        $('theme-toggle');


    if (!button) {

        return;
    }


    const saved =
        localStorage.getItem(
            'iris-guardian-theme'
        );


    if (saved === 'dark') {

        document.body.classList.add(
            'dark-mode'
        );
    }


    const updateIcon =
        () => {

            button.innerHTML =

                document.body.classList.contains(
                    'dark-mode'
                )

                    ? '<i class="fa-solid fa-sun"></i>'

                    : '<i class="fa-solid fa-moon"></i>';
        };


    updateIcon();


    button.onclick =
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


            updateIcon();
        };
}


/* ============================================================
   CARGA DEL MODELO 3D
   ============================================================ */

function uploadModel() {

    const input =
        $('model-upload');


    const viewer =
        $('iris-viewer');


    if (!input || !viewer) {

        return;
    }


    input.onchange =
        () => {

            const file =
                input.files?.[0];


            if (file) {

                viewer.src =
                    URL.createObjectURL(
                        file
                    );
            }
        };
}


/* ============================================================
   ESTADO DEL MODELO 3D
   ============================================================ */

function modelState() {

    const viewer =
        $('iris-viewer');


    const empty =
        $('model-empty');


    const status =
        $('model-status');


    if (!viewer) {

        return;
    }


    viewer.addEventListener(
        'load',
        () => {

            if (empty) {

                empty.hidden =
                    true;
            }


            if (status) {

                status.innerHTML =
                    '<span class="status-dot status-dot--success"></span><span>Modelo cargado</span>';
            }
        }
    );


    viewer.addEventListener(
        'error',
        () => {

            if (empty) {

                empty.hidden =
                    false;
            }


            if (status) {

                status.innerHTML =
                    '<span class="status-dot status-dot--error"></span><span>No se encontró el modelo configurado</span>';
            }
        }
    );
}


/* ============================================================
   INICIO
   ============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        console.log(
            '[GUARDIAN] Inicializando IRIS Guardian...'
        );


        theme();


        uploadModel();


        modelState();


        /*
         * PRIMERA CONSULTA INMEDIATA
         */
        await refresh();


        /*
         * ACTUALIZACIÓN PERIÓDICA
         */
        setInterval(
            refresh,
            GuardianDataSource.getPollMs()
        );


        /*
         * Este texto NO toca los datos reales.
         * Solamente evita que la interfaz quede visualmente congelada.
         */
        setInterval(
            () => {

                const stateText =
                    $('device-last-sync');


                if (!stateText) {

                    return;
                }


                stateText.textContent =
                    'Estado remoto · actualización programada';

            },
            15000
        );

    }
);