// script.js - UPDATED FOR BACKEND CONNECTION

document.addEventListener('DOMContentLoaded', function() {
    const backendUrl = 'https://edusafe-final-project-backed-production.up.railway.app'; // The address of your Django server

    // --- Logic for the Report Form ---
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevent default browser submission

            const affirmationCheck = document.getElementById('affirmation-check');
            if (!affirmationCheck.checked) {
                alert('You must affirm that the information is true before submitting.');
                return;
            }

            // Create a FormData object to send form data, including files
            const formData = new FormData(reportForm);
            
            // For file uploads, we need to handle them specially
            const fileInput = document.getElementById('evidence-upload');
            // Remove the original file input from formData to avoid duplicates
            formData.delete('evidence');
            
            if (fileInput.files.length > 0) {
                // The backend serializer expects 'evidence_files' as an array
                for (let i = 0; i < fileInput.files.length; i++) {
                    formData.append('evidence_files', fileInput.files[i]);
                }
            }

            try {
                // Use fetch to send the data to your Django API endpoint
                const response = await fetch(`${backendUrl}/api/reports/`, {
                    method: 'POST',
                    body: formData, // FormData is sent as the body
                    // NOTE: Do NOT set Content-Type header, the browser does it for you with FormData
                });

                if (response.ok) {
                    const result = await response.json(); // Get the { "case_id": "..." } from the backend
                    alert(`Thank you for your submission.\n\nYour confidential Case ID is: ${result.case_id}\n\nPlease save this ID to track the status of your report.`);
                    reportForm.reset();
                } else {
                    // Handle server errors
                    const errorData = await response.json();
                    console.error('Server Error:', errorData);
                    alert('An error occurred while submitting your report. Please try again.');
                }
            } catch (error) {
                // Handle network errors (e.g., server is not running)
                console.error('Network Error:', error);
                alert('Could not connect to the server. Please check your connection or try again later.');
            }
        });
    }

    // --- Logic for the Tracking Page ---
    const trackForm = document.getElementById('trackForm');
    if (trackForm) {
        trackForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const caseIdInput = document.getElementById('case-id').value.trim();
            const statusResultDiv = document.getElementById('status-result');
            
            if (!caseIdInput) {
                alert('Please enter a Case ID.');
                return;
            }

            try {
                // Fetch the status from the tracking endpoint
                const response = await fetch(`${backendUrl}/api/reports/track/${caseIdInput}/`);
                
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('result-case-id').textContent = data.case_id;
                    document.getElementById('result-status').textContent = data.status;
                    document.getElementById('result-details').textContent = `Last updated on: ${new Date(data.updated_at).toLocaleString()}`;
                    statusResultDiv.classList.remove('hidden');
                } else if (response.status === 404) {
                    alert('The Case ID you entered could not be found. Please check the ID and try again.');
                    statusResultDiv.classList.add('hidden');
                } else {
                    alert('An error occurred while fetching the report status.');
                }
                
                // Update progress bar if it exists
                if (data.status) {
                    updateProgressBar(data.status);
                }
            } catch (error) {
                console.error('Network Error:', error);
                alert('Could not connect to the server to track your report.');
            }
        });
    }
    
    // Function to update progress bar
    function updateProgressBar(currentStatus) {
        // Define the order of statuses
        const statusOrder = {
            "Submitted": 1,
            "Under Review": 2,
            "Action in Progress": 3,
            "Resolved": 4,
            "Closed": 5
        };
    
        const currentLevel = statusOrder[currentStatus] || 0;
        const steps = document.querySelectorAll('.progress-tracker-step');
    
        if (steps.length > 0) {
            steps.forEach((step, index) => {
                if (index < currentLevel) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            });
        }
    }
});