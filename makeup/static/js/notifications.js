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
    // Prevent multiple clicks
    acceptButton.disabled = true;

    $.post(acceptUrl, { liker_id: likerId }, function(data) {
        if (data.status === 'success') {
            var name = data.name;  // Destructured response data
            showToast('You accepted ' + name);

            // Make the checkmark icon bold
            var icon = acceptButton.querySelector('i');
            if (icon) {
                icon.style.fontWeight = 'bold';
            }

            // Update the tooltip text
            acceptButton.setAttribute('data-tooltip', 'Accepted');

            // Hide the reject button but maintain its layout space
            var rejectButton = acceptButton.closest('.notification-actions').querySelector('.reject');
            if (rejectButton) {
                rejectButton.style.visibility = 'hidden';
                rejectButton.style.pointerEvents = 'none';  // Disable interaction
            }

            // Update the notification item's status in the DOM
            var notificationItem = acceptButton.closest('.notification-item');
            if (notificationItem) {
                notificationItem.dataset.status = 'accepted';
            }

            // Send WebSocket notification to the liker
            sendWebSocketNotification(likerId, name, 'like_acceptance');

            // Update the notification count visually
            const badge = document.getElementById('notification-badge');
            if (badge) {
                const currentCount = parseInt(badge.textContent) || 0;
                const newCount = Math.max(0, currentCount - 1);  // Prevent negative values
                badge.textContent = newCount;
            }
        } else {
            // Handle potential errors
            showToast('Something went wrong. Please try again.');
            acceptButton.disabled = false;  // Re-enable if there's an error
        }
    }).fail(function() {
        // Handle AJAX failures
        showToast('Network error. Please try again later.');
        acceptButton.disabled = false;
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

    // Apply the green background class
    toast.classList.add('show', 'toast-success');

    // Remove the toast after 2.5 seconds
    setTimeout(function() {
        toast.classList.remove('show', 'toast-success');
    }, 2500);
}


function rejectLike(likerId, rejectUrl, rejectButton) {
    // Save the current badge count before decrementing
    const badge = document.getElementById('notification-badge');
    let currentCount = parseInt(badge.textContent) || 0;

    $.post(rejectUrl, { liker_id: likerId }, function(data) {
        if (data.status === 'success') {
            // Decrement badge count immediately
            const newCount = Math.max(0, currentCount - 1);
            badge.textContent = newCount;
            console.log("Updated notification count after reject:", newCount);

            // Update button to 'Undo' state
            rejectButton.innerHTML = '<i class="fas fa-undo"></i>';
            rejectButton.setAttribute('data-tooltip', 'Undo');
            rejectButton.setAttribute('data-action', 'undo');

            // Store the undo URL and count for potential reversal
            const undoUrl = undoRejectUrlTemplate.replace('0', likerId);
            rejectButton.setAttribute('data-undo-url', undoUrl);
            rejectButton.setAttribute('data-original-count', currentCount);

            // Hide the accept button
            const acceptButton = rejectButton.closest('.notification-actions').querySelector('.accept');
            if (acceptButton) {
                acceptButton.style.display = 'none';
            }

            // Automatically change to 'Rejected' state after timeout
            setTimeout(() => {
                if (rejectButton.getAttribute('data-action') === 'undo') {
                    rejectButton.innerHTML = '<i class="fas fa-times"></i>';
                    rejectButton.setAttribute('data-tooltip', 'Rejected');
                    rejectButton.setAttribute('data-action', 'rejected');
                    rejectButton.disabled = true;
                }
            }, 2500);

            // Add a one-time undo listener
            rejectButton.onclick = function(event) {
                event.preventDefault();
                undoReject(likerId, undoUrl, rejectButton);  // Call the undo function
            };
        } else {
            console.error('Failed to reject like:', data.message);
        }
    }).fail(function() {
        console.error('Error during rejectLike request');
    });
}


function undoReject(likerId, undoUrl, rejectButton) {
    $.post(undoUrl, { liker_id: likerId }, function(data) {
        if (data.status === 'success') {
            // Reset the reject button to its original state
            rejectButton.innerHTML = '<i class="fas fa-times"></i>';  // Reject icon
            rejectButton.setAttribute('data-tooltip', 'Reject');
            rejectButton.setAttribute('data-action', 'reject');
            rejectButton.disabled = false;

            // Restore the original notification badge count
            const badge = document.getElementById('notification-badge');
            const originalCount = parseInt(rejectButton.getAttribute('data-original-count')) || 0;  // Retrieve stored count
            if (badge) {
                updateNotificationBadge(originalCount);  // Reset the badge count
                console.log("Restored notification count after undo reject:", originalCount);
            }

            // Show the accept button again
            var acceptButton = rejectButton.closest('.notification-actions').querySelector('.accept');
            if (acceptButton) {
                acceptButton.style.display = 'inline-block';
            }

            // Update the status back to 'pending'
            const notificationItem = rejectButton.closest('.notification-item');
            if (notificationItem) {
                notificationItem.dataset.status = 'pending';
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


// Define the formatTimeAgo function
// Define the formatTimeAgo function
function formatTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) {
        return { number: diffInSeconds, unit: "second" };
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return { number: diffInMinutes, unit: "minute" };
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return { number: diffInHours, unit: "hour" };
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return { number: diffInDays, unit: "day" };
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return { number: diffInWeeks, unit: "week" };
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return { number: diffInMonths, unit: "month" };
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return { number: diffInYears, unit: "year" };
}

// Function to update the notification timestamps on page load
function updateTimestamps() {
    const notifications = document.querySelectorAll('.notification-time');
    notifications.forEach(notification => {
        const timestamp = notification.getAttribute('data-timestamp'); // Get timestamp
        const { number, unit } = formatTimeAgo(timestamp); // Format the time ago

        // Construct the timestamp text with pluralization
         let text = ` agos ${number} ${unit}${number > 1 ? 's' : ''} ago`;

        // Replace " ago" with a span to change the color to white
        text = text.replace(' agos', '<span style="color: white;"> agos</span>');

        // Update the notification timestamp with the formatted text
        notification.innerHTML = text;
    });
}

// Initial call to update timestamps
updateTimestamps();

// Update every minute to keep timestamps fresh
setInterval(updateTimestamps, 60000);


document.querySelectorAll('.action-link').forEach(button => {
    let tooltipShownOnce = false; // To track if the tooltip was already shown

    button.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent bubbling

        // If the tooltip is active and this is the second click, execute the action
        if (tooltipShownOnce) {
            tooltipShownOnce = false; // Reset for future clicks
            button.classList.remove('active'); // Hide the tooltip

            // Perform the specific action based on the button's class
            if (button.classList.contains('view-profile')) {
                const userId = button.getAttribute('data-user-id');
                const profileUrl = button.getAttribute('getProfileUrl');
                console.log(`Opening profile for user ID: ${userId}`);
                window.location.href = profileUrl; // Redirect to the profile
            } else if (button.classList.contains('accept')) {
                const likerId = button.getAttribute('data-liker-id');
                const acceptUrl = button.getAttribute('acceptUrl');
                console.log(`Accepting user ID: ${likerId}`);
                fetch(acceptUrl, { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            console.log('User accepted');
                            button.classList.add('hidden-button'); // Hide accept button
                            button.nextElementSibling.classList.add('hidden-button'); // Update reject button UI
                        }
                    });
            } else if (button.classList.contains('reject')) {
                const likerId = button.getAttribute('data-liker-id');
                const rejectUrl = button.getAttribute('rejectUrl');
                console.log(`Rejecting user ID: ${likerId}`);
                fetch(rejectUrl, { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            console.log('User rejected');
                            button.classList.add('hidden-button'); // Hide reject button
                            button.previousElementSibling.classList.add('hidden-button'); // Update accept button UI
                        }
                    });
            }
        } else {
            // First click: Show the tooltip
            button.classList.add('active');
            tooltipShownOnce = true; // Mark that the tooltip has been shown
        }
    });
});

// Close tooltips when clicking outside
document.addEventListener('click', function (e) {
    const tooltips = document.querySelectorAll('.action-link');
    tooltips.forEach(button => {
        if (!button.contains(e.target)) {
            button.classList.remove('active'); // Hide tooltip
        }
    });
});



});