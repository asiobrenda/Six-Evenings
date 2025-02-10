document.addEventListener('DOMContentLoaded', function () {
    // Initially show step 1
    document.getElementById('step-1').style.display = 'block';

    // Next Step Function
    window.nextStep = function(step) {
        const dobInput = document.getElementById('dob').value;
        const consentChecked = document.getElementById('consent').checked;
        const contactInput = document.getElementById('contact').value;
        const contactPattern = /^\+\d{10,15}$/;  // Regex pattern for validating phone number

        // If the current step is Step 1 (where Contact info is entered)
        if (step === 2) {
            // Validate Contact field
            if (!contactPattern.test(contactInput)) {
                alert("Please enter a valid phone number (e.g., +256 712 345 678). Spaces are not allowed");
                return;  // Stop proceeding to the next step
            }
        }

        // If the current step is Step 2 (where DOB and consent are entered)
        if (step === 3) {  // Moving to Step 3
            // Get the date of birth entered by the user
            if (!dobInput) {
                alert("Please enter your date of birth.");
                return;
            }

            const dob = new Date(dobInput);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();

            // If the user's birthday hasn't occurred yet this year, subtract 1 from the age
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
            }

            // Check if the user is 20 or older
            if (age < 20) {
                alert("You must be at least 20 years old to proceed.");
                return; // Stop proceeding to the next step
            }

            // If consent checkbox isn't checked, prevent moving to the next step
            if (!consentChecked) {
                alert("You must check to confirm you are 20+ years old to proceed.");
                return;
            }
        }

        // If no issues, proceed to the next step
        console.log('Current Step:', step); // Debugging
        document.getElementById('step-input').value = step; // Update the step input value
        var steps = document.getElementsByClassName('form-step');
        for (var i = 0; i < steps.length; i++) {
            steps[i].style.display = 'none';
        }
        document.getElementById('step-' + step).style.display = 'block';
    };

    // Previous Step Function
    window.prevStep = function(step) {
        console.log('Previous Step:', step); // Debugging
        document.getElementById('step-input').value = step; // Update the step input value
        var steps = document.getElementsByClassName('form-step');
        for (var i = 0; i < steps.length; i++) {
            steps[i].style.display = 'none';
        }
        document.getElementById('step-' + step).style.display = 'block';
    };


});
