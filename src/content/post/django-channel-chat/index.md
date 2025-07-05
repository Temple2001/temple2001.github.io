---
title: Django channels를 이용한 웹소켓 서버 구현
description: 웹소켓 통신을 가능하게 해주는 Django의 channels 라이브러리를 이용해 웹소켓 서버를 구현해보자
pubDate: 2024-08-10
tags: ['tmp']
---

# 목차

# Django로 웹소켓 서버를 만들어보자
프로젝트 도중 채팅 기능을 위한 웹소켓 통신이 필요하게 되었다. 해당 프로젝트는 Django 프레임워크 기반의 백엔드 서버로 구현 중이었는데, Django에서 어떻게 웹소켓 API를 구현할 수 있을지 고민하던 도중 **channels**라는 라이브러리가 있다는 것을 알게 되었다.

# HTTP vs WebSocket
일반적인 API에서는 HTTP 통신을 사용하기 때문에 지속적인 데이터 교환이 필요할 때 곤란한 경우가 많이 발생한다.

첫번째는 매번 request와 response를 주고 받기 위해서 connection을 생성하고 종료해야하기 때문에 지속적인 통신이 발생할 때는 비효율적이고 오버헤드가 많이 발생하게 된다는 문제가 있다. 연결을 유지시켜주는 keep-alive 기능이 존재하긴 하지만 약간의 문제점이 존재한다고 한다.

두번째는 항상 client에서 request를 요청해야 server에서 response를 응답할 수 있기 때문에 server가 주도적으로 client에게 요청을 보낼 수 없다는 문제가 있다. 따라서 데이터의 변화나 이벤트를 감지하기 위해서는 client가 일정 시간 단위로 계속해서 request를 보내는 **polling** 방식을 사용해야 한다. 그렇기에 네트워크 비용이 많이 발생하여 비효율적이게 된다.

따라서 채팅 기능과 같이 지속적인 통신이 필요하고 데이터의 갱신이나 이벤트가 발생했을 때 그 내용을 즉시 client에게 전달해야 하는 상황에서는 HTTP 대신 WebSocket을 많이 사용한다.

웹소켓은 connection을 생성한 이후에 계속 유지되며, client -> server, server -> client 상관없이 양방향으로 통신이 가능하다. 따라서 효과적인 방식으로 실시간 서비스를 구현할 수 있다.

# Django channels 라이브러리
Django channels 라이브러리는 다음과 같은 아키텍처를 가지고 있다.

![](channels.png)

- **Interface Server**
인터페이스 서버는 HTTP/WebSocket 프로토콜과 파이썬으로 작성된 애플리케이션의 인터페이스 역할을 수행하는 서버이다.

- **Channel Layer**
채널 레이어는 비동기 메시지 중개자로 작동하여, 다른 서버 인스턴스에 있는 Consumer 간에 통신을 가능하게 한다. channels 라이브러리에서는 Redis를 사용하도록 권장하고 있다.

- **Worker Processes**
통신을 비동기적으로 처리하고, 필요에 따라 백그라운드 작업을 실행한다.

- **Consumer (HTTP/WebSocket)**
HTTP 또는 WebSocket 연결을 처리하는 코드이다. Django의 View와 유사한 개념으로, HTTP의 경우에는 기존 View 형태와 동일하다고 보면 되고 Websocket의 경우에는 View와 달리 Consumer라고 지칭하기도 한다.

---

따라서 Django channels로 웹소켓 통신을 구현하면 다음과 같은 흐름으로 진행된다.

1. 클라이언트가 웹소켓을 통해 서버에 연결을 시도한다.
2. 연결이 성립되면, 서버 측 Channels는 해당 클라이언트를 위한 새로운 채널을 생성하고, 이를 특정 그룹에 할당한다. 그룹은 관련 있는 여러 채널들의 집합으로 볼 수 있다. 예를 들어 같은 채팅방의 참여자들을 같은 그룹에 할당할 수 있다.
3. 클라이언트는 할당된 채널을 통해 메시지를 보내고, 서버는 이 메시지를 받아 처리한다. 이때, 메시지가 그룹에 속한 모든 채널에게 전달된다.
4. Redis channel layer는 이러한 그룹 내의 메시지 전달을 도와주는 중계자의 역할을 한다. 클라이언트에서 서버로 메시지가 전달되면, 서버는 해당 메시지를 Redis를 통해 해당 그룹의 모든 채널에게 브로드캐스트한다.
5. 그룹에 속한 모든 채널, 즉 클라이언트들은 이 메시지를 실시간으로 수신한다.

# 구현
## settings.py
Django 프로젝트에 다음과 같은 명령어로 필요한 요소들을 pip로 설치한다.
```shell
pip install channels channels-redis redis daphne djangorestframework django-cors-headers
```

그리고 `settings.py`에 설치한 라이브러리들과 앱(이 프로젝트에서는 chat)을 등록시킨다.
```python title="settings.py"
DAPHNE = [
    "daphne",
]

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

PROJECT_APPS = [
    ...
    'chat',
]

THIRD_PARTY_APPS = [
    ...
    "corsheaders",
    'rest_framework',
    "channels",
]

INSTALLED_APPS = DAPHNE + DJANGO_APPS + PROJECT_APPS + THIRD_PARTY_APPS
```

일반적으로 사용하는 WSGI 대신 웹소켓 통신을 위한 비동기 처리를 지원하는 ASGI를 사용하기 위해 ASGI_APPLICATION도 적어준다.
```python title="settings.py"
ASGI_APPLICATION = 'config.asgi.application'
```

Redis channel layer를 사용하기 위해 아래와 같이 설정해준다.
6379 포트로 실행되고 있는 Redis가 서버 내에 존재해야 한다.
```python title="settings.py"
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(os.environ.get('REDIS_HOST', 'localhost'), 6379)],
        },
    },
}
```

## asgi.py
ASGI로 동작하기 위해 `asgi.py`를 작성해야 한다.
```python title="asgi.py"
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
import chat.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket":
        AuthMiddlewareStack(
            URLRouter(
                chat.routing.websocket_urlpatterns
            ),
    ),
})
```

위 코드에서 `ProtocoTypeRouter`는 Django로 들어오는 요청을 프로토콜 유형에 따라 처리하기 위해 사용된다. HTTP는 Django의 ASGI application으로 보내져 일반적인 HTTP API 요청을 처리하고, Websocket은 별도로 명시한 URL 라우터로 넘겨준다.

일반적인 HTTP 요청은 다른 Django 프로젝트와 비슷화게 `urls.py`를 작성하여 라우팅하면 되지만, Websocket 요청은 위 코드에 나타난 `routing.py`를 따로 작성하여 라우팅하여야 한다.

## models.py
프로젝트의 채팅 기능 요구사항은 다음과 같다.
> 유저는 물건을 대여하는 물건 주인과 물건을 대여받기를 희망하는 고객의 두가지 형태로 나뉘며, 물건 주인과 고객은 거래를 하고자 하는 물건에 해당하는 채팅방을 생성하고 참여하게 된다.

따라서 아래와 같이 모델화하였다.
```python title="models.py"
from django.db import models

# Create your models here.
class ChatRoom(models.Model):
    shop_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='shop_user')
    visitor_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='visitor_user')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('shop_user', 'visitor_user', 'product')

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='sender')
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
```

`ChatRoom`은 이름 그대로 채팅방이며, `Message`는 `ChatRoom`에서 발생하는 채팅 텍스트를 의미한다. `ChatRoom`은 물건 주인, 고객, 상품을 묶어서 고유성을 띄도록 만들었다.

## consumers.py
가장 중요한 부분이다. `consumers.py`는 Websocket 요청이 들어와 처리되는 곳이며, channels 라이브러리 기능의 대부분을 여기서 사용하게 된다.

```python title="consumers.py"
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from accounts.models import User
from chat.models import ChatRoom, Message

# 각 클라이언트마다 '채널'을 보유하고 있음

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # 클라이언트가 웹소켓에 연결하려고 할 때 호출
        # url 경로에서 room_id를 추출하고 해당하는 방이 있다면 해당 그룹에 현재 채널을 추가하고 연결을 수락
        try:
            self.room_id = self.scope['url_route']['kwargs']['room_id']

            if not await self.check_room_exists(self.room_id):
                raise ValueError("채팅방이 존재하지 않습니다.")

            group_name = self.get_group_name(self.room_id)

            await self.channel_layer.group_add(group_name, self.channel_name)
            await self.accept()
        except ValueError as e:
            await self.send_json({'error': str(e)})
            await self.close()


    async def disconnect(self, close_code):
        # 클라이언트가 웹소켓 연결을 종료할 때 호출
        # 해당 그룹에서 클라이언트의 채널을 제거
        try:
            group_name = self.get_group_name(self.room_id)
            await self.channel_layer.group_discard(group_name, self.channel_name)
        except Exception as e:
            pass


    async def receive_json(self, content, **kwargs):
        # 클라이언트로부터 Json 메시지를 받았을 때 호출
        # 받은 메시지를 데이터베이스에 저장하고 동일한 그룹 내의 모든 채널(클라이언트)에 메시지를 전송
        try:
            message = content['message']
            sender_email = content['sender_email']
            room_id = content['room_id']

            sender, room = await self.get_user_and_chatroom(sender_email, room_id)

            # room_id 업데이트
            self.room_id = str(room.id)

            # 그룹 이름 가져오기
            group_name = self.get_group_name(self.room_id)

            # 수신된 메시지를 데이터베이스에 저장
            await self.save_message(room, sender, message)

            # 메시지를 전체 그룹에 전송
            await self.channel_layer.group_send(group_name, {
                'type': 'chat_message',
                'message': message,
                'sender_username': sender.username
            })

        except ValueError as e:
            await self.send_json({'error': str(e)})


    async def chat_message(self, event):
        # 그룹 내의 다른 클라이언트로부터 메시지를 받았을 때 호출
        # 받은 메시지를 현재 채널(클라이언트)에 전송한다
        try:
            message = event['message']
            sender_username = event['sender_username']

            await self.send_json({'message': message, 'sender_username': sender_username})
        except Exception as e:
            await self.send_json({'error': '메시지 전송 실패'})


    @staticmethod
    def get_group_name(room_id):
        return f'chat_room_{room_id}'


    @database_sync_to_async
    def get_user_and_chatroom(self, sender_email, room_id):
        sender = User.objects.get(email=sender_email)
        room = ChatRoom.objects.get(id=room_id)
        return sender, room


    @database_sync_to_async
    def save_message(self, room, sender, message_text):
        if not message_text:
            raise ValueError("메시지 텍스트가 필요합니다.")

        # 메시지를 생성하고 데이터베이스에 저장
        Message.objects.create(room=room, sender=sender, text=message_text)


    @database_sync_to_async
    def check_room_exists(self, room_id):
        return ChatRoom.objects.filter(id=room_id).exists()
```
Django channels 라이브러리에서 제공하는 `AsyncJsonWebsocketConsumer`를 상속한 `ChatConsumer` 클래스를 만든다.

`AsyncJsonWebsocketConsumer`는 `AsyncWebsocketConsumer`를 상속하며 JSON 메시지를 사용해 웹소켓 통신을 손쉽게 다룰 수 있도록 도와준다. 웹소켓을 통해 전달되는 메시지를 자동으로 JSON으로 직렬화,역직렬화 시킨다.
`self.send_json(content)` 메서드를 사용하여 Python 객체를 JSON으로 직렬화 시키거나 `receive_json(self, content)` 메서드를 구현하여 역직렬화시킬 수 있다.

자세한 코드 내용은 다음과 같다.

- `connect(self)`
클라이언트가 웹소켓에 연결하려고 할 때 호출된다. URL 경로에서 방 ID를 추출하고, 해당 방이 실제로 존재하는지 확인한 후, 해당 그룹에 현재 채널을 추가한다. 연결이 성공하면 이를 클라이언트에 알리기 위해 연결을 수락한다.

- `disconnect(self, close_code)`
클라이언트가 웹소켓 연결을 종료할 때 호출된다. 해당 그룹에서 현재 채널을 제거한다.

- `receive_json(self, content)`
웹소켓에 연결된 상태에서 클라이언트로부터 JSON 메시지를 받았을 때 호출된다. 수신한 메시지를 데이터베이스에 저장하고, 동일한 그룹 내의 모든 클라이언트에 메시지를 전송한다.

- `chat_message(self, event)`
웹소켓에 연결된 상태에서 그룹 내의 다른 클라이언트로부터 메시지를 받았을 때 호출된다. 받은 메시지를 현재 채널(클라이언트)에 전송한다.

이때 위 코드에서 `@database_sync_to_async`가 붙어있는 메서드를 확인할 수 있다.

Django channels로 비동기 프로토콜을 처리하기 위해 비동기 코드를 사용하는데, 이러한 비동기 로직 중간에 동기적인 데이터베이스 연산을 그냥 수행하게 된다면 해당 연산이 완료될 때까지 전체 비동기 실행 흐름이 막히게 되어 여러 문제와 성능 저하를 일으킬 수 있다.

따라서 `@database_sync_to_async`를 사용해 동기적인 데이터베이스 연산을 비동기적으로 변환하여 정상적으로 실행될 수 있도록 만들어야 한다.
위 코드에서 `get`, `create`, `filter` 같은 데이터베이스 연산이 있는 메서드에 이 데코레이터가 붙은 것을 확인할 수 있다.

## routing.py
`routing.py`를 작성하여 websocket 요청을 보낼 URL 경로를 생성 및 지정한다.
```python title="routing.py"
from django.urls import path

from chat import consumers

websocket_urlpatterns = [
    path("ws/room/<int:room_id>/messages", consumers.ChatConsumer.as_asgi()),
]
```

## 기타 HTTP 코드
`asgi.py`에서 HTTP와 웹소켓 프로토콜을 분리하여 처리하였기 때문에, 채팅방 생성, 기존 채팅방 정보 조회같은 일반적인 HTTP API는 다른 Django 프로젝트처럼 `views.py`를 작성하여 구현하면 된다. 따라서 이 글에서 따로 작성하지는 않았다.

# 후기
Django로 웹소켓 기능을 구현해야 한다는 요구사항을 처음 들었을 때는 정말 막막했는데, channels라는 좋은 라이브러리 덕분에 손쉽게 구현할 수 있었다.
그리고 channels에 대해 알아보면서 ASGI의 존재를 새로 알 수 있었고, 기존의 WSGI와 더불어 웹 애플리케이션과 웹 서버 간의 인터페이스(미들웨어)가 어떻게 작동하는지 한번더 짚고 넘어갈 수 있었던 경험이 되었다고 생각한다.

# 참고
[minjae_dev.log - DRF로 웹소켓 채팅 서버 구현하기](https://velog.io/@mimijae/series/DRF%EB%A1%9C-%EC%9B%B9%EC%86%8C%EC%BC%93-%EC%B1%84%ED%8C%85-%EC%84%9C%EB%B2%84-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0)