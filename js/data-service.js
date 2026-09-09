/**
 * js/data-service.js
 * ==================
 *
 * Fuente de datos DEMO de IRIS Guardian.
 *
 * IMPORTANTE:
 * - No usa backend.
 * - No usa fetch().
 * - No usa SSE.
 * - No abre sockets.
 * - Five Server puede servir la web directamente.
 *
 * La estructura del estado conserva la idea de la arquitectura
 * real de IRIS Guardian para poder sustituir esta fuente por
 * un backend posteriormente sin rehacer la interfaz.
 */

const DEVICE_ID = 'IRIS-HORIZON-001';
const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 720;
const UPDATE_INTERVAL_MS = 2200;
const MAX_ACTIVITY = 12;

const DETECTION_CATALOG = [
    { label: 'persona', display_label: 'Persona', zone: 'frontal' },
    { label: 'vehículo', display_label: 'Vehículo', zone: 'izquierda' },
    { label: 'bicicleta', display_label: 'Bicicleta', zone: 'derecha' },
    { label: 'silla', display_label: 'Silla', zone: 'frontal' },
    { label: 'mesa', display_label: 'Mesa', zone: 'derecha' },
    { label: 'escalera', display_label: 'Escalera', zone: 'izquierda' },
    { label: 'obstáculo', display_label: 'Obstáculo', zone: 'frontal' },
];

const VOICE_MESSAGES = [
    'Persona detectada al frente',
    'Obstáculo detectado a la izquierda',
    'Vehículo detectado a la derecha',
    'Precaución: objeto cercano',
    'Bicicleta detectada a la derecha',
    'Camino despejado',
];

const state = {
    schema_version: 1,
    generated_at: Date.now(),

    device: {
        id: DEVICE_ID,
        name: 'IRIS Horizon 001',
        status: 'online',
        ip: '192.168.0.213',
        last_update: Date.now(),
    },

    communication: {
        status: 'stable',
    },

    camera: {
        status: 'active',
        fps: 29.7,
    },

    ai: {
        status: 'active',
        timestamp: Date.now(),
        frame: {
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
        },
        detection_count: 0,
        primary: null,
        detections: [],
        voice_text: 'Sistema de asistencia activo',
    },

    sensors: {
        status: 'active',
        left: {
            distance_mm: 720,
            distance_m: 0.72,
            status: 'clear',
            confirmed: true,
        },
        right: {
            distance_mm: 610,
            distance_m: 0.61,
            status: 'clear',
            confirmed: true,
        },
    },

    haptic: {
        status: 'idle',
        left: 0,
        center: 0,
        right: 0,
    },

    battery: {
        available: true,
        mode: 'demo',
        percent: 93,
        status: 'high',
    },

    gps: {
        available: true,
        latitude: -12.05659,
        longitude: -77.11814,
        accuracy: null,
        source: 'demo',
        updated_at: Date.now(),
    },

    audio: {
        status: 'ready',
        text: 'Sistema de asistencia activo',
        timestamp: Date.now(),
    },

    activity: [],
    alertas: [],
};

let timer = null;
let listenerSet = new Set();
let audioSequence = 0;

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function pick(array) {
    return array[randomInt(0, array.length - 1)];
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function classifyDistance(mm) {
    if (mm < 260) return 'danger';
    if (mm < 500) return 'warning';
    return 'clear';
}

function distanceForZone(zone) {
    if (zone === 'left') {
        return randomInt(180, 1050);
    }

    if (zone === 'right') {
        return randomInt(180, 1050);
    }

    return randomInt(220, 1100);
}

function createDetection() {
    const template = pick(DETECTION_CATALOG);
    const width = randomInt(70, 360);
    const height = randomInt(80, 400);
    const x1 = randomInt(20, FRAME_WIDTH - width - 20);
    const y1 = randomInt(30, FRAME_HEIGHT - height - 30);

    return {
        label: template.label,
        display_label: template.display_label,
        confidence: Number(random(0.79, 0.99).toFixed(3)),
        zone: template.zone,
        cx: Math.round(x1 + width / 2),
        cy: Math.round(y1 + height / 2),
        x1,
        y1,
        x2: x1 + width,
        y2: y1 + height,
        timestamp: Date.now(),
    };
}

function createActivity(detection, voiceText) {
    const timestamp = Date.now();
    const detail = `${detection.zone} · ${Math.round(detection.confidence * 100)}%`;

    return {
        id: `${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp,
        title: `${detection.display_label} detectado`,
        detail,
        confidence: detection.confidence,
        voice_text: voiceText,
    };
}

function addActivity(item) {
    state.activity.unshift(item);
    state.activity = state.activity.slice(0, MAX_ACTIVITY);
}

function generateSensors() {
    const leftMm = randomInt(160, 1100);
    const rightMm = randomInt(160, 1100);

    state.sensors.left = {
        distance_mm: leftMm,
        distance_m: Number((leftMm / 1000).toFixed(2)),
        status: classifyDistance(leftMm),
        confirmed: Math.random() > 0.04,
    };

    state.sensors.right = {
        distance_mm: rightMm,
        distance_m: Number((rightMm / 1000).toFixed(2)),
        status: classifyDistance(rightMm),
        confirmed: Math.random() > 0.04,
    };
}

function generateHaptics() {
    const leftDistance = state.sensors.left.distance_mm;
    const rightDistance = state.sensors.right.distance_mm;

    const left = leftDistance < 300
        ? randomInt(75, 100)
        : leftDistance < 500
            ? randomInt(30, 70)
            : randomInt(0, 8);

    const right = rightDistance < 300
        ? randomInt(75, 100)
        : rightDistance < 500
            ? randomInt(30, 70)
            : randomInt(0, 8);

    state.haptic.left = left;
    state.haptic.right = right;
    state.haptic.center = 0;
    state.haptic.status = (left > 10 || right > 10)
        ? 'active'
        : 'idle';
}

function generateDetections() {
    const count = Math.random() < 0.18
        ? 0
        : randomInt(1, 4);

    const detections = Array.from(
        { length: count },
        createDetection,
    );

    state.ai.detections = detections;
    state.ai.detection_count = detections.length;
    state.ai.primary = detections[0] || null;
    state.ai.timestamp = Date.now();

    if (detections.length > 0) {
        const voiceText = Math.random() < 0.65
            ? `${detections[0].display_label} detectado ${detections[0].zone}`
            : pick(VOICE_MESSAGES);

        state.ai.voice_text = voiceText;
        state.audio.text = voiceText;
        state.audio.timestamp = Date.now();
        audioSequence += 1;

        addActivity(createActivity(detections[0], voiceText));
    } else {
        state.ai.voice_text = 'Camino despejado';
        state.audio.text = 'Camino despejado';
        state.audio.timestamp = Date.now();
    }
}

function updateBattery() {
    state.battery.percent = clamp(
        state.battery.percent - random(0, 0.18),
        0,
        100,
    );

    if (state.battery.percent >= 60) {
        state.battery.status = 'high';
    } else if (state.battery.percent >= 25) {
        state.battery.status = 'medium';
    } else {
        state.battery.status = 'low';
    }
}

function simulate() {
    const now = Date.now();

    state.generated_at = now;
    state.device.last_update = now;
    state.device.status = Math.random() < 0.02 ? 'syncing' : 'online';

    state.camera.status = 'active';
    state.camera.fps = Number(random(27.5, 31.5).toFixed(1));

    generateSensors();
    generateHaptics();
    generateDetections();
    updateBattery();

    state.communication.status = 'stable';
    state.ai.status = 'active';
    state.audio.status = 'ready';

    publish();
}

function cloneState() {
    return JSON.parse(JSON.stringify(state));
}

function publish() {
    const snapshot = cloneState();

    listenerSet.forEach(listener => {
        try {
            listener(snapshot);
        } catch (error) {
            console.error('[GUARDIAN DEMO] listener error:', error);
        }
    });
}

export const GuardianDataSource = {
    async getState() {
        return cloneState();
    },

    connect(callback) {
        listenerSet.add(callback);
        callback(cloneState());

        if (timer === null) {
            timer = window.setInterval(simulate, UPDATE_INTERVAL_MS);
        }

        return {
            close() {
                listenerSet.delete(callback);

                if (listenerSet.size === 0 && timer !== null) {
                    window.clearInterval(timer);
                    timer = null;
                }
            },
        };
    },

    getAudioSequence() {
        return audioSequence;
    },
};
