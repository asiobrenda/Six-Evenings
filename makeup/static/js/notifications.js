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
                rejectButton.classList.add('hidden-button');
                 rejectButton.style.pointerEvents = 'none';
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
            var acceptButton = rejectButton.closest('.notification-actions').querySelector('.accept');
                if (acceptButton) {
                    acceptButton.classList.add('hidden-button');
                    acceptButton.style.pointerEvents = 'none';
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
                acceptButton.classList.remove('hidden-button');
                acceptButton.style.pointerEvents = 'auto';
            }

            rejectButton.classList.remove('hidden-button');
            rejectButton.style.pointerEvents = 'auto';

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
function formatTimeAgo(timestamp) {
    const now = new Date(); // Client's current time
    const then = new Date(timestamp); // Convert ISO timestamp to Date object

    // Calculate the absolute difference in seconds
    const diffInSeconds = Math.abs(Math.floor((now - then) / 1000));

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
        let text = ` na ${number} ${unit}${number > 1 ? 's' : ''} ago`;

        // Replace " ago" with a span to change the color to white
        text = text.replace(' na', '<span style="color: white;"> na</span>');

        // Update the notification timestamp with the formatted text
        notification.innerHTML = text;
    });
}


// Initial call to update timestamps
updateTimestamps();

// Update every minute to keep timestamps fresh
setInterval(updateTimestamps, 60000);


document.addEventListener('DOMContentLoaded', function () {
    let pressTimer; // Timer to detect long press

    document.querySelectorAll('.action-link').forEach(button => {
        button.dataset.tooltipVisible = "false"; // Initialize tooltip state for each button

        // Long press detection
        button.addEventListener('mousedown', function (e) {
            pressTimer = setTimeout(() => {
                console.log("Long press: Showing tooltip only");
                button.dataset.tooltipVisible = "true";
                button.classList.add('active'); // Ensure tooltip is shown
                button.dataset.preventAction = "true"; // Mark as long press to prevent further action
            }, 500); // Adjust time for long press (500ms here)
        });

        button.addEventListener('touchstart', function (e) {
            pressTimer = setTimeout(() => {
                console.log("Long press (touch): Showing tooltip only");
                button.dataset.tooltipVisible = "true";
                button.classList.add('active'); // Ensure tooltip is shown
                button.dataset.preventAction = "true"; // Mark as long press to prevent further action
            }, 500);
        });

        button.addEventListener('mouseup', handlePressEnd);
        button.addEventListener('mouseleave', handlePressEnd);
        button.addEventListener('touchend', handlePressEnd);

        function handlePressEnd() {
            clearTimeout(pressTimer); // Cancel long press timer
        }

        // Click behavior
        button.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default action
            e.stopPropagation(); // Stop event bubbling

            if (button.dataset.preventAction === "true") {
                // Long press detected, reset state and do nothing
                console.log("Ignoring action after long press");
                button.dataset.preventAction = "false"; // Reset long press marker
                return;
            }

            const isTooltipVisible = button.dataset.tooltipVisible === "true";

            if (!isTooltipVisible) {
                // First click: Show tooltip
                console.log("First click: Showing tooltip");
                button.dataset.tooltipVisible = "true";
                button.classList.add('active');

                // Hide other tooltips
                document.querySelectorAll('.action-link.active').forEach(activeButton => {
                    if (activeButton !== button) {
                        activeButton.classList.remove('active');
                        activeButton.dataset.tooltipVisible = "false";
                    }
                });
            } else {
                // Second click: Hide tooltip and perform action
                console.log("Second click: Performing action");
                button.dataset.tooltipVisible = "false";
                button.classList.remove('active');

                if (button.classList.contains('view-profile')) {
                    openProfileModal(button.getAttribute('getProfileUrl'));
                } else if (button.classList.contains('accept')) {
                    const acceptUrl = button.getAttribute('acceptUrl');
                    const likerId = button.getAttribute('data-liker-id');
                    acceptLike(likerId, acceptUrl, button);
                } else if (button.classList.contains('reject')) {
                    const rejectUrl = button.getAttribute('rejectUrl');
                    const likerId = button.getAttribute('data-liker-id');
                    rejectLike(likerId, rejectUrl, button);
                }
            }
        });
    });

    // Close tooltips when clicking outside
    document.addEventListener('click', function (e) {
        document.querySelectorAll('.action-link.active').forEach(button => {
            if (!button.contains(e.target)) {
                console.log("Click outside: Hiding tooltip");
                button.classList.remove('active'); // Hide tooltip
                button.dataset.tooltipVisible = "false"; // Reset tooltip state
            }
        });
    });

    function openProfileModal(profileUrl) {
        // AJAX request to fetch profile details
        $.post(profileUrl, {}, function (data) {
            document.getElementById('profileDetails').innerHTML = data;
            document.getElementById('profileModal').style.display = 'block';
            document.body.classList.add('modal-open');
        }).fail(function () {
            console.error("Failed to load profile.");
            showToast("Unable to load profile. Please try again.");
        });
    }
});


});


