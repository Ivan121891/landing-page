document.addEventListener('DOMContentLoaded', () => {
    // --- API Configuration ---
    const API_CONFIG = {
        locationId: '9fZSzFzTFV8sZzfj4SlV',
        calendarId: 'Kn9z7FemFg0kjbPA8AZm',
        apiKey: 'pit-21385434-3113-44c7-9c81-5574645bbe47',
        userId: '2tQreqXcDpaAiSBqlK7T',
        pixelId: '1178133073434960'
    };

    // --- State Structure ---
    const state = {
        selectedDate: null, // Date object
        selectedTime: null, // String (e.g. "10:00 AM")
        currentMonthRef: new Date() // For calendar navigation
    };

    // --- DOM Elements ---
    const views = {
        date: document.getElementById('view-date'),
        time: document.getElementById('view-time'),
        form: document.getElementById('view-form'),
        success: document.getElementById('view-success')
    };

    const calendarGrid = document.getElementById('calendar-grid');
    const morningSlotsContainer = document.getElementById('morning-slots');
    const afternoonSlotsContainer = document.getElementById('afternoon-slots');
    const currentMonthYearLabel = document.getElementById('current-month-year');

    const selectedDateDisplay = document.getElementById('selected-date-display');
    const finalDatetimeDisplay = document.getElementById('final-datetime-display');
    const successDatetimeDisplay = document.getElementById('success-datetime');

    const bookingForm = document.getElementById('booking-form');

    // Navigation buttons
    document.getElementById('back-to-date').addEventListener('click', () => switchView('date'));
    document.getElementById('back-to-time').addEventListener('click', () => switchView('time'));
    document.getElementById('start-over').addEventListener('click', () => {
        state.selectedDate = null;
        state.selectedTime = null;
        bookingForm.reset();
        generateCalendar();
        switchView('date');
    });

    // Calendar Navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        state.currentMonthRef.setMonth(state.currentMonthRef.getMonth() - 1);
        generateCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        state.currentMonthRef.setMonth(state.currentMonthRef.getMonth() + 1);
        generateCalendar();
    });

    // --- Utility Functions ---
    const formatDateShort = (date) => {
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const switchView = (targetViewId) => {
        Object.values(views).forEach(view => {
            if (view) view.classList.remove('active');
        });
        if (views[targetViewId]) {
            views[targetViewId].classList.add('active');
        }
    };

    // --- 1. Calendar Generation ---
    const generateCalendar = () => {
        calendarGrid.innerHTML = '';

        // Setup header
        const monthOptions = { month: 'long', year: 'numeric' };
        currentMonthYearLabel.textContent = state.currentMonthRef.toLocaleDateString('en-US', monthOptions);

        // We'll generate 6 dates starting from today or the 1st of the reference month
        let startDate = new Date();
        // If reference month is different from current month, start from the 1st of that month
        if (startDate.getMonth() !== state.currentMonthRef.getMonth() || startDate.getFullYear() !== state.currentMonthRef.getFullYear()) {
            startDate = new Date(state.currentMonthRef.getFullYear(), state.currentMonthRef.getMonth(), 1);
        }

        const daysToGenerate = 6; // 3 columns x 2 rows = 6 days

        for (let i = 0; i < daysToGenerate; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const btn = document.createElement('button');
            btn.className = 'date-btn';

            // Check if selected
            if (state.selectedDate && date.toDateString() === state.selectedDate.toDateString()) {
                btn.classList.add('active');
            }

            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.getDate();

            btn.innerHTML = `
                <span class="date-day-label">${dayName}</span>
                <span class="date-number">${dayNum}</span>
            `;

            btn.addEventListener('click', () => {
                // Update State
                state.selectedDate = date;

                // Update UI visually before transitioning
                document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Set data for next view
                selectedDateDisplay.textContent = formatDateShort(state.selectedDate);

                // Transition after tiny delay for visual feedback
                setTimeout(() => {
                    generateTimeSlots();
                    switchView('time');
                }, 200);
            });

            calendarGrid.appendChild(btn);
        }
    };

    // --- 2. Time Slot Generation ---
    const generateTimeSlots = () => {
        morningSlotsContainer.innerHTML = '';
        afternoonSlotsContainer.innerHTML = '';

        const morningTimes = ['9:00 AM', '10:00 AM', '11:00 AM'];
        const afternoonTimes = ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

        const createSlot = (time, container) => {
            const btn = document.createElement('button');
            btn.className = 'time-btn';
            btn.textContent = time;

            if (state.selectedTime === time) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                state.selectedTime = time;

                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                finalDatetimeDisplay.textContent = `${formatDateShort(state.selectedDate)} at ${state.selectedTime}`;

                setTimeout(() => {
                    switchView('form');
                }, 200);
            });

            container.appendChild(btn);
        };

        morningTimes.forEach(t => createSlot(t, morningSlotsContainer));
        afternoonTimes.forEach(t => createSlot(t, afternoonSlotsContainer));
    };

    // --- 3. Form Handling with GHL API Integration ---
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Scheduling...';
        submitBtn.disabled = true;

        try {
            // 1. Gather form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;

            const headers = {
                'Authorization': `Bearer ${API_CONFIG.apiKey}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            // 2. Create or Update Contact in GHL
            const contactPayload = {
                name: name,
                email: email,
                phone: phone,
                locationId: API_CONFIG.locationId
            };

            const contactResponse = await fetch('https://cors-anywhere.herokuapp.com/https://services.leadconnectorhq.com/contacts/upsert', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(contactPayload)
            });

            if (!contactResponse.ok) {
                const errorData = await contactResponse.json().catch(() => ({}));
                console.error('Contact Creation Error:', errorData);
                throw new Error(errorData.message || 'Failed to create contact in GoHighLevel.');
            }

            const contactData = await contactResponse.json();
            const contactId = contactData.contact.id;

            // 3. Prepare Appointment Start Time (ISO 8601)
            const [timeStr, ampm] = state.selectedTime.split(' ');
            let [hours, minutes] = timeStr.split(':');
            hours = parseInt(hours);
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;

            const appointmentDate = new Date(state.selectedDate);
            appointmentDate.setHours(hours, parseInt(minutes), 0, 0);

            // Note: GHL V2 API expects the timezone offset to precisely match the slots returned by the calendar.
            // toISOString() converts to UTC (Z). We will construct it manually with the local offset (-07:00).
            const pad = (num) => String(num).padStart(2, '0');
            const offset = -appointmentDate.getTimezoneOffset();
            const sign = offset >= 0 ? '+' : '-';
            const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
            const offsetMinutes = pad(Math.abs(offset) % 60);

            const isoStartTime =
                appointmentDate.getFullYear() + '-' +
                pad(appointmentDate.getMonth() + 1) + '-' +
                pad(appointmentDate.getDate()) + 'T' +
                pad(appointmentDate.getHours()) + ':' +
                pad(appointmentDate.getMinutes()) + ':' +
                pad(appointmentDate.getSeconds()) +
                sign + offsetHours + ':' + offsetMinutes;

            // 4. Create Appointment in GHL
            const appointmentPayload = {
                calendarId: API_CONFIG.calendarId,
                locationId: API_CONFIG.locationId,
                contactId: contactId,
                startTime: isoStartTime
            };

            const appointmentResponse = await fetch('https://cors-anywhere.herokuapp.com/https://services.leadconnectorhq.com/calendars/events/appointments', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(appointmentPayload)
            });

            if (!appointmentResponse.ok) {
                const errorData = await appointmentResponse.json().catch(() => ({}));
                console.error('Appointment Creation Error:', errorData);
                throw new Error(errorData.message || 'Failed to create appointment in GoHighLevel.');
            }

            // Success!
            successDatetimeDisplay.textContent = `${formatDateShort(state.selectedDate)} at ${state.selectedTime}`;
            switchView('success');

        } catch (error) {
            console.error(error);
            alert(`Unable to schedule: ${error.message}`);
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Initialize App
    generateCalendar();
});
