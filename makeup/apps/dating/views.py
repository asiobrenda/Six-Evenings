from django.shortcuts import render, redirect, reverse
from django.contrib.auth import login
from .forms import SignUpCreationForm
from .models import Dating, OnlineMembers, Contact
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from .models import Profile, LiveUser,LikeNotification

def home(request):
    dating = Dating.objects.all()
    members = OnlineMembers.objects.all()
    context = {'dating': dating, 'members':members}
    return render(request, 'dating/index.html', context)


def sign_up(request):
    if request.method == 'POST':
        form = SignUpCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('dating:login')  # Redirect to login page or any other page
    else:
        form = SignUpCreationForm()

    return render(request, 'dating/sign_up.html', {'form': form})


@login_required
def create_profile(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        gender = request.POST.get('gender')
        height = request.POST.get('height')
        weight = request.POST.get('weight')
        color = request.POST.get('color')
        bio = request.POST.get('bio')
        image = request.FILES.get('photo')
        contact = request.POST.get('contact')

        # Create the profile and associate it with the logged-in user
        profile = Profile.objects.create(
            user=request.user,
            name=name,
            gender=gender,
            height=height,
            weight=weight,
            color=color,
            bio=bio,
            image=image,
            contact=contact
        )

        # Update the LiveUser instance to link to the new profile
        live_user, created = LiveUser.objects.get_or_create(user=request.user)
        live_user.profile = profile  # Set the profile
        live_user.save()  # Save the changes to LiveUser

        return redirect('dating:home')  # Redirect after profile creation

    return render(request, 'dating/create_profile.html')



@login_required
def go_live(request):
    user = request.user

    # Attempt to get the user's profile
    try:
        profile = user.profile
    except Profile.DoesNotExist:
        messages.warning(request, "You need to create a profile before going live.")
        return redirect('dating:create_profile')

    # Create or update the LiveUser instance for the current user
    live_user, created = LiveUser.objects.update_or_create(
        user=user,
        defaults={
            'is_live': True,
            'profile': profile  # Ensure profile is associated
        }
    )

    context = {
        'profile': profile,
        'current_user_live': True,
        'user_id': user.id,
        'live_users_data': []  # No other live users needed for this context
    }

    return render(request, 'dating/go_live.html', context)



@login_required
def see_live(request):
    # Check if the current user is live; if yes, set to False
    live_user, created = LiveUser.objects.get_or_create(user=request.user)

    if live_user.is_live:
        live_user.is_live = False
        live_user.save()

    # Fetch all live users except the current user
    live_users = LiveUser.objects.filter(is_live=True).exclude(user=request.user)

    live_users_data = []

    for live in live_users:
        profile = live.profile  # Directly access the profile associated with LiveUser
        if profile:  # Ensure profile exists
            live_users_data.append({
                'id': profile.id,
                'name': getattr(profile, 'name', 'Unknown'),
                'gender': profile.gender,
                'bio': profile.bio,
                'height': profile.height,
                'weight': profile.weight,
                'latitude': live.latitude,
                'longitude': live.longitude,
                'image': getattr(profile.image, 'url', '')
            })

    try:
        # Try to access the current user's profile
        profile = request.user.profile
    except ObjectDoesNotExist:
        profile = None  # Set profile to None if it doesn't exist
        # Optionally, redirect the user to the profile creation page or display a message

    context = {
        'live_users_data': live_users_data,
        'current_user_live': live_user.is_live,
        'current_user_id': request.user.id,
        'profile': profile  # Pass the user's profile if it exists, or None
    }

    return render(request, 'dating/live.html', context)


def notifications(request):
    if request.user.is_authenticated:
        # Fetch notifications where the user was liked but exclude those closed by the liked user
        liked_users = LikeNotification.objects.filter(
            liked_user=request.user,
            closed_by_liked_user=False  # Exclude notifications closed by the liked user
        ).select_related('liker')

        # Fetch notifications where the user is the liker, excluding pending and closed ones
        liker_notifications = LikeNotification.objects.filter(
            liker=request.user).exclude( status='pending').exclude(
            closed_by_liker=True  # Exclude notifications closed by the liker
        ).select_related('liked_user')

        # Count only pending notifications (don't mark them as read yet)
        notification_count = LikeNotification.objects.filter(liked_user=request.user, status='pending').count()

        context = {
            'liked_users': liked_users,
            'liker_notifications': liker_notifications,
            'notification_count': notification_count
        }

        return render(request, 'dating/notifications.html', context)

    else:
        return redirect('dating:login')


def get_profile(request, profile_id):
    # Use get_object_or_404 to handle cases where the profile doesn't exist
    profile_details = get_object_or_404(Profile, id=profile_id)

    return render(request, 'dating/get_profile.html', {'profile': profile_details})


def accept(request, accept_id):
    if request.method == 'POST':
        liker_id = request.POST.get('liker_id')

        # Get the LikeNotification object
        like_notification = LikeNotification.objects.filter(
            liker_id=liker_id,
            liked_user=request.user,
            status='pending'
        ).first()  # Use first() to avoid MultipleObjectsReturned

        if like_notification:
            # Update the status to accepted
            like_notification.status = 'accepted'
            like_notification.message = f'{request.user.username} accepted your like!'
            like_notification.save()

            return JsonResponse({'status': 'success', 'message': 'Like accepted and notification updated.', 'name': like_notification.liker.username})

        return JsonResponse({'status': 'error', 'message': 'No pending like notification found.'})

    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})


def reject(request, reject_id):
    if request.method == 'POST':
        liker_id = request.POST.get('liker_id')

        # Get the LikeNotification object
        like_notification = LikeNotification.objects.filter(
            liker_id=liker_id,
            liked_user=request.user,
            status='pending'
        ).first()  # Use first() to avoid MultipleObjectsReturned

        if like_notification:
            # Update the status to rejected
            like_notification.status = 'rejected'
            like_notification.message = f'{request.user.username} rejected your like.'
            like_notification.closed_by_liked_user = False
            like_notification.save()

            return JsonResponse({'status': 'success', 'message': 'Like rejected and notification updated.', 'name': like_notification.liker.username})

        return JsonResponse({'status': 'error', 'message': 'No pending like notification found.'})

    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})



def undo_reject(request, undo_id):
    if request.method == 'POST':
        liker_id = request.POST.get('liker_id')

        # Get the LikeNotification object
        like_notification = get_object_or_404(LikeNotification, liker_id=liker_id)

        # Reset the status back to pending or its previous state
        like_notification.status = 'pending'
        like_notification.message = f' User {liker_id} liked you'
        like_notification.save()

        return JsonResponse({'status': 'success', 'message': 'Rejection undone. Notification restored.'})

    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})


def LikerNotifications(request):
    if request.method == 'POST' and request.user.is_authenticated:
        # Count pending likes for the liked user
        pending_likes_count = LikeNotification.objects.filter(
            liked_user=request.user,  # The liked user is the logged-in user
            status='pending'  # Count only pending likes
        ).count()

        # Count accepted or rejected notifications for the liker
        # Exclude those closed by the liker
        liker_notifications_count = LikeNotification.objects.filter(
            liker=request.user,  # The logged-in user is the liker
            status__in=['accepted', 'rejected'],  # Count accepted or rejected statuses
            closed_by_liker=False  # Exclude notifications closed by the liker
        ).count()

        # Calculate total notifications to display in one badge
        total_notifications = pending_likes_count + liker_notifications_count

        # Optionally reset the count if they visit the notification page
        if request.POST.get('mark_as_read'):
            LikeNotification.objects.filter(
                liker=request.user,
                status__in=['accepted', 'rejected']
            ).update(is_read=True)

        return JsonResponse({'total_notifications': total_notifications})

    return JsonResponse({'total_notifications': 0})


def closeLikeNotification(request):
    if request.method == 'POST':
        notification_id = request.POST.get('notification_id')
        status = request.POST.get('status')
        user_type = request.POST.get('user_type')  # Check if it's the liked user or liker
        try:
            notification = LikeNotification.objects.get(id=notification_id)

            # If the liked user is closing the notification
            if user_type == 'liked_user':
                notification.closed_by_liked_user = True

            # If the liker is closing the notification
            elif user_type == 'liker':
                notification.closed_by_liker = True

            # Save changes to the notification
            notification.save()

            return JsonResponse({'status': 'success'})

        except LikeNotification.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Notification not found'})


def closeLikerNotification(request):
    if request.method == 'POST':
        notification_id = request.POST.get('notification_id')
        status = request.POST.get('status')
        user_type = request.POST.get('user_type')  # Check if it's the liked user or liker
        try:
            notification = LikeNotification.objects.get(id=notification_id)

            # Mark the notification as closed by the liker
            notification.closed_by_liker = True
            notification.save()

            return JsonResponse({'status': 'success'})

        except LikeNotification.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Notification not found'})

    return JsonResponse({'status': 'error', 'message': 'Invalid request'})


def contact_us(request):
    if request.method == "POST":
        contact_name = request.POST.get('name')
        contact_email = request.POST.get('email')
        contact_message = request.POST.get('message')

        Contact.objects.create(name=contact_name,email=contact_email,message=contact_message)

        return JsonResponse({'status': 'success', 'message': 'Message received'})

    return JsonResponse({'status': 'error', 'message': 'Invalid request'})


def stopLive(request):
    if request.method == 'POST':
        is_live = request.POST.get('is_live')
        user_id = request.POST.get('user_id')
        # Convert the string 'false'/'true' to a boolean
        if is_live == 'false':
            is_live = False
        elif is_live == 'true':
            is_live = True

        live_user = LiveUser.objects.get(user_id=user_id)  # Assuming 'LiveUser' has 'user_id'
        live_user.is_live = is_live
        live_user.save()

    return JsonResponse({'status': 'success', 'message': 'Live status updated'})

@login_required
def update_location(request):
    if request.method == 'POST':
        try:
            # Get the latitude and longitude from the request
            latitude = float(request.POST.get('latitude'))
            longitude = float(request.POST.get('longitude'))

            # Get the live user associated with the logged-in user
            live_user = LiveUser.objects.get(user=request.user)

            # Update the user's latitude and longitude
            live_user.latitude = latitude
            live_user.longitude = longitude
            live_user.save()

            return JsonResponse({'status': 'success', 'message': 'Location updated successfully.'})

        except LiveUser.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Live user profile not found.'}, status=404)

        except ValueError:
            return JsonResponse({'status': 'error', 'message': 'Invalid latitude or longitude.'}, status=400)

    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)


@login_required
def liker_has_profile(request):
    if request.method == 'POST':
        user_id = request.POST.get('userId')
        if not user_id:
            return JsonResponse({'error': 'User ID not provided'}, status=400)

        try:
            # Check if a LiveUser exists for the given user_id
            has_profile = LiveUser.objects.filter(user__id=user_id, profile__isnull=False).exists()
            return JsonResponse({'hasProfile': has_profile})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)