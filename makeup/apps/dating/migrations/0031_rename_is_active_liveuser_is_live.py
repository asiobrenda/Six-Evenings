# Generated by Django 4.2 on 2025-01-31 09:13

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dating', '0030_liveuser_is_active'),
    ]

    operations = [
        migrations.RenameField(
            model_name='liveuser',
            old_name='is_active',
            new_name='is_live',
        ),
    ]
