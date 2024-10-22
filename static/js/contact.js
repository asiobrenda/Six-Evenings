function send_message(event){
  event.preventDefault()
  var name_ = document.getElementById('name').value;
  var email_ = document.getElementById('email').value;
  var message_ = document.getElementById('message').value;
    $.post(contactUs,
        {
              'name': name_,
              'email': email_,
              'message': message_
        },
        function(data){
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
    )

}