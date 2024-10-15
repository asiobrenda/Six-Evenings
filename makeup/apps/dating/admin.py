from. forms import SignUpCreationForm
from django.contrib.auth.admin import UserAdmin
from.models import SignUpUser, Dating, OnlineMembers, Profile, LiveUser, LikeNotification, Contact
from django.contrib import admin


class SignUpUserAdmin(UserAdmin):
    add_form = SignUpCreationForm
    model = SignUpUser
    list_display = ['username', 'email']


admin.site.register(SignUpUser, SignUpUserAdmin)


@admin.register(Dating)
class DatingAdmin(admin.ModelAdmin):
    list_display = ['text_status', 'description', 'image']


@admin.register(OnlineMembers)
class DatingAdmin(admin.ModelAdmin):
    list_display = ['id', 'description', 'data_to', 'data_speed', 'number' ]

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'gender', 'height', 'weight', 'color', 'bio', 'image', 'contact']

@admin.register(LiveUser)
class LiveUserAdmin(admin.ModelAdmin):
    list_display = ['user', 'profile', 'is_live']


@admin.register(LikeNotification)
class LikeNotificationAdmin(admin.ModelAdmin):
    list_display = ['liker', 'liked_user', 'message', 'status', 'timestamp', 'closed_by_liked_user', 'closed_by_liker']


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['name','email', 'message']