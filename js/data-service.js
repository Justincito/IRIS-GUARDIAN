/**
 * js/data-service.js
 * ==================
 *
 * Fuente de datos de IRIS Guardian.
 *
 * Flujo actual:
 *
 *     IRIS STUDIO
 *          ↓
 *     GitHub Repository
 *          ↓
 *     GitHub Pages
 *          ↓
 *     public/data/iris-state.json
 *          ↓
 *     IRIS GUARDIAN
 *
 * El servicio NO contiene lógica visual.
 */

const DEMO_STATE = {
    schema_version: 1,

    generated_at: new Date().toISOString(),

    device: {
        id: 'IRIS-HORIZON-001',
        name: 'IRIS Horizon 001',
        status: 'online',
        ip: '192.168.0.100',
        last_update: new Date().toISOString()
    },

    communication: {
        status: 'stable'
    },

    camera: {
        status: 'active',
        fps: 29.8
    },

    ai: {
        status: 'active',
        timestamp: new Date().toISOString(),

        frame: {
            width: 640,
            height: 480
        },

        detection_count: 3,

        primary: {
            label: 'person',
            display_label: 'persona',
            confidence: 0.92,
            zone: 'center',
            score: 0.88,
            substate: null
        },

        detections: [
            {
                label: 'person',
                display_label: 'persona',
                confidence: 0.92,
                zone: 'center',
                score: 0.88,
                substate: null
            },
            {
                label: 'chair',
                display_label: 'silla',
                confidence: 0.84,
                zone: 'left',
                score: 0.55,
                substate: null
            },
            {
                label: 'traffic light',
                display_label: 'semáforo',
                confidence: 0.81,
                zone: 'right',
                score: 0.77,
                substate: 'rojo'
            }
        ],

        voice_text: 'persona al frente, cerca.'
    },

    sensors: {
        status: 'active',

        left: {
            distance_mm: 720,
            distance_m: 0.72,
            status: 'clear',
            confirmed: true
        },

        right: {
            distance_mm: 480,
            distance_m: 0.48,
            status: 'warning',
            confirmed: true
        }
    },

    haptic: {
        status: 'active',
        left: 21,
        center: 0,
        right: 43
    },

    battery: {
        available: true,
        mode: 'demo_timer',
        percent: 82,
        remaining_seconds: 14760,
        remaining_text: '4 h 06 min',
        voltage: null,
        current: null,
        status: 'high',
        estimated_duration_seconds: 18000
    },

    gps: {
        available: false,
        latitude: null,
        longitude: null,
        accuracy: null,
        timestamp: null,
        speed: null,
        altitude: null,
        satellites: null,
        status: 'unavailable'
    },

    activity: [
        {
            type: 'detection',
            timestamp: new Date().toISOString(),
            title: 'Persona detectada',
            detail: 'al frente',
            confidence: 0.92
        }
    ],

    alerts: []
};


/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const CONFIG = {

    /*
     * remote-json = datos reales desde GitHub Pages
     * mock        = datos ficticios locales
     */
    mode: 'remote-json',

    /*
     * IMPORTANTE:
     * Esta ruta es relativa a index.html.
     */
    endpoint: './public/data/iris-state.json',

    /*
     * Durante pruebas usamos 5 segundos.
     * Después podremos devolverlo a un valor mayor.
     */
    pollMs: 5000
};


/* ============================================================
   FETCH
   ============================================================ */

async function fetchJson(url) {

    const cacheBuster = `?t=${Date.now()}`;

    const response = await fetch(
        `${url}${cacheBuster}`,
        {
            method: 'GET',

            cache: 'no-store',

            headers: {
                'Accept': 'application/json'
            }
        }
    );


    if (!response.ok) {

        throw new Error(
            `Guardian state HTTP ${response.status}`
        );
    }


    const contentType =
        response.headers.get('content-type') || '';


    if (
        !contentType.includes('application/json') &&
        !contentType.includes('text/json')
    ) {

        console.warn(
            '[GUARDIAN] Respuesta inesperada:',
            contentType
        );
    }


    return await response.json();
}


/* ============================================================
   NORMALIZACIÓN
   ============================================================ */

function normalize(raw) {

    const s = structuredClone(raw || {});


    /* --------------------------------------------------------
       Estructuras base
       -------------------------------------------------------- */

    s.schema_version ??= 1;

    s.device ??= {};
    s.communication ??= {};
    s.camera ??= {};
    s.ai ??= {};
    s.sensors ??= {};
    s.haptic ??= {};
    s.battery ??= {};
    s.gps ??= {};

    s.activity =
        Array.isArray(s.activity)
            ? s.activity
            : [];

    s.alerts =
        Array.isArray(s.alerts)
            ? s.alerts
            : [];

    s.ai.detections =
        Array.isArray(s.ai.detections)
            ? s.ai.detections
            : [];


    /* --------------------------------------------------------
       Identidad
       -------------------------------------------------------- */

    s.device.id ??=
        'IRIS-HORIZON-001';

    s.device.name ??=
        'IRIS Horizon 001';

    s.device.status ??=
        'unknown';


    /* --------------------------------------------------------
       Batería
       -------------------------------------------------------- */

    if (s.battery.percent != null) {

        const percent =
            Number(s.battery.percent);


        s.battery.percent =
            Number.isFinite(percent)
                ? Math.max(
                    0,
                    Math.min(100, percent)
                )
                : null;

    } else {

        s.battery.percent = null;
    }


    /* --------------------------------------------------------
       GPS
       -------------------------------------------------------- */

    s.gps.available =
        s.gps.available === true;


    /* --------------------------------------------------------
       Estado semántico del sistema
       -------------------------------------------------------- */

    s.system = {

        os: 'ok',

        camera:
            s.camera.status === 'active'
                ? 'ok'
                : 'error',

        ai:
            s.ai.status === 'active'
                ? 'ok'
                : 'error',

        sensors:
            s.sensors.status === 'active'
                ? 'ok'
                : 'error',

        haptic:
            s.haptic.status === 'active'
                ? 'ok'
                : 'offline',

        communication:
            s.communication.status === 'stable'
                ? 'ok'
                : 'offline'
    };


    /* --------------------------------------------------------
       Detecciones
       -------------------------------------------------------- */

    const stateTimestamp =
        s.ai.timestamp ||
        s.generated_at ||
        null;


    s.detections =
        s.ai.detections.map(
            (item, index) => ({

                id:
                    item.id ||
                    `d-${index}`,

                label:
                    item.display_label ||
                    item.label ||
                    'Objeto',

                confidence:
                    Number(
                        item.confidence || 0
                    ),

                zone:
                    item.zone ||
                    'unknown',

                substate:
                    item.substate ||
                    null,

                timestamp:
                    item.timestamp ||
                    stateTimestamp
            })
        );


    return s;
}


/* ============================================================
   DATA SOURCE
   ============================================================ */

export const GuardianDataSource = {

    get mode() {

        return CONFIG.mode;
    },


    configure(
        {
            mode = CONFIG.mode,
            endpoint = CONFIG.endpoint,
            pollMs = CONFIG.pollMs
        } = {}
    ) {

        CONFIG.mode =
            mode;

        CONFIG.endpoint =
            endpoint;

        CONFIG.pollMs =
            Number(pollMs) || 5000;
    },


    async getState() {

        if (
            CONFIG.mode === 'mock'
        ) {

            return normalize(
                DEMO_STATE
            );
        }


        const raw =
            await fetchJson(
                CONFIG.endpoint
            );


        return normalize(raw);
    },


    getPollMs() {

        return CONFIG.pollMs;
    }
};