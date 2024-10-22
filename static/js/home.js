  // Fetch initial notification count on login
    fetchNotificationCount();


 // Function to fetch initial notification count using AJAX
    function fetchNotificationCount() {
        $.post(likerNotification, function(data) {
            // Assuming 'notification_count' is part of the returned data
            updateNotificationBadge(data.notification_count);
        })
        .fail(function(xhr, status, error) {
            console.error('Error fetching initial notifications:', error);
        });
    }


   function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    badge.textContent = count;

    // Ensure the badge is visible even if the count is zero
    badge.style.display = block;  // Hide the badge if count is zero
}
