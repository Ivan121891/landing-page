export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { name, email, phone, locationId, calendarId, startTime } = request.body;

        // Ensure API Key is kept safe on the server
        const apiKey = 'pit-21385434-3113-44c7-9c81-5574645bbe47';

        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // 1. Create or Update Contact in GHL
        const contactPayload = { name, email, phone, locationId };

        const contactResponse = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(contactPayload)
        });

        if (!contactResponse.ok) {
            const errorData = await contactResponse.json().catch(() => ({}));
            return response.status(400).json({
                message: errorData.message || 'Failed to sync contact with GoHighLevel.'
            });
        }

        const contactData = await contactResponse.json();
        const contactId = contactData.contact.id;

        // 2. Create Appointment in GHL
        const appointmentPayload = {
            calendarId: calendarId,
            locationId: locationId,
            contactId: contactId,
            startTime: startTime
        };

        const appointmentResponse = await fetch('https://services.leadconnectorhq.com/calendars/events/appointments', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(appointmentPayload)
        });

        if (!appointmentResponse.ok) {
            const errorData = await appointmentResponse.json().catch(() => ({}));
            return response.status(400).json({
                message: errorData.message || 'Failed to create appointment in GoHighLevel.'
            });
        }

        // 3. Success
        return response.status(200).json({ success: true, message: 'Appointment booked successfully!' });

    } catch (error) {
        console.error('API Error:', error);
        return response.status(500).json({ message: 'Internal Server Error', details: error.message });
    }
}
