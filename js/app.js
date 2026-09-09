/**
 * js/app.js
 * =========
 *
 * Interfaz de IRIS Guardian.
 *
 * Esta versión es EXCLUSIVAMENTE frontend/demo:
 *
 *     data-service.js (mock)
 *              ↓
 *           app.js
 *              ↓
 *          navegador
 *
 * No necesita guardian_server.py ni ningún endpoint /api/*.
 */

import { GuardianDataSource } from './data-service.js';

const $ = id => document.getElementById(id);

let audioEnabled = false;
let lastSpokenTimestamp = 0;
let currentState = null;
let demoGps = {
    latitude: -12.056590,
    longitude: -77.118140,
    accuracy: null,
    source: 'demo',
};

function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function toDate(timestamp) {
    if (timestamp === null || timestamp === undefined || timestamp === '') {
        return null;
    }

    if (timestamp instanceof Date) {
        return Number.isNaN(timestamp.getTime()) ? null : timestamp;
    }

    const numeric = Number(timestamp);

    if (Number.isFinite(numeric)) {
        return numeric < 100000000000
            ? new Date(numeric * 1000)
            : new Date(numeric);
    }

    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(timestamp) {
    const date = toDate(timestamp);

    if (!date) {
        return '--:--:--';
    }

    return new Intl.DateTimeFormat('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(date);
}

function relativeTime(timestamp) {
    const date = toDate(timestamp);

    if (!date) {
        return '—';
    }

    const seconds = Math.max(
        0,
        (Date.now() - date.getTime()) / 1000,
    );

    if (seconds < 5) return 'ahora';
    if (seconds < 60) return `hace ${Math.floor(seconds)} s`;

    const minutes = seconds / 60;

    if (minutes < 60) {
        return `hace ${Math.floor(minutes)} min`;
    }

    const hours = minutes / 60;

    if (hours < 24) {
        return `hace ${Math.floor(hours)} h`;
    }

    return `hace ${Math.floor(hours / 24)} d`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function setMetricClass(element, ok) {
    if (!element) {
        return;
    }

    element.classList.remove('metric-ok', 'metric-error');
    element.classList.add(ok ? 'metric-ok' : 'metric-error');
}

function renderConnection(state) {
    const statusElement = $('sys-status');
    const syncElement = $('last-sync');
    const dot = document.querySelector('.status-indicator .dot');

    const status = state.device?.status || 'offline';

    if (statusElement) {
        statusElement.textContent = status === 'online'
            ? 'IRIS conectado · DEMO'
            : status === 'syncing'
                ? 'IRIS sincronizando · DEMO'
                : 'IRIS desconectado';
    }

    if (syncElement) {
        syncElement.textContent = state.device?.last_update
            ? formatTime(state.device.last_update)
            : '--:--:--';
    }

    if (dot) {
        dot.style.backgroundColor = status === 'online'
            ? '#10b981'
            : status === 'syncing'
                ? '#f59e0b'
                : '#ef4444';

        dot.style.boxShadow = status === 'online'
            ? '0 0 0 4px rgba(16,185,129,.15)'
            : status === 'syncing'
                ? '0 0 0 4px rgba(245,158,11,.15)'
                : '0 0 0 4px rgba(239,68,68,.15)';
    }
}

function renderMetrics(state) {
    const battery = state.battery || {};
    const camera = state.camera || {};
    const ai = state.ai || {};

    const bat = $('bat-val');
    const sys = $('sys-val');
    const cam = $('cam-val');
    const ia = $('ia-val');

    const percent = safeNumber(battery.percent);

    if (bat) {
        bat.textContent = percent === null
            ? '—'
            : `${Math.round(percent)}%`;

        setMetricClass(bat, percent !== null && percent > 10);
    }

    const online = state.device?.status !== 'offline';

    if (sys) {
        sys.textContent = online ? 'ONLINE' : 'OFFLINE';
        setMetricClass(sys, online);
    }

    const fps = safeNumber(camera.fps);

    if (cam) {
        cam.textContent = camera.status === 'active'
            ? fps !== null
                ? `${fps.toFixed(1)} FPS`
                : 'ACTIVA'
            : 'INACTIVA';

        setMetricClass(cam, camera.status === 'active');
    }

    const count = Number(ai.detection_count || 0);

    if (ia) {
        ia.textContent = ai.status === 'active'
            ? count === 0
                ? 'ACTIVA'
                : `${count} detect.`
            : 'INACTIVA';

        setMetricClass(ia, ai.status === 'active');
    }
}

function renderDetections(state) {
    const container = $('detections-list');
    const badge = $('detection-count');

    if (!container) {
        return;
    }

    const detections = Array.isArray(state.ai?.detections)
        ? state.ai.detections
        : [];

    if (badge) {
        badge.textContent = detections.length === 1
            ? '1 objeto'
            : `${detections.length} objetos`;
    }

    if (detections.length === 0) {
        container.innerHTML = `
            <li class="list-item">
                <div class="empty-guardian-data">
                    <i class="fa-solid fa-eye-slash"></i>
                    <strong>Sin objetos detectados</strong>
                    <span>La IA continúa analizando el entorno.</span>
                </div>
            </li>
        `;

        return;
    }

    container.innerHTML = detections
        .slice(0, 10)
        .map(detection => {
            const confidence = safeNumber(detection.confidence);

            return `
                <li class="list-item guardian-detection">
                    <div class="guardian-detection-icon">
                        <i class="fa-solid fa-eye"></i>
                    </div>

                    <div class="guardian-detection-content">
                        <strong>${escapeHtml(
                            detection.display_label || detection.label || 'Objeto'
                        )}</strong>

                        <span>
                            Zona: ${escapeHtml(detection.zone || 'frontal')}
                        </span>

                        <small>
                            Centro: (${escapeHtml(detection.cx)}, ${escapeHtml(detection.cy)})
                            · Caja: [${escapeHtml(detection.x1)}, ${escapeHtml(detection.y1)}, ${escapeHtml(detection.x2)}, ${escapeHtml(detection.y2)}]
                        </small>
                    </div>

                    <div class="guardian-detection-confidence">
                        ${confidence === null
                            ? '—'
                            : `${Math.round(clamp(confidence, 0, 1) * 100)}%`}
                    </div>
                </li>
            `;
        })
        .join('');
}

function distanceLabel(status) {
    const labels = {
        danger: 'PELIGRO',
        warning: 'PRECAUCIÓN',
        clear: 'DESPEJADO',
        unknown: 'SIN DATOS',
    };

    return labels[status] || String(status || 'SIN DATOS').toUpperCase();
}

function renderSensors(state) {
    const left = state.sensors?.left || {};
    const right = state.sensors?.right || {};
    const haptic = state.haptic || {};

    const leftDistance = safeNumber(left.distance_mm);
    const rightDistance = safeNumber(right.distance_mm);

    if ($('left-distance')) {
        $('left-distance').textContent = leftDistance === null
            ? '—'
            : `${(leftDistance / 1000).toFixed(2)} m`;
    }

    if ($('right-distance')) {
        $('right-distance').textContent = rightDistance === null
            ? '—'
            : `${(rightDistance / 1000).toFixed(2)} m`;
    }

    if ($('left-status')) {
        $('left-status').textContent =
            `${distanceLabel(left.status)} · ${left.confirmed ? 'CONFIRMADO' : 'LECTURA'}`;
    }

    if ($('right-status')) {
        $('right-status').textContent =
            `${distanceLabel(right.status)} · ${right.confirmed ? 'CONFIRMADO' : 'LECTURA'}`;
    }

    if ($('haptic-left')) {
        $('haptic-left').textContent = `${Math.round(safeNumber(haptic.left) ?? 0)}%`;
    }

    if ($('haptic-right')) {
        $('haptic-right').textContent = `${Math.round(safeNumber(haptic.right) ?? 0)}%`;
    }

    if ($('haptic-left-status')) {
        $('haptic-left-status').textContent = haptic.left > 10
            ? 'Vibrando'
            : 'En espera';
    }

    if ($('haptic-right-status')) {
        $('haptic-right-status').textContent = haptic.right > 10
            ? 'Vibrando'
            : 'En espera';
    }

    if ($('sensor-state-badge')) {
        $('sensor-state-badge').textContent =
            String(state.sensors?.status || 'active').toUpperCase();
    }
}

function renderAudio(state) {
    const textElement = $('audio-text');
    const statusElement = $('audio-status');

    const text = state.audio?.text || state.ai?.voice_text || 'Esperando evento...';

    if (textElement) {
        textElement.textContent = text;
    }

    if (statusElement) {
        statusElement.textContent = audioEnabled ? 'AUDIO ACTIVO' : 'DEMO';
    }

    if (audioEnabled) {
        const timestamp = Number(state.audio?.timestamp || 0);

        if (
            timestamp > 0 &&
            timestamp !== lastSpokenTimestamp
        ) {
            lastSpokenTimestamp = timestamp;
            speak(text);
        }
    }
}

function speak(text) {
    if (!audioEnabled || !('speechSynthesis' in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PE';
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
}

function buildGoogleMapsUrl(latitude, longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

function buildGoogleMapsEmbedUrl(latitude, longitude) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}&output=embed`;
}

function renderGPS(state) {
    const gps = state.gps || {};

    const latitude = safeNumber(gps.latitude);
    const longitude = safeNumber(gps.longitude);

    if (latitude === null || longitude === null) {
        return;
    }

    const accuracy = safeNumber(gps.accuracy);
    const source = gps.source === 'pc'
        ? 'Ubicación del PC'
        : 'Ubicación de demostración';

    const status = $('gps-status');
    const coords = $('gps-coords');
    const iframe = $('google-map');
    const empty = $('map-empty');
    const link = $('google-map-link');

    if (status) {
        status.textContent = source;
    }

    if (coords) {
        coords.innerHTML = `
            <span>Latitud: ${latitude.toFixed(6)}</span>
            <span>Longitud: ${longitude.toFixed(6)}</span>
            <span>${accuracy === null ? 'Precisión: demo' : `Precisión: ±${Math.round(accuracy)} m`}</span>
        `;
    }

    if (iframe) {
        iframe.src = buildGoogleMapsEmbedUrl(latitude, longitude);
        iframe.style.display = 'block';
    }

    if (empty) {
        empty.style.display = 'none';
    }

    if (link) {
        link.href = buildGoogleMapsUrl(latitude, longitude);
        link.classList.remove('disabled');
    }
}

function capturePcLocation() {
    if (!navigator.geolocation) {
        const status = $('gps-status');

        if (status) {
            status.textContent = 'Geolocalización no disponible en este navegador';
        }

        return;
    }

    const button = $('gps-button');
    const status = $('gps-status');

    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Obteniendo ubicación...';
    }

    if (status) {
        status.textContent = 'Solicitando ubicación del PC...';
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude, accuracy } = position.coords;

            demoGps = {
                latitude,
                longitude,
                accuracy,
                source: 'pc',
            };

            if (currentState) {
                currentState.gps = {
                    available: true,
                    latitude,
                    longitude,
                    accuracy,
                    source: 'pc',
                    updated_at: Date.now(),
                };

                renderGPS(currentState);
            }

            if (status) {
                status.textContent = 'Ubicación del PC capturada';
            }

            restoreGpsButton();
        },
        error => {
            console.warn('[GUARDIAN] Geolocation:', error);

            if (currentState) {
                currentState.gps = {
                    available: true,
                    latitude: demoGps.latitude,
                    longitude: demoGps.longitude,
                    accuracy: null,
                    source: 'demo',
                    updated_at: Date.now(),
                };

                renderGPS(currentState);
            }

            if (status) {
                status.textContent =
                    'No se pudo capturar el PC · se mantiene la ubicación DEMO';
            }

            restoreGpsButton();
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        },
    );
}

function restoreGpsButton() {
    const button = $('gps-button');

    if (!button) {
        return;
    }

    button.disabled = false;
    button.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Actualizar ubicación del PC';
}

function renderTimeline(state) {
    const container = $('timeline-list');

    if (!container) {
        return;
    }

    const activity = Array.isArray(state.activity)
        ? state.activity
        : [];

    if (activity.length === 0) {
        container.innerHTML = `
            <div class="empty-guardian-data">
                <i class="fa-solid fa-clock"></i>
                <strong>Sin actividad reciente</strong>
                <span>Los eventos aparecerán automáticamente.</span>
            </div>
        `;

        return;
    }

    container.innerHTML = activity
        .slice(0, 12)
        .map(item => `
            <div class="timeline-item">
                <div class="guardian-timeline-content">
                    <strong>
                        ${escapeHtml(item.title || 'Evento IRIS')}
                    </strong>

                    <span>
                        ${formatTime(item.timestamp)}
                        · ${relativeTime(item.timestamp)}
                        ${item.detail ? ` · ${escapeHtml(item.detail)}` : ''}
                    </span>
                </div>
            </div>
        `)
        .join('');
}

function render(state) {
    currentState = state;

    renderConnection(state);
    renderMetrics(state);
    renderDetections(state);
    renderSensors(state);
    renderAudio(state);
    renderGPS(state);
    renderTimeline(state);
}

function renderError(error) {
    console.error('[GUARDIAN DEMO] Error:', error);

    const status = $('sys-status');
    const dot = document.querySelector('.status-indicator .dot');

    if (status) {
        status.textContent = 'Error en la simulación';
    }

    if (dot) {
        dot.style.backgroundColor = '#ef4444';
        dot.style.boxShadow = '0 0 0 4px rgba(239,68,68,.15)';
    }
}

function initTheme() {
    const button = $('theme-toggle');

    if (!button) {
        return;
    }

    const saved = localStorage.getItem('iris-guardian-theme');

    if (saved === 'dark') {
        document.body.classList.add('dark-mode');
    }

    updateThemeIcon(button);

    button.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');

        localStorage.setItem(
            'iris-guardian-theme',
            document.body.classList.contains('dark-mode')
                ? 'dark'
                : 'light',
        );

        updateThemeIcon(button);
    });
}

function updateThemeIcon(button) {
    button.innerHTML = document.body.classList.contains('dark-mode')
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
}

function initAudio() {
    const button = $('audio-enable');

    if (!button) {
        return;
    }

    button.addEventListener('click', () => {
        audioEnabled = !audioEnabled;

        if (audioEnabled) {
            button.innerHTML = '<i class="fa-solid fa-volume-high"></i> Audio activo';

            const text = currentState?.audio?.text || 'IRIS Guardian activado';
            speak(text);
        } else {
            window.speechSynthesis?.cancel();
            button.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Activar audio';
        }

        if (currentState) {
            renderAudio(currentState);
        }
    });
}

function initGps() {
    const button = $('gps-button');

    if (!button) {
        return;
    }

    button.addEventListener('click', capturePcLocation);
}

async function initGuardian() {
    console.log('==========================================');
    console.log('🛡️ IRIS GUARDIAN · DEMO FRONTEND');
    console.log('Sin backend · Sin SSE · Sin API local');
    console.log('==========================================');

    initTheme();
    initAudio();
    initGps();

    try {
        const initialState = await GuardianDataSource.getState();

        render(initialState);

        const source = GuardianDataSource.connect(render);

        window.addEventListener('beforeunload', () => {
            source?.close();
            window.speechSynthesis?.cancel();
        }, { once: true });
    } catch (error) {
        renderError(error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initGuardian,
        { once: true },
    );
} else {
    initGuardian();
}
