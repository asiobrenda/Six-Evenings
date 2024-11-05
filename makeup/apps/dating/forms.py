from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import SignUpUser

class SignUpCreationForm(UserCreationForm):
    class Meta:
        model = SignUpUser
        fields = ('username', 'email', 'password1', 'password2')
        label_suffix = ''

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user