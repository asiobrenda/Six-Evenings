document.addEventListener('DOMContentLoaded', function() {
    const notificationBadge = document.getElementById('notification-badge');
    const wsUrl = 'ws://' + window.location.host + '/ws/notifications/';

    const notificationSocket = new WebSocket(wsUrl);

    notificationSocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Notification received:', data.notification_count);

        // Update the notification badge with the new count
        notificationBadge.innerText = data.notification_count;
    };

    notificationSocket.onclose = function(e) {
        console.error('WebSocket closed unexpectedly');
    };
});
