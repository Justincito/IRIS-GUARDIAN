/**
 * js/data-service.js
 * ==================
 *
 * Fuente oficial de datos de IRIS Guardian.
 *
 * Flujo:
 *
 * IRIS STUDIO
 *     ↓
 * public/data/iris-state.json
 *     ↓
 * GitHub
 *     ↓
 * GitHub Pages
 *     ↓
 * IRIS Guardian
 */

const CONFIG = {
    mode: 'remote-json',

    endpoint: './public/data/iris-state.json',

    /*
     * Durante pruebas:
     * consultar cada 30 segundos.
     */
    pollMs: 30000
};


/* ============================================================
   ESTADO MOCK
   ============================================================ */

const DEMO_STATE = {
    schema_version: 1,

    generated_at: Date.now() / 1000,

    device: {
        id: 'IRIS-HORIZON-001',
        name: 'IRIS Horizon 001',
        status: 'online',
        ip: '192.168.0.100',
        last_update: Date.now() / 1000
    },

    communication: {
        status: 'stable'
    },

    camera: {
        status: 'active',
        fps: 12.5
    },

    ai: {
        status: 'active',
        timestamp: Date.now() / 1000,

        frame: {
            width: 640,
            height: 480
        },

        detection_count: 1,

        primary: {
            label: 'person',
            display_label: 'persona',
            confidence: 0.92,
            zone: 'center',
            score: 0.92,
            substate: null
        },

        detections: [
            {
                label: 'person',
                display_label: 'persona',
                confidence: 0.92,
                zone: 'center',
                score: 0.92,
                substate: null
            }
        ],

        voice_text: ''
    },

    sensors: {
        status: 'active',

        left: {
            distance_mm: 480,
            distance_m: 0.48,
            status: 'warning',
            confirmed: true
        },

        right: {
            distance_mm: 720,
            distance_m: 0.72,
            status: 'clear',
            confirmed: true
        }
    },

    haptic: {
        status: 'active',
        left: 70,
        center: 24,
        right: 0
    },

    battery: {
        available: true,
        mode: 'demo_timer',
        percent: 99,
        remaining_seconds: 17870,
        remaining_text: '4 h 57 min',
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
            timestamp: Date.now() / 1000,
            title: 'Persona detectada',
            detail: 'al frente',
            confidence: 0.92
        }
    ],

    alerts: []
};


/* ============================================================
   FETCH
   ============================================================ */

async function fetchJson(url) {

    const cacheBuster =
        `?t=${Date.now()}`;


    const finalUrl =
        `${url}${cacheBuster}`;


    console.log(
        '[GUARDIAN] GET:',
        finalUrl
    );


    const response =
        await fetch(
            finalUrl,
            {
                method: 'GET',

                cache: 'no-store',

                headers: {
                    'Accept':
                        'application/json'
                }
            }
        );


    if (!response.ok) {

        throw new Error(
            `Guardian state HTTP ${response.status}`
        );
    }


    return await response.json();
}


/* ============================================================
   NORMALIZACIÓN
   ============================================================ */

function normalize(raw) {

    const state =
        raw && typeof raw === 'object'
            ? raw
            : {};


    state.device ??= {};
    state.communication ??= {};
    state.camera ??= {};
    state.ai ??= {};
    state.sensors ??= {};
    state.haptic ??= {};
    state.battery ??= {};
    state.gps ??= {};


    state.ai.detections =
        Array.isArray(
            state.ai.detections
        )
            ? state.ai.detections
            : [];


    state.activity =
        Array.isArray(
            state.activity
        )
            ? state.activity
            : [];


    state.alerts =
        Array.isArray(
            state.alerts
        )
            ? state.alerts
            : [];


    state.device.id ??=
        'IRIS-HORIZON-001';


    state.device.name ??=
        'IRIS Horizon 001';


    state.device.status ??=
        'unknown';


    state.camera.status ??=
        'unknown';


    state.ai.status ??=
        'unknown';


    state.sensors.status ??=
        'unknown';


    state.haptic.status ??=
        'idle';


    return state;
}


/* ============================================================
   API PÚBLICA
   ============================================================ */

export const GuardianDataSource = {

    get mode() {

        return CONFIG.mode;
    },


    configure({
        mode = CONFIG.mode,
        endpoint = CONFIG.endpoint,
        pollMs = CONFIG.pollMs
    } = {}) {

        CONFIG.mode =
            mode;

        CONFIG.endpoint =
            endpoint;

        CONFIG.pollMs =
            Number(pollMs) || 5000;
    },


    async getState() {

        console.log(
            '[GUARDIAN] Solicitando estado...'
        );


        if (
            CONFIG.mode === 'mock'
        ) {

            return normalize(
                structuredClone(
                    DEMO_STATE
                )
            );
        }


        const state =
            await fetchJson(
                CONFIG.endpoint
            );


        console.log(
            '[GUARDIAN] JSON recibido:',
            state
        );


        return normalize(
            state
            
        );
    },


    getPollMs() {

        return CONFIG.pollMs;
    }
};
