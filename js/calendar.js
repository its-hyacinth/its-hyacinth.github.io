document.addEventListener('DOMContentLoaded', function() {
    // Sample event data for demonstration
    // In a real app, this would come from your backend or uploaded PDF parsing
    const events = [
        {
            title: 'Officer Smith - On Duty',
            start: '2025-06-23T08:00:00',
            end: '2025-06-23T16:00:00',
            backgroundColor: '#28a745', // Green
            borderColor: '#28a745',
            extendedProps: { status: 'on-duty' }
        },
        {
            title: 'Officer Lee - Absent',
            start: '2025-06-23T08:00:00',
            end: '2025-06-23T16:00:00',
            backgroundColor: '#dc3545', // Red
            borderColor: '#dc3545',
            extendedProps: { status: 'absent' }
        },
        {
            title: 'Officer Patel - On Leave',
            start: '2025-06-24T08:00:00',
            end: '2025-06-24T16:00:00',
            backgroundColor: '#007bff', // Blue
            borderColor: '#007bff',
            extendedProps: { status: 'on-leave' }
        },
        // Add more events as needed
    ];

    // Initialize FullCalendar
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek', // Set to weekly view
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: events,
        eventClick: function(info) {
            // Show event details (can be customized)
            alert(`${info.event.title}\nStatus: ${info.event.extendedProps.status}`);
        }
    });
    calendar.render();

    // Handle PDF Upload
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');
    const pdfList = document.getElementById('pdfList');

    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const fileInput = document.getElementById('pdfFile');
        formData.append('pdfFile', fileInput.files[0]);

        try {
            uploadStatus.textContent = 'Uploading...';
            
            const response = await fetch('/upload-pdf', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            
            // Add the PDF to the list
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <i class="fas fa-file-pdf"></i>
                ${data.filename} - Uploaded on ${new Date().toLocaleDateString()}
                <button onclick="deletePdf('${data.filename}')" class="btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            pdfList.appendChild(listItem);

            // Add events to calendar if dates were extracted
            if (data.events && data.events.length > 0) {
                data.events.forEach(event => {
                    calendar.addEvent({
                        title: event.title,
                        start: event.start,
                        end: event.end,
                        extendedProps: {
                            filename: data.filename
                        }
                    });
                });
                calendar.render();
            }

            uploadStatus.textContent = 'Upload successful!';
            uploadForm.reset();

        } catch (error) {
            console.error('Error:', error);
            uploadStatus.textContent = 'Upload failed. Please try again.';
        }
    });
});

// Function to delete PDF
async function deletePdf(filename) {
    try {
        const response = await fetch(`/delete-pdf/${filename}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Delete failed');
        }

        // Remove from list and calendar
        const listItems = document.querySelectorAll('#pdfList li');
        listItems.forEach(item => {
            if (item.textContent.includes(filename)) {
                item.remove();
            }
        });

        // Remove related events from calendar
        const calendar = document.querySelector('#calendar').FullCalendar;
        const events = calendar.getEvents();
        events.forEach(event => {
            if (event.extendedProps.filename === filename) {
                event.remove();
            }
        });

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete the PDF. Please try again.');
    }
} 