# Generated by Django 4.2 on 2024-08-13 10:26

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dating', '0006_alter_onlinemembers_options'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='onlinemembers',
            options={'ordering': ['description'], 'verbose_name': 'OnlineMembers', 'verbose_name_plural': 'OnlineMembers'},
        ),
    ]
