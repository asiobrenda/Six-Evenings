document.addEventListener('DOMContentLoaded', function() {

   // Check if the current environment is production
    var isProduction = window.location.hostname === "www.sixevenings.com";

    // Set the WebSocket URL based on the environment
    var socketUrl = isProduction ?
        'wss://www.sixevenings.com/ws/live/' :
        'ws://' + window.location.host + '/ws/live/';

    // Create the WebSocket connection
    var socket = new WebSocket(socketUrl);


// Check WebSocket connection
socket.onopen = function() {
    console.log("WebSocket connection established.");
};

// Log errors
socket.onerror = function(error) {
    console.log("WebSocket Error: ", error);
};

// Log when WebSocket closes
socket.onclose = function(event) {
    console.log("WebSocket connection closed: ", event);
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);

    // Handle notification count updates
    if (data.notification_count !== undefined) {
        updateNotificationBadge(data.notification_count);
    }

    // Handle like acceptance notifications
    if (data.type === 'like_acceptance' && data.liker_id) {
        alert(`${data.name} accepted your like!`);
    }

    // Handle like rejection notifications
    if (data.type === 'like_rejection' && data.liker_id) {
        alert(`${data.name} rejected your like.`);
    }
};


    function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    badge.textContent = count;

    // Keep the badge visible even if the count is zero
    badge.style.display = 'block';
   }


    document.querySelectorAll('.view-profile').forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            var userId = this.getAttribute('data-user-id');
            var getProfileUrl = this.getAttribute('getProfileUrl');
            openProfileModal(userId, getProfileUrl);
        });
    });


    document.querySelector('.close').addEventListener('click', function() {
        closeProfileModal();
    });


    document.querySelectorAll('.action-link.accept').forEach(function(acceptButton) {
        acceptButton.addEventListener('click', function(event) {
            event.preventDefault();
            var likerId = this.getAttribute('data-liker-id');
            var acceptUrl = this.getAttribute('acceptUrl');
            acceptLike(likerId, acceptUrl, acceptButton);
        });
    });


    document.querySelectorAll('.action-link.reject').forEach(function(rejectButton) {
        rejectButton.addEventListener('click', function(event) {
            event.preventDefault();
            if (rejectButton.getAttribute('data-action') === 'undo') {
                var likerId = this.getAttribute('data-liker-id');
                var undoUrl = rejectButton.getAttribute('undoUrl');
                undoReject(likerId, undoUrl, rejectButton);
            } else {
                var likerId = this.getAttribute('data-liker-id');
                var rejectUrl = this.getAttribute('rejectUrl');
                rejectLike(likerId, rejectUrl, rejectButton);
            }
        });
    });


    function openProfileModal(userId, getProfileUrl) {
        $.post(getProfileUrl, {}, function(data) {
            document.getElementById('profileDetails').innerHTML = data;
            document.getElementById('profileModal').style.display = 'block';
            document.body.classList.add('modal-open');
        });
    }

    function closeProfileModal() {
        document.getElementById('profileModal').style.display = 'none';
        document.body.classList.remove('modal-open');
    }

   // Update the acceptLike function to send a notification to the liker
  function acceptLike(likerId, acceptUrl, acceptButton) {
    $.post(acceptUrl, { liker_id: likerId }, function(data) {
        if (data.status === 'success') {
            var name = data['name'];
            showToast('You accepted ' + name);

            // Update button text and status
            acceptButton.innerText = 'Accepted';
            acceptButton.classList.add('accepted');
            acceptButton.disabled = true;

            // Hide reject button
            var rejectButton = acceptButton.closest('.notification-actions').querySelector('.reject');
            if (rejectButton) {
                rejectButton.style.display = 'none';
            }

            // Update the notification item's status in the DOM
            var notificationItem = acceptButton.closest('.notification-item');
            if (notificationItem) {
                notificationItem.dataset.status = 'accepted';  // Update status to 'accepted'

            }

            // Send WebSocket notification to liker
            sendWebSocketNotification(likerId, name, 'like_acceptance');

            // Update the notification count for the liked user
            const badge = document.getElementById('notification-badge');
            if (badge) {
                const currentCount = parseInt(badge.textContent) || 0;
                const newCount = Math.max(0, currentCount - 1);  // Ensure the count doesn't go below 0
                updateNotificationBadge(newCount);
            }
        }
    });
}




    // Define the sendWebSocketNotification function
   function sendWebSocketNotification(likerId, name, type) {
    if (socket.readyState === WebSocket.OPEN) {
        const message = {
            liker_id: likerId,
            name: name,
            type: type
        };
        socket.send(JSON.stringify(message));
        console.log("WebSocket notification sent:", message);
    } else {
        console.error("WebSocket is not open. Unable to send notification.");
    }
}

    function showToast(message) {
        var toast = document.getElementById('accept-toast');
        toast.querySelector('.toast-message').innerText = message;
        toast.classList.add('show');
        setTimeout(function() {
            toast.classList.remove('show');
        }, 2500);
    }

 function rejectLike(likerId, rejectUrl, rejectButton) {
    $.post(rejectUrl, { liker_id: likerId }, function(data) {
        if (data.status === 'success') {
            // Change the button text to 'Undo'
            rejectButton.innerText = 'Undo';
            rejectButton.classList.add('undo-button');
            rejectButton.setAttribute('data-action', 'undo');

            // Prepare the undo URL
            var undoUrl = undoRejectUrlTemplate.replace('0', likerId);
            rejectButton.setAttribute('undoUrl', undoUrl);

            // Hide the accept button
            var acceptButton = rejectButton.closest('.notification-actions').querySelector('.accept');
            if (acceptButton) {
                acceptButton.style.display = 'none'; // Hide the accept button
            }

            // Change the reject button text to 'Rejected' after a timeout
            setTimeout(function() {
                // Only change text if not undone
                if (rejectButton.innerText === 'Undo') {
                    rejectButton.innerText = 'Rejected'; // Update the button text to 'Rejected'
                    rejectButton.classList.remove('undo-button'); // Remove the undo class if needed
                    rejectButton.setAttribute('data-action', 'rejected'); // Update the action attribute
                    rejectButton.disabled = true; // Disable the reject button
                }
            }, 2500); // Adjust the delay as necessary

            // Add event listener to handle undo action
            rejectButton.addEventListener('click', function(event) {
                event.preventDefault();
                clearTimeout(timeoutId); // Stop the removal when Undo is clicked
                undoReject(likerId, undoUrl, rejectButton); // Call the undo function
            });


             // Update the notification item's status in the DOM
            var notificationItem = acceptButton.closest('.notification-item');
            if (notificationItem) {
                notificationItem.dataset.status = 'rejected';  // Update status to 'accepted'

            }

            // Send WebSocket notification to the liker
            sendWebSocketNotification(likerId, null, 'like_rejection');

            // Update the notification count for the liked user
            const badge = document.getElementById('notification-badge');
            if (badge) {
                const currentCount = parseInt(badge.textContent) || 0;
                const newCount = Math.max(0, currentCount - 1); // Ensure the count doesn't go below 0
                updateNotificationBadge(newCount);
                console.log("Updated notification count after reject:", newCount);
            }
        }
    });
}


function undoReject(likerId, undoUrl, rejectButton) {

    $.post(undoUrl, { liker_id: likerId }, function(data) {
        if (data.status === 'success') {
            // Reset the reject button to its original state
            rejectButton.innerText = 'Reject'; // Change the button text back to 'Reject'
            rejectButton.classList.remove('undo-button'); // Remove the undo class
            rejectButton.setAttribute('data-action', 'reject'); // Update the action attribute
            rejectButton.disabled = false; // Enable the reject button

             // Update the status of the notification item
            const notificationItem = rejectButton.closest('.notification-item');
            if (notificationItem) {
                notificationItem.dataset.status = 'pending'; // Update to a status that matches your logic
            }

            // Show the accept button again
            var acceptButton = rejectButton.closest('.notification-actions').querySelector('.accept');
            if (acceptButton) {
                acceptButton.style.display = 'inline-block'; // Show the accept button again
            }

            // Update the notification count
            const badge = document.getElementById('notification-badge');
            if (badge) {
                const currentCount = parseInt(badge.textContent) || 0;
                const newCount = Math.max(0, currentCount + 1); // Increment when undoing a reject
                updateNotificationBadge(newCount);
                console.log("Updated notification count after undo reject:", newCount);
            }
        }
    });
}


var notificationList = document.querySelector('.notifications-list');

notificationList.addEventListener('click', function(event) {
    // Check if the clicked element is a close button
    if (event.target.classList.contains('close-notification')) {
        // Find the closest notification item (li) to the button clicked
        const notificationItem = event.target.closest('.notification-item');

        if (notificationItem) {
            const notificationId = notificationItem.dataset.notificationId; // Get the notification ID
            let notificationStatus = notificationItem.dataset.status; // Get the notification status

            // Check if the status is "pending"
            if (notificationStatus === "pending") {
                alert('Please accept or reject the notification before closing.');

                // Stop further action since the user needs to accept or reject first
                return;
            }

            // If the status is "accepted" or "rejected", proceed with closing
            if (notificationStatus === 'accepted' || notificationStatus === 'rejected') {

                // Remove the notification from the UI
                closeNotification(notificationId, 'liked_user', notificationItem);
            }
        }
    }
});

// Function to close the notification
function closeNotification(notificationId, userType, notificationItem) {
    // Remove the notification from the UI
    $.post(closeLikeNotification,
      {
         'notification_id': notificationId,
         'user_type': userType,
         'status': 'closed'
      },
      function(data){
            if(data.status === 'success'){
                  notificationItem.remove();
                 // Optionally, hide the entire notification list if it's empty
                 if (document.querySelectorAll('.notification-item').length === 0) {
                notificationList.style.display = 'none';
            }
            }

      }
    )
};

});