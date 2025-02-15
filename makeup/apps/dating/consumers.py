import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import LikeNotification, SignUpUser, LiveUser, Profile
import logging


logger = logging.getLogger(__name__)

class LikeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['user'].id
        group_name = f"user_{self.user_id}"
        await self.channel_layer.group_add(group_name, self.channel_name)
        await self.accept()
        logger.info(f"User {self.user_id} connected to group {group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(f"user_{self.user_id}", self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('type')
            print('---'*40)
            print(data)

            if action == 'like':
                liker_id = data['likerId']
                liked_user_id = data['likedUserId']

                # Save the like notification
                await self.save_like_notification(liker_id, liked_user_id)

                # Notify the liked user
                await self.notify_user_of_like(liker_id, liked_user_id)

            else:
                logger.warning(f"Unknown action: {action}")

        except Exception as e:
            logger.error(f"Error in receive method: {str(e)}")
            await self.send_error(f"An error occurred: {str(e)}")

    @sync_to_async
    def save_like_notification(self, liker_id, liked_user_id):
        try:
            # Step 1: Fetch the profile of the liked user
            liked_user_profile = Profile.objects.get(id=liked_user_id)
            liked_user = liked_user_profile.user  # Get the user associated with the profile

            # Step 2: Check if the user is live
            liked_user_live = LiveUser.objects.filter(user=liked_user, is_live=True).first()

            if liked_user_live is None:
                return  # Exit if the user is not live

            # Step 3: Fetch the liker user
            liker_user = SignUpUser.objects.get(id=liker_id)

            # Step 4: Create the like notification
            LikeNotification.objects.create(
                liker=liker_user,
                liked_user=liked_user,  # Use the user associated with the profile
                message=f"{liker_user.username} liked you!"
            )
        except Profile.DoesNotExist:
            logger.error(f"Profile with ID {liked_user_id} does not exist.")
        except SignUpUser.DoesNotExist:
            logger.error(f"Liker with ID {liker_id} does not exist.")
        except Exception as e:
            logger.error(f"Error saving like notification: {str(e)}")


    @sync_to_async
    def get_pending_notifications_count(self, liked_user_id):
        return LikeNotification.objects.filter(liked_user_id=liked_user_id, status='pending').count()

    async def notify_user_of_like(self, liker_id, liked_user_id):
        notification_count = await self.get_pending_notifications_count(liked_user_id)
        await self.channel_layer.group_send(
            f"user_{liked_user_id}",
            {
                'type': 'send_notification',
                'message': f"User {liker_id} liked you!",
                'notification_count': notification_count,
                'notification_type': 'like'
            }
        )

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'notification': event['message'],
            'notification_count': event['notification_count'],
            'notification_type': event['notification_type']  # Include type in the response
        }))

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            'error': message
        }))
