# Generated by Django 4.2 on 2024-10-10 20:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dating', '0023_profile_contact'),
    ]

    operations = [
        migrations.AddField(
            model_name='likenotification',
            name='closed_by_liked_user',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='likenotification',
            name='closed_by_liker',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='likenotification',
            name='status',
            field=models.CharField(choices=[('pending', 'pending'), ('accepted', 'accepted'), ('rejected', 'rejected')], default='pending', max_length=20),
        ),
    ]
