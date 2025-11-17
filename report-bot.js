// report-bot.js

document.addEventListener('DOMContentLoaded', () => {
    const backendUrl = 'https://edusafe-final-project-backed-production.up.railway.app';

    // --- DOM Elements ---
    const chatMessages = document.getElementById('chat-messages');
    const chatInputArea = document.getElementById('chat-input-area');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    
    const categoryButtonsArea = document.getElementById('chat-category-buttons');
    const uploadArea = document.getElementById('chat-upload-area');
    const uploadDoneBtn = document.getElementById('upload-done-btn');
    const evidenceUploadInput = document.getElementById('evidence-upload');
    
    const affirmationArea = document.getElementById('chat-affirmation-area');
    const affirmationCheck = document.getElementById('affirmation-check');
    const affirmationSubmitBtn = document.getElementById('affirmation-submit-btn');

    // --- Conversation State ---
    let state = 'greeting';
    const reportData = {
        category: '',
        schoolName: '',
        details: '',
        reporterName: '',
        reporterEmail: '',
    };
    let conversationFlow;

    // --- Helper Functions ---
    const addBotMessage = (message) => {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble bot';
        bubble.innerHTML = message; // Use innerHTML to render line breaks
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
    };

    const addUserMessage = (message) => {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble user';
        bubble.textContent = message;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const showInputArea = () => {
        chatInputArea.classList.remove('hidden');
        categoryButtonsArea.classList.add('hidden');
        uploadArea.classList.add('hidden');
        affirmationArea.classList.add('hidden');
        chatInput.focus();
    };

    const showCategoryButtons = () => {
        chatInputArea.classList.add('hidden');
        categoryButtonsArea.classList.remove('hidden');
        uploadArea.classList.add('hidden');
        affirmationArea.classList.add('hidden');
        
        // Create buttons
        const categories = [
            'Bullying & Harassment',
            'Safety & Security Concern',
            'Academic Issue / Unfair Treatment',
            'Teacher / Staff Conduct',
            'Child Neglect or Abuse',
            'Other Concern'
        ];
        categoryButtonsArea.innerHTML = ''; // Clear old buttons
        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'chat-category-btn';
            btn.textContent = category;
            btn.onclick = () => {
                reportData.category = category;
                addUserMessage(category);
                nextStep(category);
            };
            categoryButtonsArea.appendChild(btn);
        });
    };

    const showUploadArea = () => {
        chatInputArea.classList.add('hidden');
        categoryButtonsArea.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        affirmationArea.classList.add('hidden');
    };
    
    const showAffirmationArea = () => {
        chatInputArea.classList.add('hidden');
        categoryButtonsArea.classList.add('hidden');
        uploadArea.classList.add('hidden');
        affirmationArea.classList.remove('hidden');
    };

    // --- Conversation Flow Logic ---
    const nextStep = (userInput) => {
        const currentStep = conversationFlow[state];
        
        if (currentStep.store) {
            reportData[currentStep.store] = userInput;
        }

        if (currentStep.next) {
            state = currentStep.next;
            const next = conversationFlow[state];
            
            setTimeout(() => { // Small delay for bot "thinking"
                addBotMessage(next.message);
                
                if (next.type === 'text') {
                    showInputArea();
                } else if (next.type === 'categories') {
                    showCategoryButtons();
                } else if (next.type === 'upload') {
                    showUploadArea();
                } else if (next.type === 'affirmation') {
                    showAffirmationArea();
                }
            }, 500);
        }
    };

    const handleSend = () => {
        const userInput = chatInput.value.trim();
        if (userInput === '') return;

        addUserMessage(userInput);
        chatInput.value = '';
        nextStep(userInput);
    };

    // --- Event Listeners ---
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    uploadDoneBtn.addEventListener('click', () => {
        addUserMessage("(Evidence upload finished)");
        nextStep(); // Move to the next step after uploading
    });

    affirmationCheck.addEventListener('change', () => {
        affirmationSubmitBtn.disabled = !affirmationCheck.checked;
    });

    affirmationSubmitBtn.addEventListener('click', () => {
        addBotMessage("Thank you. Submitting your report now, please wait...");
        affirmationArea.classList.add('hidden');
        submitReport();
    });

    // --- Final Report Submission ---
    const submitReport = async () => {
        const formData = new FormData();

        // Map category display name to backend value
        const categoryMap = {
            'Bullying & Harassment': 'Bullying',
            'Safety & Security Concern': 'Safety',
            'Academic Issue / Unfair Treatment': 'Academic',
            'Teacher / Staff Conduct': 'Conduct',
            'Child Neglect or Abuse': 'Neglect',
            'Other Concern': 'Other'
        };
        const backendCategory = categoryMap[reportData.category] || reportData.category;

        // Clean the optional fields
        let name = reportData.reporterName.toLowerCase() === 'anonymous' ? '' : reportData.reporterName;
        let email = reportData.reporterEmail.toLowerCase() === 'anonymous' ? '' : reportData.reporterEmail;

        formData.append('category', backendCategory);
        formData.append('school_name', reportData.schoolName);
        formData.append('details', reportData.details);
        formData.append('reporter_name', name);
        formData.append('reporter_email', email);

        // Add files
        const files = evidenceUploadInput.files;
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                formData.append('evidence_files', files[i]);
            }
        }

        try {
            const response = await fetch(`${backendUrl}/api/reports/`, {
                method: 'POST',
                body: formData,
            });

            const responseData = await response.json();
            
            if (response.ok) {
                if (responseData.case_id) {
                    // Show pop-up alert with case ID
                    alert(`Thank you for your submission!\n\nYour confidential Case ID is:\n\n${responseData.case_id}\n\nPlease save this ID to track the status of your report.`);
                    
                    // Also show in chat
                    addBotMessage(`Your report has been submitted successfully. <br><br><b>Your Case ID is: ${responseData.case_id}</b> <br><br>Please save this ID to track your report. You can now safely close this window.`);
                } else {
                    console.error('Response missing case_id:', responseData);
                    addBotMessage("Your report was submitted, but there was an issue retrieving your Case ID. Please contact support with this information.");
                }
            } else {
                // Handle validation errors
                let errorMessage = "I'm sorry, there was an error submitting your report.";
                if (responseData.detail) {
                    errorMessage += `<br><br>Error: ${responseData.detail}`;
                } else if (responseData.non_field_errors) {
                    errorMessage += `<br><br>Error: ${responseData.non_field_errors.join(', ')}`;
                } else if (typeof responseData === 'object') {
                    const fieldErrors = Object.entries(responseData)
                        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                        .join('<br>');
                    if (fieldErrors) {
                        errorMessage += `<br><br>Errors:<br>${fieldErrors}`;
                    }
                }
                console.error('Server Error:', response.status, responseData);
                addBotMessage(errorMessage);
            }
        } catch (error) {
            console.error('Submission Error:', error);
            addBotMessage("A network error occurred. Please check your connection and try again.");
        }
    };

    // --- Define the Conversation ---
    conversationFlow = {
        'greeting': {
            message: "Hello! Thank you for reaching out. I'm here to safely and confidentially guide you through submitting your report.<br><br>First, what is the nature of your concern?",
            type: 'categories',
            next: 'getSchool'
        },
        'getSchool': {
            message: "Thank you. Which school or institution is this report about?",
            type: 'text',
            store: 'schoolName',
            next: 'getDetails'
        },
        'getDetails': {
            message: "Please describe the incident in as much detail as possible. <br><br>Try to include dates, times, names (if safe to do so), and a factual account of what happened.",
            type: 'text',
            store: 'details',
            next: 'getEvidence'
        },
        'getEvidence': {
            message: "Thank you for that. If you have any evidence, like screenshots, photos, or documents, you can upload them now. This is optional but highly recommended.",
            type: 'upload',
            next: 'getName'
        },
        'getName': {
            message: "We're almost done. We encourage you to provide contact information so an authority can follow up if needed. This remains confidential.<br><br>What is your full name? (You can type 'anonymous' to skip)",
            type: 'text',
            store: 'reporterName',
            next: 'getEmail'
        },
        'getEmail': {
            message: "And what is your email address? (You can type 'anonymous' to skip)",
            type: 'text',
            store: 'reporterEmail',
            next: 'getAffirmation'
        },
        'getAffirmation': {
            message: "Thank you. One final step. Please read and check the box below to affirm your report is, to the best of your knowledge, true and accurate.",
            type: 'affirmation'
            // 'next' is not needed, submission is handled by the button
        }
    };

    // --- Start the Chat ---
    addBotMessage(conversationFlow[state].message);
    if (conversationFlow[state].type === 'categories') {
        showCategoryButtons();
    } else {
        showInputArea();
    }
});