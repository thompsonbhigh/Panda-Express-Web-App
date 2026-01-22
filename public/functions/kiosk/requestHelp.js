/**
 * Makes a POST request to /notify-kitchen endpoint.
 * Server updates the alert table to set the 'Help' alert as active.
 * @async
 * @function requestHelp
 * @returns {Promise<void>} Resolves when the help request is processed.
 */

async function requestHelp() {
    const response = await fetch('/customer/notify-kitchen', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ type: 'Help' })
    });

    const data = await response.json();

    if (data.success) {
        alert('Help request sent successfully. An employee will assist you shortly.');
    } else {
        console.error('Failed to send help request: ' + data.error);
        alert('Failed to send help request. Please try again later.');
    }
}