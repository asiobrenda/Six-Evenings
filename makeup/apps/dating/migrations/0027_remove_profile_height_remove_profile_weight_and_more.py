# Generated by Django 4.2 on 2024-11-11 19:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dating', '0026_liveuser_latitude_liveuser_longitude'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='profile',
            name='height',
        ),
        migrations.RemoveField(
            model_name='profile',
            name='weight',
        ),
        migrations.AddField(
            model_name='profile',
            name='dob',
            field=models.DateField(blank=True, null=True),
        ),
    ]
