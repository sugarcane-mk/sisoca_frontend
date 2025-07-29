document.addEventListener('DOMContentLoaded', () => {
    const audioInput = document.getElementById('audio-input');
    const textDisplay = document.getElementById('transcription');
    const form = document.getElementById('audio-form');
    const synthesizedAudio = document.getElementById('synthesized-audio');
    const instructions = document.getElementById('instructions');
    const recordButton = document.getElementById('record-button');
    const stopButton = document.getElementById('stop-button');
    const submitButton = document.getElementById('submit-button');
    const recordedAudio = document.getElementById('recorded-audio');
    const playbackDiv = document.getElementById('recording-playback');
  
    const severityDropdown = document.getElementById('severity-dropdown');
    let selectedSeverity = severityDropdown.value;
  
    // Listen for changes in severity selection
    severityDropdown.addEventListener('change', () => {
      selectedSeverity = severityDropdown.value;
      console.log(`Selected severity: ${selectedSeverity}`);
    });
  
    let mediaRecorder;
    let audioChunks = [];
    let audioBlob = null;
  
    // Reset the form and disable submit button on page load
    form.reset();
    submitButton.disabled = true;
  
    // Enable submit button if an audio file is uploaded
    audioInput.addEventListener('change', function () {
      submitButton.disabled = !audioInput.files.length;
      instructions.textContent = "Upload Success. Please click 'Submit' to process.";
    });
  
    // Recording logic
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
  
        playbackDiv.style.display = 'block';
        submitButton.disabled = false;
      };
  
      mediaRecorder.start();
      recordButton.disabled = true;
      stopButton.disabled = false;
      instructions.textContent = "Recording... click 'Stop Recording' when done.";
    });
  
    stopButton.addEventListener('click', () => {
      mediaRecorder.stop();
      recordButton.disabled = false;
      stopButton.disabled = true;
      instructions.textContent = "Recording stopped. Please click 'Submit' to process.";
    });
  
    // Submit form with audio and severity level
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitButton.textContent = "Processing...";
      submitButton.disabled = true;
      instructions.textContent = "Processing your request, please wait...";

        // Simulate a delay (replace this with an actual API call)
      setTimeout(() => {
        submitButton.textContent = "Submit";
        submitButton.disabled = false;
        instructions.textContent = "Processing complete. Results are displayed.";
      }, 10000); // 10 Seconds your actual processing time
  
      // Check if severity is selected
      if (selectedSeverity === "unselect") {
        alert('Please select a severity level before submitting.');
        return; // Prevent form submission
      }
  
      const formData = new FormData();
      formData.append('severity', selectedSeverity);
  
      // Check if an audio file is uploaded or recorded
      if (audioInput.files.length > 0) {
        const file = audioInput.files[0];
        formData.append('file', file);
        console.log("Uploading file:", file.name);
      } else if (audioBlob) {
        const recordedFile = new File([audioBlob], 'recorded_audio.wav', { type: 'audio/wav' });
        formData.append('file', recordedFile);
        console.log("Uploading recorded audio");
      } else {
        alert('Please upload or record an audio file.');
        return; // Prevent form submission
      }
  
      try {
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
  
        const base64Audio = `data:audio/wav;base64,${wavBlob}`;
        synthesizedAudio.src = base64Audio;
        synthesizedAudio.play();
        textDisplay.innerText = trans;
  
      } catch (error) {
        console.error('Error:', error);
      }
    });
  });
  