// Flag to check if text-to-speech is enabled
var isSpeechEnabled = true;

// Function to speak the text
function speakText(text) {
  if (isSpeechEnabled && 'speechSynthesis' in window) {
    var msg = new SpeechSynthesisUtterance(text);
  //  window.speechSynthesis.speak(msg);
  } else if (!('speechSynthesis' in window)) {
    alert('Sorry, your browser does not support text-to-speech.');
  }
}

// Function to set the text to be spoken and flag to check if speech is enabled
function setSpeech(text, flag) {
  isSpeechEnabled = flag;
  if (isSpeechEnabled) {
 //   speakText(text);
  }
}

// Example usage: Automatically speak text when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  var textToSpeak = 'Welcome to Tardigradia Land Oh Lil';
  var speechFlag = true; // Change this to false to disable speech
  setSpeech(textToSpeak, speechFlag);
});
