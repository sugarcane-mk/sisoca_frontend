document.addEventListener('DOMContentLoaded', () => {
    const audioInput = document.getElementById('audio-input');
    const textDisplay = document.getElementById('transcription');
    const form = document.getElementById('audio-form');
    const synthesizedAudio = document.getElementById('synthesized-audio');
    const recordButton = document.getElementById('record-button');
    const stopButton = document.getElementById('stop-button');
    const submitButton = document.getElementById('submit-button');
    const recordedAudio = document.getElementById('recorded-audio');
    const playbackDiv = document.getElementById('recording-playback');
    const severityDropdown = document.querySelector('.dropdown-content'); // Get the dropdown container

    let mediaRecorder;
    let audioChunks = [];
    let audioBlob = null; // Store the recorded audio blob here
    let selectedSeverity = null; // Variable to store the selected severity level

    // **On page load, reset the form and disable submit button**
    form.reset();  // Reset form to clear previous inputs
    submitButton.disabled = true;  // Disable the submit button

    // Enable submit button if an audio file is uploaded
    audioInput.addEventListener('change', function () {
      submitButton.disabled = !audioInput.files.length;
    });

    // Dropdown logic to select severity
    severityDropdown.addEventListener('click', function (event) {
        if (event.target.tagName === 'A') {
            selectedSeverity = event.target.textContent.toLowerCase(); // Get the selected severity
            console.log("Selected severity:", selectedSeverity);
        }
    });

    // Recording Logic
    recordButton.addEventListener('click', async () => {
        audioChunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (e) => {
            audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioURL = URL.createObjectURL(audioBlob);
            recordedAudio.src = audioURL;

            // Show the playback and enable the submit button after recording
            playbackDiv.style.display = 'block';
            submitButton.disabled = false;  // Enable the submit button after recording
        };

        mediaRecorder.start();
        recordButton.disabled = true;
        stopButton.disabled = false;
    });

    stopButton.addEventListener('click', () => {
        mediaRecorder.stop();
        recordButton.disabled = false;
        stopButton.disabled = true;
    });

    // Submit form with either uploaded or recorded audio
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();

        // Check if a file was uploaded or recorded
        if (audioInput.files.length > 0) {
            // Handle uploaded audio file
            const file = audioInput.files[0];
            formData.append('file', file);
            console.log("Uploading file: ", file.name);
        } else if (audioBlob) {
            // Handle recorded audio file
            const recordedFile = new File([audioBlob], 'recorded_audio.wav', { type: 'audio/wav' });
            formData.append('file', recordedFile);
            console.log("Uploading recorded audio");
        } else {
            alert('Please upload or record an audio file.');
            return;
        }

        // Add the selected severity to the form data
        if (selectedSeverity) {
            formData.append('severity', selectedSeverity);
        } else {
            alert('Please select the severity level.');
            return;
        }

        try {
            // Make a POST request to the backend with the audio file and severity
            const response = await fetch('http://127.0.0.1:8000/run_model/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log(data);
            const wavBlob = data.wav_blob;
            const trans = data.content;

            // Convert the binary data to a base64 audio string
            const base64Audio = `data:audio/wav;base64,${wavBlob}`;
            synthesizedAudio.src = base64Audio;
            synthesizedAudio.play();
            textDisplay.innerText = trans;

        } catch (error) {
            console.error('Error:', error);
        }
    });
});
