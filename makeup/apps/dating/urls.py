from django.urls import path
from django.contrib.auth.views import (LoginView, LogoutView)
from .import views

app_name = 'dating'

urlpatterns = [
    path('', views.home, name='home'),
    path('signUp/', views.sign_up, name='SignUp'),
    path('login/', LoginView.as_view(template_name='dating/login.html'), name='login'),
    #path("after-login/", views.after_login_redirect, name="after_login_redirect"),
    path('logout/', LogoutView.as_view(template_name='dating/logout.html'), name='logout'),
    path('CreateProfile/', views.create_profile, name='create_profile'),
    path('updateProfile/', views.update_profile, name='update_profile'),
    #path('live/', views.go_live, name='live'),
    path('peopleLive/', views.see_live, name='see_live'),
    path('notifications/', views.notifications, name='notifications'),
    path('getProfile/<int:profile_id>/', views.get_profile, name='get_profile'),
    path('accept/<int:accept_id>', views.accept, name='accept'),
    path('reject/<int:reject_id>', views.reject, name='reject'),
    path('undo/<int:undo_id>', views.undo_reject, name='undo_reject'),
    path('LikerNotifications/',  views.LikerNotifications, name='LikerNotifications'),
    path('closeLikeNotification/',  views.closeLikeNotification, name='closeLikeNotification'),
    path('closeLikerNotification/',  views.closeLikerNotification, name='closeLikerNotification'),
    path('Contact-Us/',  views.contact_us, name='contact_us'),
    path('stopLive/',  views.stopLive, name='stopLive'),
    path('updateLocation/',  views.update_location, name='updateLocation'),
    path('likerHasProfile/',  views.liker_has_profile, name='likerHasProfile'),
    path('analytics/',  views.analytics, name='analytics')
]