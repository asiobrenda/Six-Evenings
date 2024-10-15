document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('step-1').style.display = 'block'; // Show the first step

    window.nextStep = function(step) {
        console.log('Current Step:', step); // Debugging
        document.getElementById('step-input').value = step; // Update the step input value
        var steps = document.getElementsByClassName('form-step');
        for (var i = 0; i < steps.length; i++) {
            steps[i].style.display = 'none';
        }
        document.getElementById('step-' + step).style.display = 'block';
    }

    window.prevStep = function(step) {
        console.log('Previous Step:', step); // Debugging
        document.getElementById('step-input').value = step; // Update the step input value
        var steps = document.getElementsByClassName('form-step');
        for (var i = 0; i < steps.length; i++) {
            steps[i].style.display = 'none';
        }
        document.getElementById('step-' + step).style.display = 'block';
    }
});
