# dating/context_processors.py

from .models import LikeNotification

def notification_count_processor(request):
    if request.user.is_authenticated:
        # Count the user's pending notifications
        notification_count = LikeNotification.objects.filter(liked_user=request.user, status='pending').count()
        return {'notification_count': notification_count}
    return {'notification_count': 0}  # Return 0 if the user is not authenticated
