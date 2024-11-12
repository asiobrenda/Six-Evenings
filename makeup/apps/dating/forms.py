from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import SignUpUser

from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import SignUpUser

class SignUpCreationForm(UserCreationForm):
    class Meta:
        model = SignUpUser
        fields = ('username', 'email', 'password1', 'password2')
        label_suffix = ''

    def __init__(self, *args, **kwargs):
        super(SignUpCreationForm, self).__init__(*args, **kwargs)
        # Add a placeholder for the username field with an example
        self.fields['username'].widget.attrs.update({
            'placeholder': 'e.g., user123, john_doe'
        })

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user
