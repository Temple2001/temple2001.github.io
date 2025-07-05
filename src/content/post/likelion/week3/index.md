---
title: 멋사 -  3주차 Django 세션
description: 1학기동안 사용할 Django 프레임워크 알아보기
pubDate: 2024-03-20
tags: ['tmp']
---

# 목차

# 배운 내용 정리

## 웹프로그래밍

**인터넷** : TCP/IP라는 프로토콜(통신 규약)을 사용하는 하나의 네트워크

**웹** : 인터넷 네트워크를 기반으로 하는 수많은 응용 프로그램 중 하나 (이외에 이메일, 클라우드 등이 있음)

**URL** : Uniform Resource Locator, 인터넷 상의 리소스(웹 페이지, 이미지, 동영상 등)의 위치를 나타내는 주소

**HTML** : HyperText Markup Language, `<html>` , `<head>` , `<body>` 등의 태그로 이루어져 있는 **마크업** 언어

**HTTP** : HyperText Transfer Protocol, HTML같은 리소스를 가져올 때 사용하는 프로토콜(통신에 사용되는 두 컴퓨터 간의 약속)

## API

Application Programming Interface, 두 애플리케이션 사이에서 데이터를 전송할 수 있는 규칙의 집합이며 웹 프로그래밍에서는 클라이언트 애플리케이션과 서버 애플리케이션 사이의 규칙 집합을 의미한다.

API의 종류에는 대표적으로 **SOAP API, RPC API, Websocket API, REST API**가 있다.

<aside>
💡 **GraphQL과 REST API**

인터넷에서 REST API에 대해 검색하면 **GraphQL**이라는 개념을 자주 볼 수 있었는데, 이 둘은 어떤 공통점과 차이점이 있는지 궁금했다.

### 공통점

REST API와 GraphQL은 모두 클라이언트와 서버 사이에서 데이터를 전송할 수 있는 규칙의 집합이며, 따라서 둘 다 API에 속한다. 그래서 일반적인 API 아키텍쳐 원칙을 서로 공유하고 있으며 이 둘의 공통적인 원칙은 다음과 같다.

- 둘 다 상태를 저장하지 않으므로 서버가 요청 간에 응답 기록을 저장하지 않는다.
- 둘 다  클라이언트-서버 모델을 사용하므로 단일 클라이언트에서 요청하면 단일 서버에서 응답한다.
- 둘 다 기반 통신 프로토콜인 HTTP를 기반으로 한다.

### 차이점

GraphQL은 REST API의 한계를 극복하기 위해서 2012년에 등장한 새로운 API 형태이다. REST API는 설계 시점에서 어떤 요청에 어떤 데이터를 반환할 지를 모두 정해두기 때문에 고정적이고 엄격한 구조를 가지고 있다. 그리고 그 구조 때문에 원하는 데이터를 얻기 위해서는 불필요한 다른 데이터들을 같이 가져와야 하는 상황들이 빈번하다.

하지만 GraphQL은 쿼리 기반 솔루션을 가지고 있어 클라이언트가 원하는 데이터만 중점적으로 가져올 수 있다. 이는 REST API보다 필요한 대역폭과 데이터 가공 과정을 축소시킬 수 있다.

결국 REST API 대신 GraphQL을 사용한다면 API를 개발하는 서버쪽의 부담은 이전보다 커지지만 API를 사용하는 클라이언트의 부담은 이전보다 작아질 것이다. 각각의 장단점이 존재하므로 상황에 맞게 사용하는 것이 중요할 것이다.

</aside>

## REST API

REST : epresentational State Transfer, REST API(Representational State Transfer API)는 네트워크를 통해 자원을 생성, 읽기, 수정, 삭제(CRUD)하기 위한 소프트웨어 인터페이스를 제공하는 웹 서비스 아키텍처 스타일이다.

REST는 아래와 같은 요소로 구성된다.

- **자원(RESOURCE)** - **URI** : 자원은 동사가 아닌 명사로 표현
- **행위(Verb)** - **HTTP METHOD** : 자원에 대한 행위(Create, Read, Update, Delete)를 표현
    - GET, POST, PUT, DELETE 등이 있다.
- **표현(Representations) - JSON**

REST는 다음과 같은 특징을 가진다.

- **Uniform (유니폼 인터페이스)** : URI를 이용해 통일되고 한정적인 인터페이스로 수행
- **Stateless (무상태성)** : 작업을 위한 상태정보를 따로 저장하고 관리하지 않음
- **Cacheable (캐시 가능)** : HTTP를 사용하기 때문에 캐싱 기능도 사용 가능
- **Self-descriptiveness (자체 표현 구조)** : REST API 메시지만 보고도 이해 가능
- **Client - Server 구조** : 클라이언트와 서버의 각 역할을 확실하게 구분지어 의존성 저하
- **계층형 구조** : 다중 계층으로 구성될 수 있으며 네트워크 기반의 중간매체 사용 가능

## Django

Django는 파이썬으로 작성된 오픈소스 웹 **풀스택 프레임워크**이다.

Django는 다음과 같은 장점을 가지고 있다.

- **빠른 개발 속도**
- **Admin(관리자 인터페이스) 인터페이스 제공**
- **확장성**
- **ORM(Object-Relational Mapping)** : 데이터베이스와의 상호작용을 추상화하여 개발자가 SQL문을 직접 작성하지 않아도 객체 지향적인 방식으로 데이터베이스를 다룰 수 있다. (아마 JPA와 비슷한 맥락 아닐까)

Django는 애플리케이션을 **확장성**있게 만들기 위해 "**프로젝트**"와 "**앱**"이라는 개념을 사용한다.

하나의 Django 프로젝트는 여러 개의 앱을 포함할 수 있으며, 각 앱은 다양한 프로젝트에 연결될 수 있다.

- 프로젝트: 전체 웹 애플리케이션
- 앱: 프로젝트 내에서 특정한 기능을 제공하는 모듈

Django는 **MVC(Model View Controller)**를 기반으로 한 **MTV 디자인 패턴**이 적용된 웹 프레임워크이다.

MVC란, Model, View, Controller의 세 가지 주체로 역할을 구분해 애플리케이션을 구분하는 방법이다.

- **Model** : DB에 저장되는 데이터를 의미한다.
- **View** : 유저에게 보여지는 화면을 의미한다.
- **Controller** : 유저의 요청에 따라 적절한 로직을 수행하는 부분을 의미한다.

여기서 Django는 **View → Template, Controller → View**로 명칭을 바꾸어 MVC와 거의 유사한 구조를 사용하고 있다.

## Django 실습

### 1. 파이썬 가상환경 구축

파이썬은 각각의 프로젝트마다 모듈이나 패키지를 따로 저장하는 node.js나 Java와는 다르게 모듈이나 패키지를 설치할 때 기본 설정이 **전역설치**이다. 따라서 여러 파이썬 프로젝트들이 한 컴퓨터에 존재한다면 의존성 관리가 매우 어려워지게 된다. ~~(진짜 어려움…)~~

따라서 Django같이 어느정도 기본적인 규모가 있는 프로젝트는 시작부터 가상환경으로 구성하는 것이 현명한 방법이다.

아래는 Django 프로젝트를 위한 파이썬 가상환경 구성 코드이다.

```python
# zsh 또는 bash 설정을 통해 alias로 python3 -> python 으로 명령어를 바꾸었다. (Mac 기준)

# 가상환경 생성 (프로젝트 디렉토리에서 실행)
python -m venv {가상환경이름}

# 가상환경 실행
source venv/bin/activate

# 가상환경 종료
deactivate
```

### 2. Django 설치 및 프로젝트 생성

```python
# Django 설치 (반드시 가상환경 위에서!!!)
pip install django

# 프로젝트 생성
django-admin startproject {프로젝트이름} .
# 대부분 프로젝트 이름으로 config를 많이 사용하는 것 같다
django-admin startproject config .

# 프로젝트 실행
# 기본 URL : localhost:8000/
python manage.py runserver
```

### 3. SECRET_KEY 분리

Django에는 암호화된 세션, CSRF 토큰, 비밀번호 해싱 등 다양한 보안 기능에서 사용되는 **SECRET_KEY**가 있는데, 외부에 노출되면 안되기 때문에 따로 관리해야 한다. 여기서는 .json 파일에 SECRET_KEY를 옮기고 따로 읽어오는 방식을 선택했다.

config/settings.py 에서 SECRET_KEY 내용을 복사 후 해당 내용을 삭제한다.

```python
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "시크릿_키"
```

secrets.json을 프로젝트 최상단에 생성하고 SECRET_KEY를 넣는다.

```python
{
    "SECRET_KEY" : "시크릿_키"
}
```

그리고 settings.py에서 secrets.json 파일을 읽어오는 코드를 넣어 SECRET_KEY 변수에 할당시킨다.

```python
BASE_DIR = Path(__file__).resolve().parent.parent

secret_file = os.path.join(BASE_DIR, 'secrets.json') 

with open(secret_file) as f:
    secrets = json.loads(f.read())

def get_secret(setting, secrets=secrets): 
# secret 변수를 가져오거나 그렇지 못 하면 예외를 반환
    try:
        return secrets[setting]
    except KeyError:
        error_msg = "Set the {} environment variable".format(setting)
        raise ImproperlyConfigured(error_msg)

SECRET_KEY = get_secret("SECRET_KEY")
```

<aside>
💡 **python-dotenv를 이용한 SECRET_KEY 숨기기**

.json 파일을 이용해 SECRET_KEY를 숨기는 것도 하나의 방법이지만 .json 파일을 읽어오는 코드를 따로 작성해야 하는 불편함이 있다. `python-dotenv` 라는 외부 라이브러리를 이용해 스마트하게 SECRET_KEY를 숨겨보자.

먼저 dotenv를 설치한다.

```python
pip install python-dotenv
```

설치가 끝나면 `.env` 라는 이름을 가진 파일을 하나 생성하여 프로젝트 디렉토리 안에 위치시킨다. (보통 프로젝트 루트 디렉토리에 위치시킴) 그리고 SECRET_KEY를 작성한다.

```python
# .env

# 문자열을 쌍따옴표로 감쌀 필요 없이 그냥 작성한다
SECRET_KEY=대충길고복잡한시크릿키
```

SECRET_KEY를 사용할 코드에는 다음과 같이 작성한다.

```python
import os
from dotenv import load_dotenv

load_dotenv(verbose=True)

SECRET_KEY = os.getenv('SECRET_KEY')
```

이제 SECRET_KEY 변수를 사용할 수 있다.

</aside>

### 4. app 추가 절차

1. 아래와 같이 게시글을 담는 `posts` 앱을 생성한다.

```python
django-admin startapp posts
```

1. settings.py의 INSTALLED_APPS에 `posts` 라는 이름으로 등록한다.

```python
# Application definition

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

PROJECT_APPS = [
    'posts',
]

THIRD_PARTY_APPS = [

]

INSTALLED_APPS = DJANGO_APPS + PROJECT_APPS + THIRD_PARTY_APPS
```

위 코드는 관리를 편하게 하기 위해 INSTALLED_APPS를 세분화하였다.

1. ~~posts/models.py를 작성한다.~~ (생략)

1. posts/views.py를 작성한다.

```python
from django.shortcuts import render
from django.http import JsonResponse # 추가 
from django.shortcuts import get_object_or_404 # 추가

# Create your views here.

def hello_world(request):
    if request.method == "GET":
        return JsonResponse({
            'status' : 200,
            'data' : "Hello lielion-12th!"
        })
```

1. posts/urls.py를 수정한다. views.py에 생성한 `hello_world` 함수를 가리키도록 한다.

```python
from django.urls import path
from posts.views import *

urlpatterns = [
    path('', hello_world, name = 'hello_world'),
]
```

1. config/urls.py를 수정한다. 루트 url 뒤에 posts의 모든 url이 오도록 작성한다.

```python
from django.contrib import admin
from django.urls import path, include
from posts.views import *

urlpatterns = [
    path("admin/", admin.site.urls),
    path('', include('posts.urls')),
]
```

### 5. HTML로 Template 구현

먼저 해당 app 디렉토리(posts 디렉토리) 안에 `templates` 디렉토리를 생성하고 그 안에 `index.html` 파일을 만들어준다.

그 안에 HTML 내용을 작성한 뒤, posts/views.py를 수정해 index.html 파일이 렌더링 될 수 있도록 만든다.

```python
from django.shortcuts import render
from django.http import JsonResponse 
from django.shortcuts import get_object_or_404

# Create your views here.

def hello_world(request):
    if request.method == "GET":
        return JsonResponse({
            'status' : 200,
            'data' : "Hello lielion-12th!"
        })
    
def index(request):
    return render(request, 'index.html')
```

새 함수를 만들었다면 posts/urls.py에 추가하는 것도 잊지 않는다!

```python
from django.contrib import admin
from django.urls import path, include
from posts.views import *

urlpatterns = [
    path("admin/", admin.site.urls),
    path('', include('posts.urls')),
]
```

### 6. 기타 설정

[gitignore.io](https://www.toptal.com/developers/gitignore)에서 손쉽게 Django에 알맞은 .gitignore 를 구할 수 있다.

빠른 가상환경 세팅을 위해 requirements.txt 파일로 패키지 버전을 기록하고 관리한다.

```python
# 현재 패키지를 requirements.txt에 기록하기
pip freeze > requirements.txt

# requirements.txt에 기록된 패키지 설치하기
pip install -r requirements.txt
```

# 후기

드디어 기다리던 Django 세션이 시작되었다. 이전에 Django를 한 적은 있었지만 그 당시에는 매우 얕게 공부했었고 지금은 잘 기억이 나지 않기 때문에 새출발하는 마음으로 세션에 참여했다. 그래서 지루할 틈 없이 세션에 집중할 수 있었다는 생각이 든다. 그리고 세션 도중에 예전에 배웠던 Django에 대한 여러 개념들이 약하게나마 머릿속에 새록새록 떠올라 즐거웠다.

항상 드는 생각이지만 파이썬은 모듈/패키지 관리가 정말 고역인 것 같다. 매번 가상환경을 세팅해줘야 하는 번거로움이 파이썬에 재미를 붙이는 것을 방해하는 요인인 것 같다. 패키지를 명령어로 간단하게 설치하고 관리해주는 npm과 비교하면 정말 가슴이 답답해진다…