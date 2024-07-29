// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', function() {
  function printLetterByLetter(destination, message, speed, callback) {
      var i = 0;
      var interval = setInterval(function() {
          // Check if on a new line character
          if (message.charAt(i) === '\n') {
              document.getElementById(destination).innerHTML += "<br>"; // Add a line break
          } else {
              document.getElementById(destination).innerHTML += message.charAt(i);
          }
          i++;
          if (i > message.length) {
              clearInterval(interval);
              if (callback && typeof callback === 'function') {
                  callback(); // Execute the callback after printing is done
              }
          }
      }, speed);
  }
  
  // Modify the message to include line breaks
  const message = "Faster,\n Better,\n and \n Cost\n Effective";
  
  // Call printLetterByLetter with a callback to show the CTA elements with a delay
  printLetterByLetter("pitch", message, 25, function() {
      var ctaElements = document.getElementsByClassName("CTA");
      for (let j = 0; j < ctaElements.length; j++) {
          setTimeout(function() {
              ctaElements[j].style.visibility = 'visible'; // Show each CTA element with delay
          }, j * 300); // .3 second delay for each element
      }
  });
});
// Function to hide the flash message
document.addEventListener('DOMContentLoaded', function () {
  // Function to hide the flash message
  function hideFlashMessage() {
      const flashMessages = document.querySelectorAll('#flash_message');
      flashMessages.forEach(flashMessage => {
          flashMessage.style.display = 'none';
      });
  }

  // Add event listeners to hide the flash message
  document.addEventListener('click', hideFlashMessage);
  document.addEventListener('keydown', hideFlashMessage);
});
