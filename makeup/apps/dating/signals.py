from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Profile, LiveUser
from django.contrib.auth.signals import user_logged_out, user_logged_in

@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    LiveUser.objects.filter(user=user).update(is_live=False)
    print(f"User {user.username} has logged out and is no longer live")



# @receiver(user_logged_in)
# def user_logged_in_handler(sender, request, user, **kwargs):
#     print(f"User {user.username} has logged in")
#     LiveUser.objects.update_or_create(user=user, defaults={'is_live': True})
#     print(f"User {user.username} is now live")
