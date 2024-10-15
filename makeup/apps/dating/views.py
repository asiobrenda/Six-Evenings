from django.shortcuts import render, redirect, reverse
from django.contrib.auth import login
from .forms import SignUpCreationForm
from .models import Dating, OnlineMembers, Profile, Contact
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import Profile, LiveUser,LikeNotification
from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.db.models import Q
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


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
        Profile.objects.create(user=request.user, name=name, gender=gender, height=height, weight=weight, color=color,
                               bio=bio, image=image, contact=contact)

        return redirect('dating:home')

    return render(request, 'dating/create_profile.html')


@login_required
def go_live(request):
    user = request.user
    try:
        profile = user.profile
    except Profile.DoesNotExist:
        messages.warning(request, "You need to create a profile before going live.")
        return redirect('dating:create_profile')

    LiveUser.objects.update_or_create(user=user, defaults={'is_live': True})

    context = {
        'profile': profile,
        'current_user_live': True,
        'user_id': user.id,
        'live_users_data': []  # No other live users needed for this context
    }
    return render(request, 'dating/live.html', context)


@login_required
def see_live(request):
    live_user, created = LiveUser.objects.get_or_create(user=request.user)
    if live_user.is_live:
        live_user.is_live = False
        live_user.save()

    live_users = LiveUser.objects.filter(is_live=True).exclude(user=request.user).filter(profile__isnull=False)



    live_users_data = []
    for live in live_users:
        profile = live.user.profile
        live_users_data.append({
            'name': profile.name,
            'gender': profile.gender,
            'bio': profile.bio,
            'height': profile.height,
            'weight': profile.weight,
            'lat': profile.latitude,  # Assuming latitude is stored
            'lng': profile.longitude,  # Assuming longitude is stored
        })

    context = {
        'live_users_data': live_users_data,
        'current_user_live': False,
        'current_user_id': request.user.id,
    }

    print(context['current_user_id'])
    return render(request, 'dating/live.html', context)

# @login_required
# def see_live(request):
#     live_user, created = LiveUser.objects.get_or_create(user=request.user)
#     if live_user.is_live:
#         live_user.is_live = False
#         live_user.save()
#
#     # Include current user for testing in development mode
#     if settings.DEBUG:
#         live_users = LiveUser.objects.filter(is_live=True).filter(profile__isnull=False)
#     else:
#         live_users = LiveUser.objects.filter(is_live=True).exclude(user=request.user).filter(profile__isnull=False)
#
#     live_users_data = []
#     for live in live_users:
#         profile = live.user.profile
#         live_users_data.append({
#             'name': profile.name,
#             'gender': profile.gender,
#             'bio': profile.bio,
#             'height': profile.height,
#             'weight': profile.weight,
#             'lat': profile.latitude,
#             'lng': profile.longitude,
#         })
#
#     context = {
#         'live_users_data': live_users_data,
#         'current_user_live': live_user.is_live,
#         'current_user_id': request.user.id,
#     }
#
#     return render(request, 'dating/live.html', context)

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

        print('Notification Details:')
        print(f'Liked Users: {liked_users}')
        print(f'Pending Notifications Count: {notification_count}')

        context = {
            'liked_users': liked_users,
            'liker_notifications': liker_notifications,
            'notification_count': notification_count
        }

        return render(request, 'dating/notifications.html', context)

    else:
        return redirect('login')


def get_profile(request, profile_id):
    # Use get_object_or_404 to handle cases where the profile doesn't exist
    profile_details = get_object_or_404(Profile, id=profile_id)

    return render(request, 'dating/get_profile.html', {'profile': profile_details})


def accept(request, accept_id):
    if request.method == 'POST':
        liker_id = request.POST.get('liker_id')

        # Get the LikeNotification object
        like_notification = get_object_or_404(LikeNotification, liker_id=liker_id)

        # Get the liker user from the LikeNotification
        liker = like_notification.liker

        # Update the status to accepted
        like_notification.status = 'accepted'
        like_notification.message = f'{request.user.username} accepted your like!'
        like_notification.save()

        return JsonResponse({'status': 'success', 'message': 'Like accepted and notification updated.','name': liker.username})

    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})


def reject(request, reject_id):
    if request.method == 'POST':
        liker_id = request.POST.get('liker_id')


        # Get the LikeNotification object
        like_notification = get_object_or_404(LikeNotification, liker_id=liker_id)

        # Get the liker user from the LikeNotification
        liker = like_notification.liker

        # Update the status to rejected
        like_notification.status = 'rejected'
        like_notification.message = f'{request.user.username} rejected your like!'
        like_notification.save()

        return JsonResponse({'status': 'success', 'message': 'Like rejected and user hidden.', 'name': liker.username})

    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})


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

        print('--'*50)
        print('brenda')
        print(notification_id)
        print('status: ', status)
        print('user_type: ', user_type)

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

        print('--'*50)
        print('asio')
        print(notification_id)
        print('status: ', status)
        print('user_type: ', user_type)

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