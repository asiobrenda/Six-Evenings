function send_message(event) {
    // First, let the browser check the form validation
    if (!document.getElementById('myform').checkValidity()) {
        return; // If the form is invalid, do nothing
    }

    event.preventDefault();

    // Get values from form fields
    var name_ = document.getElementById('name').value.trim();
    var email_ = document.getElementById('email').value.trim();
    var message_ = document.getElementById('message').value.trim();

    // Send AJAX request since all fields are valid
    $.post(contactUs,
        {
            'name': name_,
            'email': email_,
            'message': message_
        },
        function(data) {
            if (data.status === 'success') {
                document.getElementById('myform').reset();
                var toast = document.getElementById('toast');
                toast.style.display = 'block';
                setTimeout(function() {
                    toast.style.display = 'none';
                }, 1000);
            } else {
                alert('Error: ' + data.message);
            }
        }
    );
}
