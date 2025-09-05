/*!
 * Start Bootstrap - Personal v1.0.1 (https://startbootstrap.com/template-overviews/personal)
 * Copyright 2013-2023 Start Bootstrap
 * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-personal/blob/master/LICENSE)
 */
// This file is intentionally blank
// Use this file to add JavaScript to your project

const form = document.getElementById("nn-contact-form");
if (form) {
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Clear previous loss message
    const lossMessage = document.getElementById("loss-message");
    if (lossMessage) {
      lossMessage.classList.add("hidden");
    }

    // Check if all fields are filled
    const nameField = document.getElementById("name");
    const emailField = document.getElementById("email");
    const messageField = document.getElementById("message");

    if (!nameField.value || !emailField.value || !messageField.value) {
      // Display the loss message
      if (lossMessage) {
        lossMessage.classList.remove("hidden");
      }
      return;
    }

    // Create form data object
    const formData = new FormData(this);

    // Send form data via AJAX
    fetch(this.action, {
      method: this.method,
      body: formData,
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          // Handle success
          const training = document.getElementById("training-animation");
          const formContainer = document.querySelector(".form-container form");
          if (training) training.classList.remove("hidden");
          if (formContainer) formContainer.classList.add("hidden");
          startAnimation();
        } else {
          // Handle errors
          response.json().then((data) => {
            if (data.errors) {
              alert(
                "Error: " + data.errors.map((error) => error.message).join(", ")
              );
            } else {
              alert("Oops! There was a problem submitting your form.");
            }
          });
        }
      })
      .catch((error) => {
        alert("There was a problem submitting your form: " + error.message);
      });
  });
}

function startAnimation() {
  let epoch = 0;
  const totalEpochs = 10;
  const progressBar = document.querySelector(".progress");
  const epochCounter = document.getElementById("epoch-counter");

  const interval = setInterval(() => {
    epoch++;
    progressBar.style.width = `${(epoch / totalEpochs) * 100}%`;
    epochCounter.textContent = `Epoch: ${epoch}`;

    if (epoch >= totalEpochs) {
      clearInterval(interval);
      // Display a success message
      epochCounter.textContent =
        "Training Complete! We’ll get back to you soon.";
      progressBar.style.backgroundColor = "#4caf50";

      // Optionally reset the form after a delay
      //   setTimeout(() => {
      //     document.getElementById("nn-contact-form").reset();
      //     document
      //       .querySelector(".form-container form")
      //       .classList.remove("hidden");
      //     document.getElementById("training-animation").classList.add("hidden");
      //     progressBar.style.width = "0%"; // Reset the progress bar for the next submission
      //   }, 2000);
    }
  }, 500); // Adjust the speed of the "training" here
}
