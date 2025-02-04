from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class SignUpUser(AbstractUser):
    pass

    def __str__(self):
         return self.username


class Dating(models.Model):
    class Meta:
        verbose_name = ('Dating')
        verbose_name_plural = ('Dating')
        ordering = ['-text_status']

    text_status = models.CharField(max_length=100, blank=True)
    description = models.TextField(max_length=200, blank=True)
    image = models.ImageField(upload_to='dating_images', blank=True)

    def __str__(self):
        return self.text_status


class OnlineMembers(models.Model):
    class Meta:
        verbose_name = ('OnlineMembers')
        verbose_name_plural = ('OnlineMembers')
        ordering = ['-id']

    id = models.IntegerField(primary_key=True)
    description = models.CharField(max_length=200, blank=True)
    data_to = models.BigIntegerField(default=0, null=False, blank=False)
    data_speed = models.BigIntegerField(default=0, null=False, blank=False)
    number = models.BigIntegerField(default=0, null=False, blank=False)

    def __str__(self):
        return self.description


class Profile(models.Model):
    class Meta:
        verbose_name = ('Profile')
        verbose_name_plural = ('Profile')
        ordering = ['-name']

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    SKIN_TONE_CHOICES = [
        ('light', 'Light'),
        ('medium', 'Medium'),
        ('dark', 'Dark'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)  # Added date of birth field
    color = models.CharField(max_length=10, choices=SKIN_TONE_CHOICES, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='profile_images', blank=True)
    contact = models.CharField(max_length=20, blank=True, null=True)
    consent = models.BooleanField(default=False)

    def __str__(self):
        return self.name if self.name else "Unnamed Profile"

    def calculate_age(self):
        from datetime import date
        today = date.today()
        age = today.year - self.dob.year
        if today.month < self.dob.month or (today.month == self.dob.month and today.day < self.dob.day):
            age -= 1
        return age

# class LiveUser(models.Model):
#     user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
#     profile = models.OneToOneField(Profile, on_delete=models.CASCADE, null=True, blank=True)  # Reference to Profile
#     is_live = models.BooleanField(default=False)  # Indicates if user is live
#     latitude = models.FloatField(null=True, blank=True)  # Store latitude
#     longitude = models.FloatField(null=True, blank=True)  # Store longitude
#
#     def __str__(self):
#         return f"{self.user.username} (Live: {self.is_live})"

class LiveUser(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, null=True, blank=True)  # Reference to Profile
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    last_active = models.DateTimeField(auto_now=True)  # Track when user was last online
    is_live = models.BooleanField(default=True)  # Track if user is online

    def __str__(self):
        return f"{self.user.username} (Last Active: {self.last_active})"

class LikeNotification(models.Model):
    liker = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_likes', on_delete=models.CASCADE)
    liked_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_likes', on_delete=models.CASCADE)
    message = models.CharField(max_length=500, null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('pending', 'pending'), ('accepted', 'accepted'), ('rejected', 'rejected')], default='pending')
    closed_by_liked_user = models.BooleanField(default=False)  # Closed by liked user
    closed_by_liker = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return f"{self.liker} liked {self.liked_user}"


class Contact(models.Model):
     class Meta:
         verbose_name_plural = ('Contact')
         ordering = ['id']

     name = models.CharField(max_length=50, blank=True)
     email = models.EmailField(max_length=254)
     message = models.TextField(max_length=500, blank=True)

     def __str__(self):
         return self.name