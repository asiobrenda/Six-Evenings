from django.contrib.auth.signals import user_logged_out
from django.dispatch import receiver

@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    if user is not None:
        print(f"User {user.username} has logged out and is no longer live")
    else:
        print("An anonymous user has logged out")


# @receiver(user_logged_in)
# def user_logged_in_handler(sender, request, user, **kwargs):
#     print(f"User {user.username} has logged in")
#     LiveUser.objects.update_or_create(user=user, defaults={'is_live': True})
#     print(f"User {user.username} is now live")
