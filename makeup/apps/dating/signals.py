from django.contrib.auth.signals import user_logged_out, user_logged_in
from django.dispatch import receiver
from .models import LiveUser
from django.utils.timezone import now

@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    if user is not None:
        print(f"User {user.username} has logged out and is no longer live")
    else:
        print("An anonymous user has logged out")


@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    print(f"User {user.username} has logged in")

    # Try to get the user's profile, but don't redirect here
    profile = getattr(user, "userprofile", None)

    try:
        latitude = request.POST.get("latitude")
        longitude = request.POST.get("longitude")

        if latitude and longitude:
            print(f"User {user.username} location: {latitude}, {longitude}")

        LiveUser.objects.update_or_create(
            user=user,
            defaults={
                'profile': profile,  # Associate with the existing profile (if any)
                'latitude': latitude,
                'longitude': longitude,
                'last_active': now(),
            }
        )

    except Exception as e:
        print(f"Error in user_logged_in_handler: {e}")