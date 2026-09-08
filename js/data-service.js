/**
 * js/data-service.js
 * ==================
 *
 * Fuente de datos de IRIS Guardian.
 *
 * Actualmente:
 *
 *     GitHub Pages
 *          ↓
 *     iris-state.json
 *
 * Futuramente:
 *
 *     Backend / Supabase / API
 */

const GUARDIAN_STATE_URL =
    './public/data/iris-state.json';


export async function fetchGuardianState() {

    const cacheBuster =
        `?t=${Date.now()}`;

    const response =
        await fetch(
            `${GUARDIAN_STATE_URL}${cacheBuster}`,
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