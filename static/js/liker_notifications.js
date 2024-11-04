document.addEventListener('DOMContentLoaded', function() {
    let currentCount = parseInt($('#notification-badge').text(), 10) || 0; // Initial badge count

    // Function to check for new notifications
    function checkNotifications() {
        $.post(likerUrl, {}, function(data) {
            const newTotalCount = data.total_notifications;
            console.log('newTotalCount: ', newTotalCount);

            // Update the badge count if the notification count has changed
            if (newTotalCount !== currentCount) {
                currentCount = newTotalCount; // Update current count
                $('#notification-badge').text(currentCount); // Update badge text
            }
        }).fail(function() {close
            console.error("Failed to fetch notification count");
        });
    }

    // Check notifications on page load
    checkNotifications();

    // Periodically check for new notifications (every 30 seconds)
    setInterval(checkNotifications, 30000);

    // Attach event listeners to all close buttons
    document.querySelectorAll('.close-notifications').forEach(function(button) {
        button.addEventListener('click', function() {
            // Find the parent `li` element and hide it
            const notificationItem = button.closest('.notification-item');
            if (notificationItem) {
                const notificationId = notificationItem.dataset.notificationId; // Get the notification ID
                const notificationStatus = notificationItem.dataset.status; // Get the notification status

                // If the status is "accepted" or "rejected", proceed with closing
                if (notificationStatus === 'accepted' || notificationStatus === 'rejected') {
                    console.log('Attempting to close notification:', notificationId); // Log the ID

                    // Close the notification and send the update to the backend
                    closeNotification(notificationId, 'liker_user', notificationItem);
                }
            }
        });
    });

    // Function to close a notification and optionally send an update to the backend
    function closeNotification(notificationId, notificationType, notificationItem) {

        $.post(closeLikerNotification, {
            'notification_id': notificationId,
            'user_type': notificationType,  // Ensure 'user_type' is being passed correctly
            'status': 'closed'
        },
        function(data){
            if (data.status === 'success') {
                notificationItem.remove();

                // Reduce the badge count by 1
                currentCount -= 1;
                $('#notification-badge').text(currentCount);

                // Optionally, hide the entire notification list if it's empty
                if (document.querySelectorAll('.notification-item').length === 0) {
                    document.querySelector('.notifications-list').style.display = 'none';
                }
            }
        }).fail(function() {
            console.error('Failed to send AJAX request');
        });
    }
});
