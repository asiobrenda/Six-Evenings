# Generated by Django 4.2 on 2024-09-03 22:07

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('dating', '0015_alter_profile_bio_alter_profile_color_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='liveuser',
            name='profile',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='dating.profile'),
        ),
    ]
