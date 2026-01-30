async function testWebhook() {
    const url = 'https://bus-manager-navy.vercel.app/api/payment/webhook';
    console.log('--- Testando Webhook at:', url);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-openpix-signature': 'dummy'
            },
            body: JSON.stringify({
                event: 'TEST_PING',
                charge: { correlationID: 'test-123', identifier: 'test-id' }
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Erro no fetch:', e);
    }
}

testWebhook();
