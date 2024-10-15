from channels.generic.websocket import AsyncWebsocketConsumer
import json

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if self.user.is_authenticated:
            self.group_name = f"notifications_{self.user.id}"
            print(f"User: {self.user.username}, Group: {self.group_name}")
        else:
            self.group_name = "anonymous"
            print("User is not authenticated, using 'anonymous' group")

        # Join the group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        print('---'*10, 'WebSocket Disconnected', '---'*10)
        print(f"User: {self.user.username}, Group: {self.group_name}")

        # Leave room group
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        notification_count = event['notification_count']
        print('---'*10, 'Sending Notification to WebSocket', '---'*10)
        print(f"Notification Count: {notification_count}")

        await self.send(text_data=json.dumps({
            'notification_count': notification_count
        }))
